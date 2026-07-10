import { prisma } from '../config/database.js';
import { NotFoundError, BadRequestError } from '../utils/apiError.js';
const ComplaintStatus = {
  PENDING: 'PENDING',
  VERIFIED: 'VERIFIED',
  IN_PROGRESS: 'IN_PROGRESS',
  RESOLVED: 'RESOLVED',
  VALIDATED: 'VALIDATED',
  REJECTED: 'REJECTED',
};

const ActorType = {
  USER: 'USER',
  OFFICER: 'OFFICER',
  SYSTEM: 'SYSTEM',
};

export class ComplaintService {
  static async createComplaint(data) {
    // Verify user exists
    const user = await prisma.user.findUnique({ where: { id: data.userId } });
    if (!user) {
      throw new BadRequestError('Reporter User not found');
    }

    // Auto-resolve departmentId based on name, category, or title keywords
    let resolvedDepartmentId = data.departmentId || null;
    if (!resolvedDepartmentId) {
      const matchSource = `${data.departmentName || ''} ${data.category || ''} ${data.title || ''}`.toLowerCase();
      if (matchSource.includes('water') || matchSource.includes('sewer') || matchSource.includes('drain') || matchSource.includes('leak') || matchSource.includes('flood') || matchSource.includes('waterlog')) {
        resolvedDepartmentId = 'dept-water';
      } else if (matchSource.includes('sanitat') || matchSource.includes('garbage') || matchSource.includes('waste') || matchSource.includes('litter') || matchSource.includes('dump') || matchSource.includes('hygeine') || matchSource.includes('smell') || matchSource.includes('odour') || matchSource.includes('mosquito')) {
        resolvedDepartmentId = 'dept-sanitation';
      } else if (matchSource.includes('electr') || matchSource.includes('power') || matchSource.includes('wire') || matchSource.includes('current') || matchSource.includes('light') || matchSource.includes('outage')) {
        resolvedDepartmentId = 'dept-electricity';
      } else if (matchSource.includes('road') || matchSource.includes('pothole') || matchSource.includes('infra') || matchSource.includes('pavement') || matchSource.includes('sidewalk') || matchSource.includes('footpath')) {
        resolvedDepartmentId = 'dept-roads';
      }
    }

    if (resolvedDepartmentId) {
      const dept = await prisma.department.findUnique({ where: { id: resolvedDepartmentId } });
      if (!dept) {
        throw new BadRequestError('Department not found');
      }
    }

    return prisma.$transaction(async (tx) => {
      // Find the department head for auto-routing/auto-assignment
      let assignedOfficerId = null;
      if (resolvedDepartmentId) {
        const deptHead = await tx.officer.findFirst({
          where: {
            departmentId: resolvedDepartmentId,
            role: 'DEPT_HEAD',
          }
        });
        if (deptHead) {
          assignedOfficerId = deptHead.id;
        }
      }

      const complaint = await tx.complaint.create({
        data: {
          title: data.title,
          description: data.description,
          category: data.category,
          latitude: data.latitude,
          longitude: data.longitude,
          address: data.address,
          userId: data.userId,
          departmentId: resolvedDepartmentId,
          officerId: assignedOfficerId,
          status: ComplaintStatus.PENDING,
        },
      });

      // Handle image URLs from both list and single-field sources
      const imageList = [];
      if (data.images && data.images.length > 0) {
        imageList.push(...data.images);
      }
      if (data.imageUrl) {
        imageList.push(data.imageUrl);
      }

      if (imageList.length > 0) {
        await tx.image.createMany({
          data: imageList.map((url) => ({
            url,
            complaintId: complaint.id,
          })),
        });
      }

      // Record initial status history
      await tx.statusHistory.create({
        data: {
          complaintId: complaint.id,
          previousStatus: ComplaintStatus.PENDING,
          newStatus: ComplaintStatus.PENDING,
          remarks: 'Complaint registered successfully',
          changedById: data.userId,
          changedByType: ActorType.USER,
        },
      });

      return tx.complaint.findUnique({
        where: { id: complaint.id },
        include: { images: true },
      });
    });
  }

  static async getAllComplaints(filters, pagination) {
    const page = pagination.page || 1;
    const limit = pagination.limit || 10;
    const skip = (page - 1) * limit;

    const whereClause = {};

    if (filters.category) {
      whereClause.category = filters.category;
    }
    if (filters.status) {
      whereClause.status = filters.status;
    }
    if (filters.severity) {
      whereClause.severity = filters.severity;
    }
    if (filters.departmentId) {
      whereClause.departmentId = filters.departmentId;
    }
    if (filters.officerId) {
      const officer = await prisma.officer.findUnique({ where: { id: filters.officerId } });
      if (officer && (officer.role === 'DEPT_HEAD' || officer.role === 'dept_head')) {
        whereClause.departmentId = officer.departmentId;
      } else {
        whereClause.officerId = filters.officerId;
      }
    }
    if (filters.userId) {
      whereClause.userId = filters.userId;
    }
    if (filters.search) {
      whereClause.OR = [
        { title: { contains: filters.search } },
        { description: { contains: filters.search } },
        { address: { contains: filters.search } },
      ];
    }

    const [total, data] = await prisma.$transaction([
      prisma.complaint.count({ where: whereClause }),
      prisma.complaint.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          images: { select: { url: true } },
          department: { select: { name: true } },
          user: { select: { id: true, name: true } },
          officer: { select: { id: true, name: true } },
        },
      }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getComplaintById(id) {
    const complaint = await prisma.complaint.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            phone: true,
            status: true,
          },
        },
        department: true,
        officer: {
          select: {
            id: true,
            name: true,
            username: true,
            role: true,
          },
        },
        images: true,
        aiAnalysis: true,
        statusHistory: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!complaint) {
      throw new NotFoundError('Complaint not found');
    }

    return complaint;
  }

  static async updateComplaintStatus(id, data) {
    const complaint = await prisma.complaint.findUnique({ where: { id } });
    if (!complaint) {
      throw new NotFoundError('Complaint not found');
    }

    if (complaint.status === data.status) {
      throw new BadRequestError(`Complaint status is already ${data.status}`);
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.complaint.update({
        where: { id },
        data: { status: data.status },
      });

      // Log status transition
      await tx.statusHistory.create({
        data: {
          complaintId: id,
          previousStatus: complaint.status,
          newStatus: data.status,
          remarks: data.remarks || `Status changed from ${complaint.status} to ${data.status}`,
          changedById: data.changedById,
          changedByType: data.changedByType,
        },
      });

      // Notify the user who created it
      await tx.notification.create({
        data: {
          title: 'Complaint Status Updated',
          message: `Your complaint "${complaint.title}" status has changed to ${data.status}.`,
          userId: complaint.userId,
          type: 'UPDATE',
        },
      });

      return updated;
    });
  }

  static async assignComplaint(id, data) {
    const complaint = await prisma.complaint.findUnique({ where: { id } });
    if (!complaint) {
      throw new NotFoundError('Complaint not found');
    }

    const updateData = {};

    if (data.departmentId !== undefined) {
      if (data.departmentId !== null) {
        const dept = await prisma.department.findUnique({ where: { id: data.departmentId } });
        if (!dept) {
          throw new BadRequestError('Department not found');
        }
      }
      updateData.departmentId = data.departmentId;
    }

    if (data.officerId !== undefined) {
      if (data.officerId !== null) {
        const officer = await prisma.officer.findUnique({ where: { id: data.officerId } });
        if (!officer) {
          throw new BadRequestError('Officer not found');
        }
        if (!updateData.departmentId) {
          updateData.departmentId = officer.departmentId;
        }
      }
      updateData.officerId = data.officerId;
    }

    if (complaint.status === ComplaintStatus.PENDING) {
      updateData.status = ComplaintStatus.IN_PROGRESS;
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.complaint.update({
        where: { id },
        data: updateData,
      });

      if (updateData.status) {
        await tx.statusHistory.create({
          data: {
            complaintId: id,
            previousStatus: complaint.status,
            newStatus: updateData.status,
            remarks: 'Complaint status set to IN_PROGRESS upon assignment',
            changedById: data.officerId || 'SYSTEM',
            changedByType: data.officerId ? ActorType.OFFICER : ActorType.SYSTEM,
          },
        });
      }

      if (data.officerId) {
        await tx.notification.create({
          data: {
            title: 'New Complaint Assigned',
            message: `You have been assigned to complaint: "${complaint.title}"`,
            officerId: data.officerId,
            type: 'ALERT',
          },
        });
      }

      return updated;
    });
  }
}

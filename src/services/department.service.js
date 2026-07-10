import { prisma } from '../config/database.js';
import { NotFoundError, BadRequestError } from '../utils/apiError.js';

export class DepartmentService {
  static async createDepartment(data) {
    const existing = await prisma.department.findUnique({
      where: { name: data.name },
    });
    if (existing) {
      throw new BadRequestError('Department name already exists');
    }
    return prisma.department.create({
      data,
    });
  }

  static async getAllDepartments() {
    return prisma.department.findMany({
      include: {
        _count: {
          select: { officers: true, complaints: true },
        },
      },
    });
  }

  static async getDepartmentById(id) {
    const department = await prisma.department.findUnique({
      where: { id },
      include: {
        officers: {
          select: {
            id: true,
            name: true,
            username: true,
            role: true,
            status: true,
          },
        },
      },
    });

    if (!department) {
      throw new NotFoundError('Department not found');
    }

    // Calculate additional metrics
    const complaintCounts = await prisma.complaint.groupBy({
      by: ['status'],
      where: { departmentId: id },
      _count: { _all: true },
    });

    const metrics = {
      totalComplaints: 0,
      pending: 0,
      inProgress: 0,
      resolved: 0,
      rejected: 0,
    };

    complaintCounts.forEach((group) => {
      const count = group._count._all;
      metrics.totalComplaints += count;
      if (group.status === 'PENDING') metrics.pending = count;
      else if (group.status === 'IN_PROGRESS') metrics.inProgress = count;
      else if (group.status === 'RESOLVED') metrics.resolved = count;
      else if (group.status === 'REJECTED') metrics.rejected = count;
    });

    return {
      ...department,
      metrics,
    };
  }

  static async updateDepartment(id, data) {
    await this.getDepartmentById(id); // Ensure exists

    if (data.name) {
      const existing = await prisma.department.findFirst({
        where: { name: data.name, NOT: { id } },
      });
      if (existing) {
        throw new BadRequestError('Department name already exists');
      }
    }

    return prisma.department.update({
      where: { id },
      data,
    });
  }

  static async deleteDepartment(id) {
    await this.getDepartmentById(id); // Ensure exists
    return prisma.department.delete({
      where: { id },
    });
  }
}

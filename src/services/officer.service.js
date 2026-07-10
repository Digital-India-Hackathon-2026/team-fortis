import { prisma } from '../config/database.js';
import { NotFoundError, BadRequestError } from '../utils/apiError.js';

export class OfficerService {
  static async createOfficer(data) {
    const existing = await prisma.officer.findUnique({
      where: { username: data.username },
    });
    if (existing) {
      throw new BadRequestError('Officer username already registered');
    }

    // Check if department exists
    const dept = await prisma.department.findUnique({
      where: { id: data.departmentId },
    });
    if (!dept) {
      throw new BadRequestError('Department not found');
    }

    const passwordHash = `hash_${data.password}`; // Mock hashing

    return prisma.officer.create({
      data: {
        name: data.name,
        username: data.username,
        passwordHash,
        departmentId: data.departmentId,
        role: data.role || 'OFFICER',
      },
      include: {
        department: true,
      },
    });
  }

  static async getAllOfficers(departmentId) {
    return prisma.officer.findMany({
      where: departmentId ? { departmentId } : {},
      include: {
        department: true,
        _count: {
          select: { complaints: true },
        },
      },
    });
  }

  static async getOfficerById(id) {
    const officer = await prisma.officer.findUnique({
      where: { id },
      include: {
        department: true,
        complaints: {
          take: 10,
          orderBy: { updatedAt: 'desc' },
        },
      },
    });

    if (!officer) {
      throw new NotFoundError('Officer not found');
    }

    return officer;
  }

  static async updateOfficer(id, data) {
    // Verify officer exists
    await this.getOfficerById(id);

    if (data.departmentId) {
      const dept = await prisma.department.findUnique({
        where: { id: data.departmentId },
      });
      if (!dept) {
        throw new BadRequestError('Department not found');
      }
    }

    return prisma.officer.update({
      where: { id },
      data,
      include: {
        department: true,
      },
    });
  }
}

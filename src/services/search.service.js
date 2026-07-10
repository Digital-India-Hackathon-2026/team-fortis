import { prisma } from '../config/database.js';

export class SearchService {
  static async searchAll(query) {
    if (!query) {
      return { complaints: [], departments: [], officers: [] };
    }

    const [complaints, departments, officers] = await prisma.$transaction([
      prisma.complaint.findMany({
        where: {
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { category: { contains: query, mode: 'insensitive' } },
            { address: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: 10,
        include: {
          department: { select: { name: true } },
        },
      }),
      prisma.department.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: 5,
      }),
      prisma.officer.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { username: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: 5,
        select: {
          id: true,
          name: true,
          username: true,
          role: true,
          department: { select: { name: true } },
        },
      }),
    ]);

    return {
      complaints,
      departments,
      officers,
    };
  }
}

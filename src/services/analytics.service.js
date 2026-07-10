import { prisma } from '../config/database.js';
const ComplaintStatus = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  RESOLVED: 'RESOLVED',
  REJECTED: 'REJECTED',
};

export class AnalyticsService {
  static async getSummary() {
    const total = await prisma.complaint.count();
    const statusCounts = await prisma.complaint.groupBy({
      by: ['status'],
      _count: {
        _all: true,
      },
    });

    const statusMap = {
      PENDING: 0,
      IN_PROGRESS: 0,
      RESOLVED: 0,
      REJECTED: 0,
    };

    statusCounts.forEach((group) => {
      statusMap[group.status] = group._count._all;
    });

    const resolutionRate = total > 0 ? (statusMap.RESOLVED / total) * 100 : 0;

    const resolvedComplaints = await prisma.complaint.findMany({
      where: { status: ComplaintStatus.RESOLVED },
      select: { createdAt: true, updatedAt: true },
    });

    let avgResolutionTimeHours = 0;
    if (resolvedComplaints.length > 0) {
      const totalTimeMs = resolvedComplaints.reduce((acc, comp) => {
        const timeDiff = comp.updatedAt.getTime() - comp.createdAt.getTime();
        return acc + timeDiff;
      }, 0);

      avgResolutionTimeHours = totalTimeMs / (1000 * 60 * 60 * resolvedComplaints.length);
    }

    return {
      totalComplaints: total,
      statusBreakdown: statusMap,
      resolutionRate: parseFloat(resolutionRate.toFixed(2)),
      avgResolutionTimeHours: parseFloat(avgResolutionTimeHours.toFixed(1)),
    };
  }

  static async getDepartmentComparison() {
    const departments = await prisma.department.findMany({
      include: {
        _count: {
          select: { complaints: true, officers: true },
        },
        complaints: {
          select: { status: true },
        },
      },
    });

    return departments.map((dept) => {
      const total = dept._count.complaints;
      const resolved = dept.complaints.filter((c) => c.status === ComplaintStatus.RESOLVED).length;
      const resolutionRate = total > 0 ? (resolved / total) * 100 : 0;

      return {
        id: dept.id,
        name: dept.name,
        officerCount: dept._count.officers,
        totalComplaints: total,
        resolvedComplaints: resolved,
        resolutionRate: parseFloat(resolutionRate.toFixed(2)),
      };
    });
  }

  static async getTrends() {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const complaints = await prisma.complaint.findMany({
      where: {
        createdAt: { gte: sixMonthsAgo },
      },
      select: {
        createdAt: true,
        status: true,
      },
    });

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const trendMap = {};

    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const label = `${months[d.getMonth()]} ${d.getFullYear().toString().substring(2)}`;
      trendMap[label] = { filed: 0, resolved: 0 };
    }

    complaints.forEach((comp) => {
      const date = comp.createdAt;
      const label = `${months[date.getMonth()]} ${date.getFullYear().toString().substring(2)}`;

      if (trendMap[label]) {
        trendMap[label].filed += 1;
        if (comp.status === ComplaintStatus.RESOLVED) {
          trendMap[label].resolved += 1;
        }
      }
    });

    return Object.keys(trendMap).map((key) => ({
      month: key,
      filed: trendMap[key].filed,
      resolved: trendMap[key].resolved,
    }));
  }
}

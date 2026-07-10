import { PrismaClient, Role, OfficerRole, ComplaintStatus, Severity, ActorType, NotificationType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  await prisma.auditLog.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.statusHistory.deleteMany({});
  await prisma.aIAnalysis.deleteMany({});
  await prisma.image.deleteMany({});
  await prisma.complaint.deleteMany({});
  await prisma.officer.deleteMany({});
  await prisma.department.deleteMany({});
  await prisma.user.deleteMany({});

  const citizen = await prisma.user.create({
    data: {
      name: 'Rohan Sharma',
      username: 'rohan_sharma',
      phone: '+919876543210',
      passwordHash: 'hash_password123',
      role: Role.CITIZEN,
    },
  });

  const admin = await prisma.user.create({
    data: {
      name: 'Admin User',
      username: 'admin',
      phone: '+919999999999',
      passwordHash: 'hash_admin123',
      role: Role.ADMIN,
    },
  });

  const sanitation = await prisma.department.create({
    data: {
      name: 'Sanitation & Waste Management',
      description: 'Responsible for public garbage disposal, cleaning sewers, and disease control.',
    },
  });

  const roads = await prisma.department.create({
    data: {
      name: 'Roads & Infrastructure',
      description: 'Handles potholes, broken pavements, damaged streetlights, and traffic signs.',
    },
  });

  await prisma.department.create({
    data: {
      name: 'Water Supply & Sewage',
      description: 'Deals with clean drinking water pipes, sewage leaks, and drainage.',
    },
  });

  const sanitationHead = await prisma.officer.create({
    data: {
      name: 'Inspector Vijay Kumar',
      username: 'vijay_sanitation',
      passwordHash: 'hash_officer123',
      role: OfficerRole.DEPT_HEAD,
      departmentId: sanitation.id,
    },
  });

  const roadsOfficer = await prisma.officer.create({
    data: {
      name: 'Engineer Anil Mehta',
      username: 'anil_roads',
      passwordHash: 'hash_officer123',
      role: OfficerRole.OFFICER,
      departmentId: roads.id,
    },
  });

  const complaint1 = await prisma.complaint.create({
    data: {
      title: 'Overflowing Public Garbage Bin',
      description: 'The public dustbin at Sector 15 main market is overflowing. It has not been cleared for three days, causing a severe stench and attracting stray animals.',
      category: 'Waste Management',
      latitude: 28.6139,
      longitude: 77.209,
      address: 'Sector 15 Market, Near Central Park, New Delhi',
      status: ComplaintStatus.PENDING,
      severity: Severity.HIGH,
      userId: citizen.id,
      departmentId: sanitation.id,
    },
  });

  const complaint2 = await prisma.complaint.create({
    data: {
      title: 'Massive Pothole on Main Road',
      description: 'A deep pothole has developed right in the middle of the flyover descent. It is extremely dangerous for two-wheelers, especially during nighttime.',
      category: 'Road Hazards',
      latitude: 28.625,
      longitude: 77.22,
      address: 'Defense Colony Flyover Descent, New Delhi',
      status: ComplaintStatus.IN_PROGRESS,
      severity: Severity.CRITICAL,
      userId: citizen.id,
      departmentId: roads.id,
      officerId: roadsOfficer.id,
    },
  });

  await prisma.image.createMany({
    data: [
      {
        url: 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9',
        complaintId: complaint1.id,
      },
      {
        url: 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2',
        complaintId: complaint2.id,
      },
    ],
  });

  await prisma.aIAnalysis.create({
    data: {
      complaintId: complaint1.id,
      summary: 'Public garbage accumulation detected. Confirmed overflow causing hygiene hazard.',
      tags: ['garbage', 'overflowing', 'health-hazard', 'market'],
      confidenceScore: 0.94,
      detectedSeverity: Severity.HIGH,
    },
  });

  await prisma.aIAnalysis.create({
    data: {
      complaintId: complaint2.id,
      summary: 'Severe road infrastructure damage. Deep depression in road surface presents vehicle damage and safety risk.',
      tags: ['pothole', 'road-damage', 'traffic-hazard', 'infrastructure'],
      confidenceScore: 0.98,
      detectedSeverity: Severity.CRITICAL,
    },
  });

  await prisma.statusHistory.createMany({
    data: [
      {
        complaintId: complaint1.id,
        previousStatus: ComplaintStatus.PENDING,
        newStatus: ComplaintStatus.PENDING,
        remarks: 'Complaint registered by citizen.',
        changedById: citizen.id,
        changedByType: ActorType.USER,
      },
      {
        complaintId: complaint2.id,
        previousStatus: ComplaintStatus.PENDING,
        newStatus: ComplaintStatus.PENDING,
        remarks: 'Complaint registered by citizen.',
        changedById: citizen.id,
        changedByType: ActorType.USER,
      },
      {
        complaintId: complaint2.id,
        previousStatus: ComplaintStatus.PENDING,
        newStatus: ComplaintStatus.IN_PROGRESS,
        remarks: 'Assigned to Engineer Anil Mehta. Status set to In Progress.',
        changedById: admin.id,
        changedByType: ActorType.USER,
      },
    ],
  });

  await prisma.notification.createMany({
    data: [
      {
        title: 'Complaint Registered',
        message: 'Your complaint about Overflowing Public Garbage Bin has been submitted.',
        userId: citizen.id,
        type: NotificationType.INFO,
      },
      {
        title: 'Complaint Assigned',
        message: 'Your complaint about Massive Pothole on Main Road has been assigned to an officer.',
        userId: citizen.id,
        type: NotificationType.UPDATE,
      },
      {
        title: 'New Assignment',
        message: 'You have been assigned a new critical pothole complaint.',
        officerId: roadsOfficer.id,
        type: NotificationType.ALERT,
      },
    ],
  });

  await prisma.auditLog.createMany({
    data: [
      {
        action: 'DEPARTMENT_CREATE',
        details: 'Created Department: Sanitation & Waste Management',
        performedById: admin.id,
        performedByType: ActorType.USER,
      },
      {
        action: 'DEPARTMENT_CREATE',
        details: 'Created Department: Roads & Infrastructure',
        performedById: admin.id,
        performedByType: ActorType.USER,
      },
      {
        action: 'COMPLAINT_ASSIGN',
        details: `Assigned complaint ${complaint2.id} to officer ${roadsOfficer.id}`,
        performedById: admin.id,
        performedByType: ActorType.USER,
      },
    ],
  });

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

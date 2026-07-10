import { prisma } from '../src/config/database.js';

async function run() {
  console.log("Fixing unrouted complaints in database...");
  const complaints = await prisma.complaint.findMany();
  const unrouted = complaints.filter(c => !c.departmentId);

  console.log(`Found ${unrouted.length} unrouted complaints.`);

  for (const c of unrouted) {
    let resolvedDepartmentId = null;
    const matchSource = `${c.category || ''} ${c.title || ''} ${c.description || ''}`.toLowerCase();

    if (matchSource.includes('road') || matchSource.includes('pothole') || matchSource.includes('infra') || matchSource.includes('street')) {
      resolvedDepartmentId = 'dept-roads';
    } else if (matchSource.includes('sanitat') || matchSource.includes('garbage') || matchSource.includes('waste') || matchSource.includes('litter')) {
      resolvedDepartmentId = 'dept-sanitation';
    } else if (matchSource.includes('water') || matchSource.includes('sewer') || matchSource.includes('drain') || matchSource.includes('leak')) {
      resolvedDepartmentId = 'dept-water';
    } else if (matchSource.includes('electr') || matchSource.includes('power') || matchSource.includes('wire') || matchSource.includes('current')) {
      resolvedDepartmentId = 'dept-electricity';
    }

    if (resolvedDepartmentId) {
      await prisma.complaint.update({
        where: { id: c.id },
        data: { departmentId: resolvedDepartmentId }
      });
      console.log(`Routed complaint "${c.title}" (ID: ${c.id}) to ${resolvedDepartmentId}`);
    }
  }

  console.log("Finished routing existing complaints!");
}

run().catch(console.error);

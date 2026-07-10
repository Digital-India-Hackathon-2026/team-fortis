import { ComplaintService } from '../src/services/complaint.service.js';

async function run() {
  const result = await ComplaintService.createComplaint({
    userId: 'citizen-id-1',
    title: 'Severe water leak in market place',
    description: 'There is clean drinking water leaking from the main pipe.',
    category: 'Water Supply & Sewerage',
    latitude: 17.3850,
    longitude: 78.4867,
    address: 'Secunderabad Market Road, Hyderabad',
  });

  console.log("Newly created complaint details:");
  console.log("ID:", result.id);
  console.log("Title:", result.title);
  console.log("Department ID:", result.departmentId);
  console.log("Assigned Officer ID:", result.officerId);
}

run().catch(console.error);

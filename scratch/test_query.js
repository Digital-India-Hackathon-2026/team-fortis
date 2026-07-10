import { ComplaintService } from '../src/services/complaint.service.js';

async function run() {
  const result = await ComplaintService.getAllComplaints({ officerId: 'officer-admin-water' }, {});
  console.log("Filtered complaints count:", result.data.length);
  console.log("Returned categories:", result.data.map(c => c.category));
  console.log("Returned departmentId values:", result.data.map(c => c.departmentId));
}

run().catch(console.error);

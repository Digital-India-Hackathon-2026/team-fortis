import fs from 'fs';
import path from 'path';

const DB_FILE_PATH = path.resolve('mock_db.json');
const db = JSON.parse(fs.readFileSync(DB_FILE_PATH, 'utf-8'));

console.log("All complaints in database:");
db.complaints.forEach((c, index) => {
  console.log(`${index + 1}. ID: ${c.id}`);
  console.log(`   Title: ${c.title}`);
  console.log(`   Category: ${c.category}`);
  console.log(`   Department ID: ${c.departmentId}`);
  console.log('---');
});

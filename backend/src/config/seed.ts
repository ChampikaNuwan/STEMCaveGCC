import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { query, execute } from './database';

export async function seed(): Promise<void> {
  console.log('Seeding database...');

  // Create Superadmin
  const superadminId = uuidv4();
  const passwordHash = await bcrypt.hash('Admin@123', 12);

  const existingSuperadmin = await query<any[]>(
    'SELECT id FROM users WHERE role = ? LIMIT 1',
    ['superadmin']
  );

  if (existingSuperadmin.length === 0) {
    await execute(
      `INSERT INTO users (id, username, email, password_hash, role) VALUES (?, ?, ?, ?, ?)`,
      [superadminId, 'superadmin', 'superadmin@stemcave.com', passwordHash, 'superadmin']
    );
    console.log('  Superadmin created (superadmin / Admin@123)');
  } else {
    console.log('  Superadmin already exists, skipping...');
  }

  // Create a demo Teacher
  const teacherId = uuidv4();
  const existingTeacher = await query<any[]>(
    'SELECT id FROM users WHERE email = ? LIMIT 1',
    ['teacher@stemcave.com']
  );

  if (existingTeacher.length === 0) {
    await execute(
      `INSERT INTO users (id, username, email, password_hash, role, created_by) VALUES (?, ?, ?, ?, ?, ?)`,
      [teacherId, 'teacher1', 'teacher@stemcave.com', passwordHash, 'teacher', superadminId]
    );
    console.log('  Demo teacher created (teacher1 / Admin@123)');
  }

  // Create a demo Student
  const studentId = uuidv4();
  const existingStudent = await query<any[]>(
    'SELECT id FROM users WHERE email = ? LIMIT 1',
    ['student@stemcave.com']
  );

  if (existingStudent.length === 0) {
    await execute(
      `INSERT INTO users (id, username, email, password_hash, role, created_by) VALUES (?, ?, ?, ?, ?, ?)`,
      [studentId, 'student1', 'student@stemcave.com', passwordHash, 'student', teacherId]
    );
    console.log('  Demo student created (student1 / Admin@123)');
  }

  console.log('Seeding completed.');
}

if (require.main === module) {
  seed()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

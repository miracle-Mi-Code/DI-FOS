const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting DFOS Database Seeding for Faculty of Computing and Artificial Intelligence...');

  // Clean existing tables safely
  try { await prisma.statusHistory.deleteMany(); } catch (e) {}
  try { await prisma.submittedDocument.deleteMany(); } catch (e) {}
  try { await prisma.fileSubmission.deleteMany(); } catch (e) {}
  try { await prisma.otpVerification.deleteMany(); } catch (e) {}
  try { await prisma.requiredDocument.deleteMany(); } catch (e) {}
  try { await prisma.user.deleteMany(); } catch (e) {}
  try { await prisma.department.deleteMany(); } catch (e) {}

  console.log('Cleared existing records.');

  // Create 4 Departments under Faculty of Computing and Artificial Intelligence
  const csDept = await prisma.department.create({
    data: { name: 'Computer Science', code: 'CSC' },
  });

  const itDept = await prisma.department.create({
    data: { name: 'Information Technology', code: 'IFT' },
  });

  const dsDept = await prisma.department.create({
    data: { name: 'Data Science', code: 'DSC' },
  });

  const seDept = await prisma.department.create({
    data: { name: 'Software Engineering', code: 'SEN' },
  });

  console.log('Created Departments:', csDept.name, itDept.name, dsDept.name, seDept.name);

  // Password Hashes
  const adminPasswordHash = await bcrypt.hash('Admin@123456', 10);
  const staffPasswordHash = await bcrypt.hash('Staff@123456', 10);
  const studentPasswordHash = await bcrypt.hash('Student@123456', 10);

  // Super Admin
  const superAdmin = await prisma.user.create({
    data: {
      name: 'Super Administrator',
      email: 'admin@dfos.edu',
      phone: '2348000000001',
      passwordHash: adminPasswordHash,
      role: 'SUPER_ADMIN',
      isVerified: true,
    },
  });

  // Department Staff Users
  const csStaff = await prisma.user.create({
    data: {
      name: 'Dr. Alan Turing (CS Staff)',
      email: 'staff.cs@dfos.edu',
      phone: '2348000000002',
      passwordHash: staffPasswordHash,
      role: 'STAFF',
      departmentId: csDept.id,
      isVerified: true,
    },
  });

  const seStaff = await prisma.user.create({
    data: {
      name: 'Grace Hopper (SE Staff)',
      email: 'staff.se@dfos.edu',
      phone: '2348000000003',
      passwordHash: staffPasswordHash,
      role: 'STAFF',
      departmentId: seDept.id,
      isVerified: true,
    },
  });

  // Sample Student
  const sampleStudent = await prisma.user.create({
    data: {
      name: 'John Doe',
      email: 'student.cs@dfos.edu',
      phone: '2348012345678',
      matricNo: 'CSC/2026/001',
      passwordHash: studentPasswordHash,
      role: 'STUDENT',
      departmentId: csDept.id,
      isVerified: true,
    },
  });

  // Standard Document Checklist items per department
  const standardChecklist = [
    { name: 'Official Provisional Admission Letter', description: 'Clear copy of official university admission letter.', isMandatory: true },
    { name: "Senior Secondary School Certificate (O'Level / WAEC / NECO)", description: 'Statement of result or certificate with minimum 5 credits.', isMandatory: true },
    { name: 'Birth Certificate / Declaration of Age', description: 'NPC birth certificate or court declaration of age.', isMandatory: true },
    { name: 'Recent Passport Photograph', description: 'Clear passport photograph with light background.', isMandatory: true },
    { name: 'Medical Fitness Certificate', description: 'Medical report issued by University Health Center.', isMandatory: true },
    { name: 'State / Local Government Identification', description: 'Certificate of origin or local government ID letter.', isMandatory: false },
  ];

  const allDepts = [csDept, itDept, dsDept, seDept];

  for (const dept of allDepts) {
    for (const doc of standardChecklist) {
      await prisma.requiredDocument.create({
        data: {
          departmentId: dept.id,
          name: doc.name,
          description: doc.description,
          isMandatory: doc.isMandatory,
        },
      });
    }
  }

  console.log('Populated document checklists for all Computing & AI departments.');

  console.log('\n=================== SEED DATA SUMMARY ===================');
  console.log('Faculty: Computing and Artificial Intelligence');
  console.log('Departments: Computer Science, Information Technology, Data Science, Software Engineering');
  console.log('1. Super Admin: admin@dfos.edu / Admin@123456');
  console.log('2. CS Staff   : staff.cs@dfos.edu / Staff@123456');
  console.log('3. SE Staff   : staff.se@dfos.edu / Staff@123456');
  console.log('4. CS Student : student.cs@dfos.edu (Matric: CSC/2026/001) / Student@123456');
  console.log('=========================================================\n');
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

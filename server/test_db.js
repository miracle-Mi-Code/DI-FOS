const prisma = require('./src/config/prisma');

console.log('Testing DATABASE_URL:', process.env.DATABASE_URL);

async function main() {
  try {
    const userCount = await prisma.user.count();
    console.log('SUCCESS! User count:', userCount);
  } catch (err) {
    console.error('DATABASE CONNECTION ERROR:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();

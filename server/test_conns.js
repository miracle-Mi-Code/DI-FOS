const { Client } = require('pg');

async function testConn(url, name) {
  console.log(`Testing ${name}:`, url.replace(/:[^:@]+@/, ':****@'));
  const client = new Client({
    connectionString: url,
    connectionTimeoutMillis: 5000,
  });
  try {
    await client.connect();
    console.log(`✅ SUCCESS connecting to ${name}`);
    await client.end();
    return true;
  } catch (err) {
    console.log(`❌ ERROR connecting to ${name}:`, err.message);
    return false;
  }
}

async function run() {
  const neonDirect = 'postgresql://neondb_owner:npg_N4rwjFsy6Opb@ep-dark-frog-ax8r9shp.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require';
  const neonPooler = 'postgresql://neondb_owner:npg_N4rwjFsy6Opb@ep-dark-frog-ax8r9shp-pooler.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require';
  const localPg = 'postgresql://postgres:postgres@localhost:5432/dfos_db';

  await testConn(neonDirect, 'Neon Direct');
  await testConn(neonPooler, 'Neon Pooler');
  await testConn(localPg, 'Local Postgres');
}

run();

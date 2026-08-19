const path = require('path');
const { PrismaClient } = require('@prisma/client');

function getResolvedDatabaseUrl() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    const dbPath = path.resolve(__dirname, '../../prisma/dev.db');
    return `file:${dbPath}`;
  }

  // Handle SQLite file URLs - ensure absolute path to avoid "Unable to open database file"
  if (url.startsWith('file:')) {
    const rawPath = url.slice(5); // remove 'file:'
    if (!path.isAbsolute(rawPath)) {
      const cleanPath = rawPath.replace(/^\.\//, '').replace(/^prisma[/\\]/, '');
      const absoluteDbPath = path.resolve(__dirname, '../../prisma', cleanPath);
      return `file:${absoluteDbPath}`;
    }
    return url;
  }

  // Handle Postgres URL normalization
  let normalized = url.replace(/-pooler\./, '.');
  normalized = normalized.replace(/&channel_binding=require/g, '');
  normalized = normalized.replace(/\?$/, '');
  return normalized;
}

const databaseUrl = getResolvedDatabaseUrl();
process.env.DATABASE_URL = databaseUrl;

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});

module.exports = prisma;


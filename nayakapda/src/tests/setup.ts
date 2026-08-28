import '@testing-library/jest-dom';

process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://mock:mock@localhost:5432/mock';
process.env.NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || 'mock-secret';
process.env.ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'mock-admin-secret';

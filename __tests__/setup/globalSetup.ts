export default async function globalSetup() {
  // MONGODB_URI must be set in .env.test or environment for DB tests.
  // Pure unit/property tests (e.g. scoring) don't need it and will still run.
  process.env.JWT_SECRET = process.env.JWT_SECRET ?? "test-secret-key-for-jest";
  process.env.ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@test.com";
}

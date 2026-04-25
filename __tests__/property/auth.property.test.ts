// **Feature: property-dealer-crm, Property 1: Password hashing correctness**
// **Feature: property-dealer-crm, Property 2: Invalid credentials always rejected**
import * as fc from "fast-check";
import bcrypt from "bcryptjs";
import { signup, login } from "@/services/authService";
import { setupTestDB, teardownTestDB, clearCollections } from "../setup/dbHelper";

describe("Property 1: Password hashing correctness", () => {
  // **Validates: Requirements 1.1**
  beforeAll(() => setupTestDB());
  afterAll(() => teardownTestDB());
  afterEach(() => clearCollections());

  it("stored hash is never equal to plaintext and bcrypt.compare returns true", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 8, maxLength: 32 }).filter((s) => s.trim().length >= 8),
        fc.string({ minLength: 1, maxLength: 30 }).filter((s) => s.trim().length > 0),
        async (password, nameSuffix) => {
          const email = `user_${nameSuffix.replace(/[^a-z0-9]/gi, "")}@test.com`.toLowerCase();
          const user = await signup({ name: "Test User", email, password });

          // Hash must not equal plaintext
          expect(user.passwordHash).not.toBe(password);
          // bcrypt.compare must return true
          const valid = await bcrypt.compare(password, user.passwordHash);
          expect(valid).toBe(true);
        }
      ),
      { numRuns: 20 }
    );
  });
});

describe("Property 2: Invalid credentials always rejected", () => {
  // **Validates: Requirements 1.3**
  beforeAll(() => setupTestDB());
  afterAll(() => teardownTestDB());
  afterEach(() => clearCollections());

  it("login with wrong password always returns 401", async () => {
    await signup({ name: "Alice", email: "alice@test.com", password: "correctPass123" });

    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 32 }).filter((s) => s !== "correctPass123"),
        async (wrongPassword) => {
          await expect(
            login({ email: "alice@test.com", password: wrongPassword })
          ).rejects.toMatchObject({ statusCode: 401 });
        }
      ),
      { numRuns: 30 }
    );
  });

  it("login with unregistered email always returns 401", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.emailAddress().filter((e) => !e.includes("registered")),
        async (email) => {
          await expect(
            login({ email, password: "anyPassword" })
          ).rejects.toMatchObject({ statusCode: 401 });
        }
      ),
      { numRuns: 30 }
    );
  });
});

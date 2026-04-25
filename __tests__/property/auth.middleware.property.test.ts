// **Feature: property-dealer-crm, Property 3: Auth middleware token gate**
// **Feature: property-dealer-crm, Property 4: Auth middleware context injection**
import * as fc from "fast-check";
import { NextRequest } from "next/server";
import { signToken, verifyToken } from "@/services/authService";
import { extractAuth } from "@/middleware/auth";

// Helper to build a mock NextRequest with a given Authorization header
function makeRequest(authHeader?: string): NextRequest {
  const url = "http://localhost:3000/api/leads";
  const headers: Record<string, string> = {};
  if (authHeader !== undefined) headers["authorization"] = authHeader;
  return new NextRequest(url, { headers });
}

describe("Property 3: Auth middleware token gate", () => {
  // **Validates: Requirements 2.1, 2.2, 1.4, 1.5**

  it("passes any valid non-expired JWT signed with the server secret", () => {
    fc.assert(
      fc.property(
        fc.constantFrom("admin" as const, "agent" as const),
        fc.uuid(),
        (role, userId) => {
          const token = signToken({ userId, role });
          const req = makeRequest(`Bearer ${token}`);
          const result = extractAuth(req);
          expect("payload" in result).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("rejects requests with no Authorization header", () => {
    const req = makeRequest(undefined);
    const result = extractAuth(req);
    expect("error" in result).toBe(true);
  });

  it("rejects requests with malformed tokens", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }).filter((s) => !s.includes(".")),
        (garbage) => {
          const req = makeRequest(`Bearer ${garbage}`);
          const result = extractAuth(req);
          expect("error" in result).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("rejects tokens signed with a different secret", () => {
    // Manually sign with wrong secret
    const jwt = require("jsonwebtoken");
    const badToken = jwt.sign({ userId: "abc", role: "agent" }, "wrong-secret");
    const req = makeRequest(`Bearer ${badToken}`);
    const result = extractAuth(req);
    expect("error" in result).toBe(true);
  });
});

describe("Property 4: Auth middleware context injection", () => {
  // **Validates: Requirements 2.3**

  it("decoded payload matches the token's userId and role for any valid token", () => {
    fc.assert(
      fc.property(
        fc.constantFrom("admin" as const, "agent" as const),
        fc.uuid(),
        (role, userId) => {
          const token = signToken({ userId, role });
          const req = makeRequest(`Bearer ${token}`);
          const result = extractAuth(req);
          if (!("payload" in result)) throw new Error("Expected payload");
          expect(result.payload.userId).toBe(userId);
          expect(result.payload.role).toBe(role);
        }
      ),
      { numRuns: 100 }
    );
  });
});

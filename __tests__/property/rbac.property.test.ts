// **Feature: property-dealer-crm, Property 5: Admin RBAC pass-through**
// **Feature: property-dealer-crm, Property 6: Agent RBAC restriction**
import * as fc from "fast-check";
import { checkRole } from "@/middleware/role";
import { AuthPayload } from "@/services/authService";

describe("Property 5: Admin RBAC pass-through", () => {
  // **Validates: Requirements 3.1**
  it("checkRole returns null (pass) for any admin user on any role list containing admin", () => {
    fc.assert(
      fc.property(fc.uuid(), (userId) => {
        const payload: AuthPayload = { userId, role: "admin" };
        const result = checkRole(payload, ["admin"]);
        expect(result).toBeNull();
      }),
      { numRuns: 100 }
    );
  });

  it("checkRole returns null for admin when both roles are allowed", () => {
    fc.assert(
      fc.property(fc.uuid(), (userId) => {
        const payload: AuthPayload = { userId, role: "admin" };
        const result = checkRole(payload, ["admin", "agent"]);
        expect(result).toBeNull();
      }),
      { numRuns: 100 }
    );
  });
});

describe("Property 6: Agent RBAC restriction", () => {
  // **Validates: Requirements 3.2**
  it("checkRole returns 403 for any agent user on admin-only routes", () => {
    fc.assert(
      fc.property(fc.uuid(), (userId) => {
        const payload: AuthPayload = { userId, role: "agent" };
        const result = checkRole(payload, ["admin"]);
        expect(result).not.toBeNull();
        expect(result!.status).toBe(403);
      }),
      { numRuns: 100 }
    );
  });
});

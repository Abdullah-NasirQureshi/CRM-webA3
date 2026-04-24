// **Feature: property-dealer-crm, Property 14: Scoring function correctness**
import * as fc from "fast-check";
import { computeScore } from "@/lib/scoring";

describe("Property 14: Scoring function correctness", () => {
  // **Validates: Requirements 7.1, 7.2, 7.3**
  it("returns High for any budget > 20,000,000", () => {
    fc.assert(
      fc.property(fc.integer({ min: 20_000_001, max: 1_000_000_000 }), (budget) => {
        expect(computeScore(budget)).toBe("High");
      }),
      { numRuns: 100 }
    );
  });

  it("returns Medium for any budget in [10,000,000, 20,000,000]", () => {
    fc.assert(
      fc.property(fc.integer({ min: 10_000_000, max: 20_000_000 }), (budget) => {
        expect(computeScore(budget)).toBe("Medium");
      }),
      { numRuns: 100 }
    );
  });

  it("returns Low for any budget < 10,000,000", () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 9_999_999 }), (budget) => {
        expect(computeScore(budget)).toBe("Low");
      }),
      { numRuns: 100 }
    );
  });

  it("covers boundary values exactly", () => {
    expect(computeScore(20_000_001)).toBe("High");
    expect(computeScore(20_000_000)).toBe("Medium");
    expect(computeScore(10_000_000)).toBe("Medium");
    expect(computeScore(9_999_999)).toBe("Low");
    expect(computeScore(0)).toBe("Low");
  });
});

/**
 * Computes lead priority score based on budget.
 * High:   budget > 20,000,000
 * Medium: 10,000,000 <= budget <= 20,000,000
 * Low:    budget < 10,000,000
 */
export function computeScore(budget: number): "High" | "Medium" | "Low" {
  if (budget > 20_000_000) return "High";
  if (budget >= 10_000_000) return "Medium";
  return "Low";
}

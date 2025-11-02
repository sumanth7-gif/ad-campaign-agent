import { describe, it, expect } from "vitest";
import { PlanSchema, sumBudget } from "../src/lib/schemas";
import output1 from "../examples/output1.mock.json";

describe("Plan schema", () => {
  it("validates mock output1 and budget sum", () => {
    const parsed = PlanSchema.parse(output1);
    expect(sumBudget(parsed.budget_breakdown)).toBe(parsed.total_budget);
    expect(parsed.checks.required_fields_present).toBe(true);
  });
});


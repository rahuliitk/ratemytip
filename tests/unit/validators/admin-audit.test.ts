import { describe, it, expect } from "vitest";
import { claimsQuerySchema, reportsQuerySchema } from "@/lib/validators/admin";

describe("claimsQuerySchema", () => {
  it("coerces string page/pageSize to numbers", () => {
    const result = claimsQuerySchema.parse({ page: "2", pageSize: "25" });
    expect(result.page).toBe(2);
    expect(result.pageSize).toBe(25);
  });

  it("applies default values when omitted", () => {
    const result = claimsQuerySchema.parse({});
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(20);
  });

  it("rejects non-numeric page values", () => {
    const result = claimsQuerySchema.safeParse({ page: "abc" });
    expect(result.success).toBe(false);
  });
});

describe("reportsQuerySchema", () => {
  it("accepts valid status filter", () => {
    const result = reportsQuerySchema.parse({ status: "PENDING_REPORT" });
    expect(result.status).toBe("PENDING_REPORT");
  });

  it("allows omitting status (optional)", () => {
    const result = reportsQuerySchema.parse({});
    expect(result.status).toBeUndefined();
  });

  it("coerces page and pageSize from strings", () => {
    const result = reportsQuerySchema.parse({ page: "3", pageSize: "50" });
    expect(result.page).toBe(3);
    expect(result.pageSize).toBe(50);
  });
});

// tests/unit/validators/claim.test.ts

import { describe, it, expect } from "vitest";
import {
  createClaimRequestSchema,
  reviewClaimSchema,
} from "@/lib/validators/claim";

describe("createClaimRequestSchema", () => {
  it("accepts valid claim request with proof URL", () => {
    const result = createClaimRequestSchema.safeParse({
      proofUrl: "https://twitter.com/myprofile",
    });
    expect(result.success).toBe(true);
  });

  it("accepts valid claim with proof URL and verification note", () => {
    const result = createClaimRequestSchema.safeParse({
      proofUrl: "https://youtube.com/channel/UC123456",
      verificationNote: "This is my channel, check the bio for verification code.",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.verificationNote).toBe(
        "This is my channel, check the bio for verification code."
      );
    }
  });

  it("rejects missing proof URL", () => {
    const result = createClaimRequestSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects invalid proof URL", () => {
    const result = createClaimRequestSchema.safeParse({
      proofUrl: "not-a-url",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty proof URL", () => {
    const result = createClaimRequestSchema.safeParse({
      proofUrl: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects verification note over 1000 characters", () => {
    const result = createClaimRequestSchema.safeParse({
      proofUrl: "https://twitter.com/myprofile",
      verificationNote: "x".repeat(1001),
    });
    expect(result.success).toBe(false);
  });

  it("accepts verification note at exactly 1000 characters", () => {
    const result = createClaimRequestSchema.safeParse({
      proofUrl: "https://twitter.com/myprofile",
      verificationNote: "x".repeat(1000),
    });
    expect(result.success).toBe(true);
  });
});

describe("reviewClaimSchema", () => {
  it("accepts APPROVED action", () => {
    const result = reviewClaimSchema.safeParse({ action: "APPROVED" });
    expect(result.success).toBe(true);
  });

  it("accepts REJECTED action", () => {
    const result = reviewClaimSchema.safeParse({ action: "REJECTED" });
    expect(result.success).toBe(true);
  });

  it("accepts action with review note", () => {
    const result = reviewClaimSchema.safeParse({
      action: "APPROVED",
      reviewNote: "Verified via Twitter bio link.",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.reviewNote).toBe("Verified via Twitter bio link.");
    }
  });

  it("rejects invalid action values", () => {
    const result = reviewClaimSchema.safeParse({ action: "PENDING" });
    expect(result.success).toBe(false);
  });

  it("rejects missing action", () => {
    const result = reviewClaimSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects review note over 500 characters", () => {
    const result = reviewClaimSchema.safeParse({
      action: "REJECTED",
      reviewNote: "x".repeat(501),
    });
    expect(result.success).toBe(false);
  });
});

// tests/unit/validators/explanation.test.ts

import { describe, it, expect } from "vitest";
import {
  createExplanationSchema,
  updateExplanationSchema,
} from "@/lib/validators/explanation";

describe("createExplanationSchema", () => {
  it("accepts valid explanation with content only", () => {
    const result = createExplanationSchema.safeParse({
      content: "This stock has strong fundamentals and growing revenue.",
    });
    expect(result.success).toBe(true);
  });

  it("accepts explanation with image URLs", () => {
    const result = createExplanationSchema.safeParse({
      content: "See the chart analysis below.",
      imageUrls: [
        "https://example.com/chart1.png",
        "https://example.com/chart2.png",
      ],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.imageUrls).toHaveLength(2);
    }
  });

  it("defaults imageUrls to empty array when not provided", () => {
    const result = createExplanationSchema.safeParse({
      content: "Some explanation.",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.imageUrls).toEqual([]);
    }
  });

  it("rejects empty content", () => {
    const result = createExplanationSchema.safeParse({
      content: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing content", () => {
    const result = createExplanationSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects content over 5000 characters", () => {
    const result = createExplanationSchema.safeParse({
      content: "x".repeat(5001),
    });
    expect(result.success).toBe(false);
  });

  it("accepts content at exactly 5000 characters", () => {
    const result = createExplanationSchema.safeParse({
      content: "x".repeat(5000),
    });
    expect(result.success).toBe(true);
  });

  it("rejects more than 5 image URLs", () => {
    const result = createExplanationSchema.safeParse({
      content: "Analysis with many charts",
      imageUrls: [
        "https://example.com/1.png",
        "https://example.com/2.png",
        "https://example.com/3.png",
        "https://example.com/4.png",
        "https://example.com/5.png",
        "https://example.com/6.png",
      ],
    });
    expect(result.success).toBe(false);
  });

  it("accepts exactly 5 image URLs", () => {
    const result = createExplanationSchema.safeParse({
      content: "Analysis with charts",
      imageUrls: [
        "https://example.com/1.png",
        "https://example.com/2.png",
        "https://example.com/3.png",
        "https://example.com/4.png",
        "https://example.com/5.png",
      ],
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid image URLs", () => {
    const result = createExplanationSchema.safeParse({
      content: "Some analysis",
      imageUrls: ["not-a-url"],
    });
    expect(result.success).toBe(false);
  });
});

describe("updateExplanationSchema", () => {
  it("uses the same validation as create schema", () => {
    // updateExplanationSchema is an alias for createExplanationSchema
    expect(updateExplanationSchema).toBe(createExplanationSchema);
  });

  it("accepts valid update", () => {
    const result = updateExplanationSchema.safeParse({
      content: "Updated explanation with new data.",
      imageUrls: ["https://example.com/updated-chart.png"],
    });
    expect(result.success).toBe(true);
  });
});

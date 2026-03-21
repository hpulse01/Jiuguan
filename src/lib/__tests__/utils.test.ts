import { describe, it, expect } from "vitest";
import { cn, formatDate, truncate, generateSlug } from "../utils";

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("handles conditional classes", () => {
    expect(cn("base", false && "hidden", "visible")).toBe("base visible");
  });

  it("merges tailwind conflicts", () => {
    expect(cn("px-4", "px-2")).toBe("px-2");
  });
});

describe("formatDate", () => {
  it("returns '刚刚' for very recent dates", () => {
    const now = new Date();
    expect(formatDate(now)).toBe("刚刚");
  });

  it("returns minutes ago for dates within an hour", () => {
    const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000);
    expect(formatDate(tenMinsAgo)).toBe("10分钟前");
  });

  it("returns hours ago for dates within a day", () => {
    const threeHoursAgo = new Date(Date.now() - 3 * 3600 * 1000);
    expect(formatDate(threeHoursAgo)).toBe("3小时前");
  });

  it("returns days ago for dates within a week", () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 86400 * 1000);
    expect(formatDate(twoDaysAgo)).toBe("2天前");
  });

  it("returns weeks ago for dates within a month", () => {
    const twoWeeksAgo = new Date(Date.now() - 14 * 86400 * 1000);
    expect(formatDate(twoWeeksAgo)).toBe("2周前");
  });

  it("returns formatted date for older dates", () => {
    const result = formatDate("2023-01-15T00:00:00Z");
    expect(result).toContain("2023");
  });

  it("handles string input", () => {
    const result = formatDate(new Date().toISOString());
    expect(result).toBe("刚刚");
  });
});

describe("truncate", () => {
  it("returns original string if shorter than limit", () => {
    expect(truncate("hello", 10)).toBe("hello");
  });

  it("truncates and adds ellipsis", () => {
    expect(truncate("hello world", 5)).toBe("hello...");
  });

  it("handles exact length", () => {
    expect(truncate("hello", 5)).toBe("hello");
  });
});

describe("generateSlug", () => {
  it("generates slug from Chinese text", () => {
    const slug = generateSlug("我的第一次创业失败");
    expect(slug).toBeTruthy();
    expect(slug.length).toBeLessThanOrEqual(80);
  });

  it("converts to lowercase", () => {
    const slug = generateSlug("Hello World");
    expect(slug).toBe("hello-world");
  });

  it("removes special characters", () => {
    const slug = generateSlug("Hello! @World#");
    expect(slug).not.toContain("!");
    expect(slug).not.toContain("@");
    expect(slug).not.toContain("#");
  });

  it("limits length to 80 chars", () => {
    const longTitle = "这是一个非常长的标题".repeat(20);
    const slug = generateSlug(longTitle);
    expect(slug.length).toBeLessThanOrEqual(80);
  });
});

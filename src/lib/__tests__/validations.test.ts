import { describe, it, expect } from "vitest";
import {
  loginSchema,
  registerSchema,
  profileSchema,
  failureCaseSchema,
  draftCaseSchema,
  commentSchema,
  reportSchema,
  searchSchema,
} from "../validations";

describe("loginSchema", () => {
  it("validates valid login data", () => {
    const result = loginSchema.safeParse({
      email: "test@example.com",
      password: "123456",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = loginSchema.safeParse({
      email: "notanemail",
      password: "123456",
    });
    expect(result.success).toBe(false);
  });

  it("rejects short password", () => {
    const result = loginSchema.safeParse({
      email: "test@example.com",
      password: "123",
    });
    expect(result.success).toBe(false);
  });
});

describe("registerSchema", () => {
  it("validates valid registration", () => {
    const result = registerSchema.safeParse({
      email: "test@example.com",
      username: "testuser",
      password: "123456",
      confirmPassword: "123456",
    });
    expect(result.success).toBe(true);
  });

  it("rejects mismatched passwords", () => {
    const result = registerSchema.safeParse({
      email: "test@example.com",
      username: "testuser",
      password: "123456",
      confirmPassword: "654321",
    });
    expect(result.success).toBe(false);
  });

  it("rejects username with special characters", () => {
    const result = registerSchema.safeParse({
      email: "test@example.com",
      username: "test@user!",
      password: "123456",
      confirmPassword: "123456",
    });
    expect(result.success).toBe(false);
  });

  it("allows Chinese username", () => {
    const result = registerSchema.safeParse({
      email: "test@example.com",
      username: "测试用户",
      password: "123456",
      confirmPassword: "123456",
    });
    expect(result.success).toBe(true);
  });

  it("rejects username that's too short", () => {
    const result = registerSchema.safeParse({
      email: "test@example.com",
      username: "a",
      password: "123456",
      confirmPassword: "123456",
    });
    expect(result.success).toBe(false);
  });
});

describe("profileSchema", () => {
  it("validates valid profile data", () => {
    const result = profileSchema.safeParse({
      nickname: "老酒客",
      bio: "一个普通人",
    });
    expect(result.success).toBe(true);
  });

  it("validates empty profile", () => {
    const result = profileSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("rejects invalid website URL", () => {
    const result = profileSchema.safeParse({
      website: "not-a-url",
    });
    expect(result.success).toBe(false);
  });

  it("allows empty string for optional URL fields", () => {
    const result = profileSchema.safeParse({
      avatar: "",
      website: "",
    });
    expect(result.success).toBe(true);
  });
});

describe("failureCaseSchema", () => {
  const validCase = {
    title: "这是一个至少五个字的标题",
    summary: "这是一个至少十个字符的简要总结内容",
    categoryId: "some-category-id",
    tagIds: ["tag1"],
    background: "这是一个至少二十个字符的背景描述内容，需要足够长",
    originalGoal: "这是至少十个字符的目标描述",
    decisionPoint: "这是至少十个字符的决策点描述",
    actionsTaken: "这是至少十个字符的行动描述",
    ignoredSignals: "这是至少十个字符的忽略信号描述",
    earliestWarning: "这是至少十个字符的预警信号描述",
    outcome: "这是至少十个字符的最终结果描述",
    rootCause: "这是至少十个字符的根因分析描述",
    whatWouldDoDifferently: "这是至少十个字符的如果重来描述",
    adviceToOthers: "这是至少十个字符的给后来者建议",
    isAnonymous: false,
  };

  it("validates valid case data", () => {
    const result = failureCaseSchema.safeParse(validCase);
    expect(result.success).toBe(true);
  });

  it("rejects empty title", () => {
    const result = failureCaseSchema.safeParse({ ...validCase, title: "" });
    expect(result.success).toBe(false);
  });

  it("rejects title that's too short", () => {
    const result = failureCaseSchema.safeParse({ ...validCase, title: "短" });
    expect(result.success).toBe(false);
  });

  it("rejects empty tagIds", () => {
    const result = failureCaseSchema.safeParse({ ...validCase, tagIds: [] });
    expect(result.success).toBe(false);
  });

  it("rejects too many tags", () => {
    const result = failureCaseSchema.safeParse({
      ...validCase,
      tagIds: ["1", "2", "3", "4", "5", "6"],
    });
    expect(result.success).toBe(false);
  });

  it("allows optional cost fields to be missing", () => {
    const result = failureCaseSchema.safeParse(validCase);
    expect(result.success).toBe(true);
  });
});

describe("draftCaseSchema", () => {
  it("validates minimal draft", () => {
    const result = draftCaseSchema.safeParse({
      title: "草稿标题",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty title", () => {
    const result = draftCaseSchema.safeParse({ title: "" });
    expect(result.success).toBe(false);
  });
});

describe("commentSchema", () => {
  it("validates valid comment", () => {
    const result = commentSchema.safeParse({
      content: "这是一个评论内容",
      commentType: "QUESTION",
      isAnonymous: false,
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty content", () => {
    const result = commentSchema.safeParse({
      content: "a",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid comment type", () => {
    const result = commentSchema.safeParse({
      content: "有效评论内容",
      commentType: "INVALID",
    });
    expect(result.success).toBe(false);
  });

  it("allows parentId for replies", () => {
    const result = commentSchema.safeParse({
      content: "这是一个回复",
      commentType: "SUPPLEMENT",
      parentId: "parent-comment-id",
    });
    expect(result.success).toBe(true);
  });
});

describe("reportSchema", () => {
  it("validates valid report", () => {
    const result = reportSchema.safeParse({
      reason: "虚假信息",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty reason", () => {
    const result = reportSchema.safeParse({
      reason: "",
    });
    expect(result.success).toBe(false);
  });

  it("allows optional detail", () => {
    const result = reportSchema.safeParse({
      reason: "虚假信息",
      detail: "这个内容明显是编造的",
    });
    expect(result.success).toBe(true);
  });
});

describe("searchSchema", () => {
  it("validates default search params", () => {
    const result = searchSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.sort).toBe("latest");
      expect(result.data.page).toBe(1);
      expect(result.data.pageSize).toBe(12);
    }
  });

  it("validates custom search params", () => {
    const result = searchSchema.safeParse({
      q: "创业失败",
      sort: "hot",
      page: 2,
      pageSize: 20,
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid sort option", () => {
    const result = searchSchema.safeParse({
      sort: "invalid",
    });
    expect(result.success).toBe(false);
  });

  it("rejects pageSize over 50", () => {
    const result = searchSchema.safeParse({
      pageSize: 100,
    });
    expect(result.success).toBe(false);
  });
});

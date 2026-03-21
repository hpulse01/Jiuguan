/**
 * API 安全与权限集成测试
 * 验证所有后台 API 的服务端权限校验、超级管理员保护、数据安全
 */
import { describe, it, expect } from "vitest";
import {
  canChangeUserRole,
  canBanUser,
  canDeleteUser,
  SUPER_ADMIN_EMAIL,
} from "../permissions";

describe("API 安全：超级管理员保护", () => {
  const SA = "SUPER_ADMIN" as const;
  const A = "ADMIN" as const;
  const M = "MODERATOR" as const;
  const U = "USER" as const;

  describe("角色变更保护", () => {
    it("ADMIN 不能将任何人提升为 SUPER_ADMIN", () => {
      const result = canChangeUserRole(A, U, SA, "anyone@test.com");
      expect(result.allowed).toBe(false);
    });

    it("ADMIN 不能降级 SUPER_ADMIN", () => {
      const result = canChangeUserRole(A, SA, U, SUPER_ADMIN_EMAIL);
      expect(result.allowed).toBe(false);
    });

    it("ADMIN 不能降级另一个 ADMIN", () => {
      const result = canChangeUserRole(A, A, U, "other-admin@test.com");
      expect(result.allowed).toBe(false);
    });

    it("SUPER_ADMIN 可以提升用户为 ADMIN", () => {
      const result = canChangeUserRole(SA, U, A, "user@test.com");
      expect(result.allowed).toBe(true);
    });

    it("SUPER_ADMIN 可以降级 ADMIN 为 USER", () => {
      const result = canChangeUserRole(SA, A, U, "admin@test.com");
      expect(result.allowed).toBe(true);
    });

    it("SUPER_ADMIN 不能创建第二个 SUPER_ADMIN", () => {
      const result = canChangeUserRole(SA, U, SA, "user@test.com");
      expect(result.allowed).toBe(false);
    });

    it("SUPER_ADMIN 不能降级自己（通过邮箱检查）", () => {
      const result = canChangeUserRole(SA, SA, U, SUPER_ADMIN_EMAIL);
      expect(result.allowed).toBe(false);
    });

    it("MODERATOR 不能修改任何人角色", () => {
      const result = canChangeUserRole(M, U, A, "user@test.com");
      expect(result.allowed).toBe(false);
    });

    it("USER 不能修改任何人角色", () => {
      const result = canChangeUserRole(U, U, A, "user@test.com");
      expect(result.allowed).toBe(false);
    });
  });

  describe("封禁保护", () => {
    it("不能封禁 SUPER_ADMIN", () => {
      const result = canBanUser(A, SA);
      expect(result.allowed).toBe(false);
    });

    it("ADMIN 不能封禁另一个 ADMIN", () => {
      const result = canBanUser(A, A);
      expect(result.allowed).toBe(false);
    });

    it("ADMIN 可以封禁 MODERATOR", () => {
      const result = canBanUser(A, M);
      expect(result.allowed).toBe(true);
    });

    it("ADMIN 可以封禁 USER", () => {
      const result = canBanUser(A, U);
      expect(result.allowed).toBe(true);
    });

    it("MODERATOR 不能封禁任何人", () => {
      const result = canBanUser(M, U);
      expect(result.allowed).toBe(false);
    });

    it("SUPER_ADMIN 可以封禁 ADMIN", () => {
      const result = canBanUser(SA, A);
      expect(result.allowed).toBe(true);
    });
  });

  describe("删除保护", () => {
    it("任何人都不能删除 SUPER_ADMIN", () => {
      expect(canDeleteUser(SA, SA).allowed).toBe(false);
      expect(canDeleteUser(A, SA).allowed).toBe(false);
    });

    it("ADMIN 不能删除另一个 ADMIN", () => {
      const result = canDeleteUser(A, A);
      expect(result.allowed).toBe(false);
    });

    it("SUPER_ADMIN 可以删除 ADMIN", () => {
      const result = canDeleteUser(SA, A);
      expect(result.allowed).toBe(true);
    });
  });
});

describe("API 安全：数据隐私", () => {
  describe("safeAuthorSelect 字段限制", () => {
    it("只允许安全字段", async () => {
      const { safeAuthorSelect } = await import("../query-helpers");
      const keys = Object.keys(safeAuthorSelect);
      expect(keys).toContain("id");
      expect(keys).toContain("username");
      expect(keys).toContain("role");
      expect(keys).toContain("profile");
      expect(keys).not.toContain("passwordHash");
      expect(keys).not.toContain("email");
      expect(keys).not.toContain("isBanned");
      expect(keys).not.toContain("bannedReason");
    });

    it("profile 只暴露公开字段", async () => {
      const { safeAuthorSelect } = await import("../query-helpers");
      const profileSelect = safeAuthorSelect.profile as { select: Record<string, boolean> };
      const profileKeys = Object.keys(profileSelect.select);
      expect(profileKeys).toContain("nickname");
      expect(profileKeys).toContain("avatar");
      expect(profileKeys).toContain("bio");
      expect(profileKeys).not.toContain("userId");
    });
  });
});

describe("API 安全：输入验证", () => {
  it("评论内容必须至少2个字符", async () => {
    const { commentSchema } = await import("../validations");
    const result = commentSchema.safeParse({ content: "a" });
    expect(result.success).toBe(false);
  });

  it("举报原因不能为空", async () => {
    const { reportSchema } = await import("../validations");
    const result = reportSchema.safeParse({ reason: "" });
    expect(result.success).toBe(false);
  });

  it("草稿只需标题", async () => {
    const { draftCaseSchema } = await import("../validations");
    const result = draftCaseSchema.safeParse({ title: "test draft" });
    expect(result.success).toBe(true);
  });

  it("完整案例需要所有必填字段", async () => {
    const { failureCaseSchema } = await import("../validations");
    const result = failureCaseSchema.safeParse({ title: "test" });
    expect(result.success).toBe(false);
  });
});

describe("API 安全：邮件降级", () => {
  it("isEmailConfigured 无 SMTP 配置时返回 false", async () => {
    const { isEmailConfigured } = await import("../email");
    // 测试环境没有 SMTP 配置
    expect(isEmailConfigured()).toBe(false);
  });
});

describe("API 安全：SUPER_ADMIN 唯一性", () => {
  it("SUPER_ADMIN_EMAIL 固定为 hpulse001@gmail.com", () => {
    expect(SUPER_ADMIN_EMAIL).toBe("hpulse001@gmail.com");
  });

  it("所有角色变更路径都不能产生第二个 SUPER_ADMIN", () => {
    const allRoles = ["SUPER_ADMIN", "ADMIN", "MODERATOR", "USER"] as const;

    for (const operatorRole of allRoles) {
      const result = canChangeUserRole(
        operatorRole,
        "USER" as const,
        "SUPER_ADMIN" as const,
        "any@test.com"
      );
      expect(result.allowed).toBe(false);
    }
  });
});

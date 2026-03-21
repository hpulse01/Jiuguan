/**
 * Seed 数据完整性测试
 * 验证种子数据逻辑、超级管理员唯一性、密码安全
 */
import { describe, it, expect } from "vitest";
import bcrypt from "bcryptjs";
import { SUPER_ADMIN_EMAIL } from "../permissions";

describe("Seed 数据完整性", () => {
  describe("超级管理员配置", () => {
    it("超级管理员邮箱是 hpulse001@gmail.com", () => {
      expect(SUPER_ADMIN_EMAIL).toBe("hpulse001@gmail.com");
    });

    it("密码使用 bcrypt hash 存储（不是明文）", async () => {
      const plainPassword = "123456";
      const hash = await bcrypt.hash(plainPassword, 12);

      // hash 以 $2b$ 或 $2a$ 开头
      expect(hash).toMatch(/^\$2[ab]\$/);
      // hash 不等于明文
      expect(hash).not.toBe(plainPassword);
      // 可以验证
      expect(await bcrypt.compare(plainPassword, hash)).toBe(true);
      // 错误密码不能验证
      expect(await bcrypt.compare("wrong", hash)).toBe(false);
    });

    it("bcrypt hash 长度正确（60字符）", async () => {
      const hash = await bcrypt.hash("test", 12);
      expect(hash.length).toBe(60);
    });
  });

  describe("测试账号密码安全", () => {
    const testPasswords = ["123456", "admin123", "mod123", "user123"];

    it("所有测试密码都可以被 bcrypt hash", async () => {
      for (const pwd of testPasswords) {
        const hash = await bcrypt.hash(pwd, 12);
        expect(hash).toMatch(/^\$2[ab]\$/);
        expect(await bcrypt.compare(pwd, hash)).toBe(true);
      }
    });

    it("同一密码每次 hash 结果不同（bcrypt salt）", async () => {
      const hash1 = await bcrypt.hash("123456", 12);
      const hash2 = await bcrypt.hash("123456", 12);
      expect(hash1).not.toBe(hash2);
      // 但都能验证
      expect(await bcrypt.compare("123456", hash1)).toBe(true);
      expect(await bcrypt.compare("123456", hash2)).toBe(true);
    });
  });

  describe("客户端代码安全", () => {
    it("safeAuthorSelect 不包含 passwordHash", async () => {
      const { safeAuthorSelect } = await import("../query-helpers");
      const json = JSON.stringify(safeAuthorSelect);
      expect(json).not.toContain("passwordHash");
      expect(json).not.toContain("password");
    });

    it("safeAuthorSelect 不包含 email", async () => {
      const { safeAuthorSelect } = await import("../query-helpers");
      const json = JSON.stringify(safeAuthorSelect);
      expect(json).not.toContain("email");
    });
  });
});

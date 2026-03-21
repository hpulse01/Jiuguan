import { describe, it, expect } from "vitest";
import {
  isRoleAtLeast,
  isRoleHigherThan,
  isSuperAdmin,
  isAdmin,
  hasAdminAccess,
  canChangeUserRole,
  canBanUser,
  canDeleteUser,
  getRoleLabel,
  getAssignableRoles,
  SUPER_ADMIN_EMAIL,
} from "../permissions";

describe("权限系统", () => {
  describe("SUPER_ADMIN_EMAIL", () => {
    it("超级管理员邮箱固定为 hpulse001@gmail.com", () => {
      expect(SUPER_ADMIN_EMAIL).toBe("hpulse001@gmail.com");
    });
  });

  describe("isSuperAdmin", () => {
    it("SUPER_ADMIN 返回 true", () => {
      expect(isSuperAdmin("SUPER_ADMIN")).toBe(true);
    });
    it("其他角色返回 false", () => {
      expect(isSuperAdmin("ADMIN")).toBe(false);
      expect(isSuperAdmin("MODERATOR")).toBe(false);
      expect(isSuperAdmin("USER")).toBe(false);
      expect(isSuperAdmin("GUEST")).toBe(false);
    });
  });

  describe("isAdmin", () => {
    it("ADMIN 和 SUPER_ADMIN 返回 true", () => {
      expect(isAdmin("ADMIN")).toBe(true);
      expect(isAdmin("SUPER_ADMIN")).toBe(true);
    });
    it("其他角色返回 false", () => {
      expect(isAdmin("MODERATOR")).toBe(false);
      expect(isAdmin("USER")).toBe(false);
    });
  });

  describe("hasAdminAccess", () => {
    it("MODERATOR 及以上返回 true", () => {
      expect(hasAdminAccess("SUPER_ADMIN")).toBe(true);
      expect(hasAdminAccess("ADMIN")).toBe(true);
      expect(hasAdminAccess("MODERATOR")).toBe(true);
    });
    it("USER 和 GUEST 返回 false", () => {
      expect(hasAdminAccess("USER")).toBe(false);
      expect(hasAdminAccess("GUEST")).toBe(false);
    });
  });

  describe("isRoleAtLeast", () => {
    it("角色权重比较正确", () => {
      expect(isRoleAtLeast("SUPER_ADMIN", "ADMIN")).toBe(true);
      expect(isRoleAtLeast("ADMIN", "ADMIN")).toBe(true);
      expect(isRoleAtLeast("MODERATOR", "ADMIN")).toBe(false);
      expect(isRoleAtLeast("USER", "MODERATOR")).toBe(false);
      expect(isRoleAtLeast("GUEST", "USER")).toBe(false);
    });
  });

  describe("isRoleHigherThan", () => {
    it("SUPER_ADMIN 高于所有", () => {
      expect(isRoleHigherThan("SUPER_ADMIN", "ADMIN")).toBe(true);
      expect(isRoleHigherThan("SUPER_ADMIN", "MODERATOR")).toBe(true);
    });
    it("同级不算高于", () => {
      expect(isRoleHigherThan("ADMIN", "ADMIN")).toBe(false);
    });
  });

  describe("canChangeUserRole - 核心权限保护", () => {
    it("不能将任何人设为 SUPER_ADMIN", () => {
      const result = canChangeUserRole("SUPER_ADMIN", "USER", "SUPER_ADMIN");
      expect(result.allowed).toBe(false);
    });

    it("不能将任何人设为 SUPER_ADMIN（即使操作者是 SUPER_ADMIN）", () => {
      const result = canChangeUserRole("SUPER_ADMIN", "ADMIN", "SUPER_ADMIN");
      expect(result.allowed).toBe(false);
    });

    it("不能修改 SUPER_ADMIN 的角色", () => {
      const result = canChangeUserRole("SUPER_ADMIN", "SUPER_ADMIN", "ADMIN");
      expect(result.allowed).toBe(false);
    });

    it("不能修改超级管理员邮箱对应的账号角色", () => {
      const result = canChangeUserRole("SUPER_ADMIN", "ADMIN", "USER", SUPER_ADMIN_EMAIL);
      expect(result.allowed).toBe(false);
    });

    it("ADMIN 不能修改其他 ADMIN 的角色", () => {
      const result = canChangeUserRole("ADMIN", "ADMIN", "USER");
      expect(result.allowed).toBe(false);
    });

    it("ADMIN 不能提升别人为 ADMIN", () => {
      const result = canChangeUserRole("ADMIN", "USER", "ADMIN");
      expect(result.allowed).toBe(false);
    });

    it("ADMIN 可以将 USER 提升为 MODERATOR", () => {
      const result = canChangeUserRole("ADMIN", "USER", "MODERATOR");
      expect(result.allowed).toBe(true);
    });

    it("ADMIN 可以将 MODERATOR 降级为 USER", () => {
      const result = canChangeUserRole("ADMIN", "MODERATOR", "USER");
      expect(result.allowed).toBe(true);
    });

    it("SUPER_ADMIN 可以将 USER 提升为 ADMIN", () => {
      const result = canChangeUserRole("SUPER_ADMIN", "USER", "ADMIN");
      expect(result.allowed).toBe(true);
    });

    it("SUPER_ADMIN 可以将 ADMIN 降级为 MODERATOR", () => {
      const result = canChangeUserRole("SUPER_ADMIN", "ADMIN", "MODERATOR");
      expect(result.allowed).toBe(true);
    });

    it("MODERATOR 不能修改角色", () => {
      const result = canChangeUserRole("MODERATOR", "USER", "MODERATOR");
      expect(result.allowed).toBe(false);
    });

    it("USER 不能修改角色", () => {
      const result = canChangeUserRole("USER", "USER", "MODERATOR");
      expect(result.allowed).toBe(false);
    });
  });

  describe("canBanUser", () => {
    it("不能封禁 SUPER_ADMIN", () => {
      expect(canBanUser("ADMIN", "SUPER_ADMIN").allowed).toBe(false);
    });

    it("不能封禁超级管理员邮箱", () => {
      expect(canBanUser("ADMIN", "USER", SUPER_ADMIN_EMAIL).allowed).toBe(false);
    });

    it("ADMIN 不能封禁其他 ADMIN", () => {
      expect(canBanUser("ADMIN", "ADMIN").allowed).toBe(false);
    });

    it("SUPER_ADMIN 可以封禁 ADMIN", () => {
      expect(canBanUser("SUPER_ADMIN", "ADMIN").allowed).toBe(true);
    });

    it("ADMIN 可以封禁 USER", () => {
      expect(canBanUser("ADMIN", "USER").allowed).toBe(true);
    });

    it("MODERATOR 不能封禁", () => {
      expect(canBanUser("MODERATOR", "USER").allowed).toBe(false);
    });
  });

  describe("canDeleteUser", () => {
    it("不能删除 SUPER_ADMIN", () => {
      expect(canDeleteUser("SUPER_ADMIN", "SUPER_ADMIN").allowed).toBe(false);
    });

    it("不能删除超级管理员邮箱", () => {
      expect(canDeleteUser("SUPER_ADMIN", "USER", SUPER_ADMIN_EMAIL).allowed).toBe(false);
    });

    it("只有 SUPER_ADMIN 可以删除用户", () => {
      expect(canDeleteUser("ADMIN", "USER").allowed).toBe(false);
      expect(canDeleteUser("SUPER_ADMIN", "USER").allowed).toBe(true);
    });
  });

  describe("getRoleLabel", () => {
    it("返回正确的中文标签", () => {
      expect(getRoleLabel("SUPER_ADMIN")).toBe("超级管理员");
      expect(getRoleLabel("ADMIN")).toBe("管理员");
      expect(getRoleLabel("MODERATOR")).toBe("版主");
      expect(getRoleLabel("USER")).toBe("用户");
      expect(getRoleLabel("GUEST")).toBe("游客");
    });
  });

  describe("getAssignableRoles", () => {
    it("SUPER_ADMIN 可以分配 USER, MODERATOR, ADMIN", () => {
      const roles = getAssignableRoles("SUPER_ADMIN");
      expect(roles).toContain("USER");
      expect(roles).toContain("MODERATOR");
      expect(roles).toContain("ADMIN");
      expect(roles).not.toContain("SUPER_ADMIN");
    });

    it("ADMIN 只能分配 USER, MODERATOR", () => {
      const roles = getAssignableRoles("ADMIN");
      expect(roles).toContain("USER");
      expect(roles).toContain("MODERATOR");
      expect(roles).not.toContain("ADMIN");
      expect(roles).not.toContain("SUPER_ADMIN");
    });

    it("MODERATOR 不能分配任何角色", () => {
      expect(getAssignableRoles("MODERATOR")).toHaveLength(0);
    });

    it("USER 不能分配任何角色", () => {
      expect(getAssignableRoles("USER")).toHaveLength(0);
    });
  });

  describe("系统唯一性保证", () => {
    it("不存在任何路径可以创建第二个 SUPER_ADMIN", () => {
      // 从 USER 升级
      expect(canChangeUserRole("SUPER_ADMIN", "USER", "SUPER_ADMIN").allowed).toBe(false);
      // 从 MODERATOR 升级
      expect(canChangeUserRole("SUPER_ADMIN", "MODERATOR", "SUPER_ADMIN").allowed).toBe(false);
      // 从 ADMIN 升级
      expect(canChangeUserRole("SUPER_ADMIN", "ADMIN", "SUPER_ADMIN").allowed).toBe(false);
      // ADMIN 尝试
      expect(canChangeUserRole("ADMIN", "USER", "SUPER_ADMIN").allowed).toBe(false);
      expect(canChangeUserRole("ADMIN", "MODERATOR", "SUPER_ADMIN").allowed).toBe(false);
    });

    it("不存在任何路径可以降级超级管理员", () => {
      expect(canChangeUserRole("SUPER_ADMIN", "SUPER_ADMIN", "ADMIN").allowed).toBe(false);
      expect(canChangeUserRole("SUPER_ADMIN", "SUPER_ADMIN", "USER").allowed).toBe(false);
      expect(canChangeUserRole("ADMIN", "SUPER_ADMIN", "ADMIN").allowed).toBe(false);
      expect(canChangeUserRole("ADMIN", "SUPER_ADMIN", "USER").allowed).toBe(false);
    });

    it("不存在任何路径可以封禁超级管理员", () => {
      expect(canBanUser("SUPER_ADMIN", "SUPER_ADMIN").allowed).toBe(false);
      expect(canBanUser("ADMIN", "SUPER_ADMIN").allowed).toBe(false);
      expect(canBanUser("SUPER_ADMIN", "USER", SUPER_ADMIN_EMAIL).allowed).toBe(false);
    });

    it("不存在任何路径可以删除超级管理员", () => {
      expect(canDeleteUser("SUPER_ADMIN", "SUPER_ADMIN").allowed).toBe(false);
      expect(canDeleteUser("SUPER_ADMIN", "USER", SUPER_ADMIN_EMAIL).allowed).toBe(false);
    });
  });
});

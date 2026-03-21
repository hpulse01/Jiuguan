/**
 * 酒馆权限系统 - 集中式权限管理
 *
 * 角色层级（从高到低）：
 * SUPER_ADMIN > ADMIN > MODERATOR > USER > GUEST
 *
 * SUPER_ADMIN 是全系统唯一最高权限，只能是 hpulse001@gmail.com
 */

import type { UserRole } from "@prisma/client";

// 超级管理员固定邮箱
export const SUPER_ADMIN_EMAIL = "hpulse001@gmail.com";

// 角色权重，用于比较权限等级
const ROLE_WEIGHT: Record<UserRole, number> = {
  GUEST: 0,
  USER: 1,
  MODERATOR: 2,
  ADMIN: 3,
  SUPER_ADMIN: 4,
};

/** 判断角色 a 是否 >= 角色 b */
export function isRoleAtLeast(role: UserRole, minRole: UserRole): boolean {
  return ROLE_WEIGHT[role] >= ROLE_WEIGHT[minRole];
}

/** 判断角色 a 是否高于角色 b */
export function isRoleHigherThan(role: UserRole, other: UserRole): boolean {
  return ROLE_WEIGHT[role] > ROLE_WEIGHT[other];
}

/** 判断是否为超级管理员 */
export function isSuperAdmin(role: UserRole): boolean {
  return role === "SUPER_ADMIN";
}

/** 判断是否为管理层（ADMIN 或 SUPER_ADMIN） */
export function isAdmin(role: UserRole): boolean {
  return role === "ADMIN" || role === "SUPER_ADMIN";
}

/** 判断是否有后台访问权限（MODERATOR 及以上） */
export function hasAdminAccess(role: UserRole): boolean {
  return isRoleAtLeast(role, "MODERATOR");
}

/** 判断用户是否可以修改目标用户的角色 */
export function canChangeUserRole(
  actorRole: UserRole,
  targetCurrentRole: UserRole,
  targetNewRole: UserRole,
  targetEmail?: string
): { allowed: boolean; reason?: string } {
  // 只有 ADMIN 和 SUPER_ADMIN 可以修改角色
  if (!isAdmin(actorRole)) {
    return { allowed: false, reason: "权限不足，只有管理员可以修改用户角色" };
  }

  // 不能把任何人设为 SUPER_ADMIN
  if (targetNewRole === "SUPER_ADMIN") {
    return { allowed: false, reason: "不能将用户设置为超级管理员，系统中只允许存在一个超级管理员" };
  }

  // 不能修改 SUPER_ADMIN 的角色
  if (targetCurrentRole === "SUPER_ADMIN") {
    return { allowed: false, reason: "不能修改超级管理员的角色" };
  }

  // 保护超级管理员邮箱
  if (targetEmail === SUPER_ADMIN_EMAIL) {
    return { allowed: false, reason: "不能修改超级管理员账号的角色" };
  }

  // ADMIN 不能修改其他 ADMIN 的角色（只有 SUPER_ADMIN 可以）
  if (actorRole === "ADMIN" && targetCurrentRole === "ADMIN") {
    return { allowed: false, reason: "管理员不能修改其他管理员的角色，请联系超级管理员" };
  }

  // ADMIN 不能把人提升到 ADMIN（只有 SUPER_ADMIN 可以）
  if (actorRole === "ADMIN" && targetNewRole === "ADMIN") {
    return { allowed: false, reason: "只有超级管理员可以提升用户为管理员" };
  }

  return { allowed: true };
}

/** 判断用户是否可以封禁目标用户 */
export function canBanUser(
  actorRole: UserRole,
  targetRole: UserRole,
  targetEmail?: string
): { allowed: boolean; reason?: string } {
  if (!isAdmin(actorRole)) {
    return { allowed: false, reason: "权限不足" };
  }

  if (targetRole === "SUPER_ADMIN" || targetEmail === SUPER_ADMIN_EMAIL) {
    return { allowed: false, reason: "不能封禁超级管理员" };
  }

  if (actorRole === "ADMIN" && targetRole === "ADMIN") {
    return { allowed: false, reason: "管理员不能封禁其他管理员" };
  }

  return { allowed: true };
}

/** 判断用户是否可以删除目标用户 */
export function canDeleteUser(
  actorRole: UserRole,
  targetRole: UserRole,
  targetEmail?: string
): { allowed: boolean; reason?: string } {
  if (targetRole === "SUPER_ADMIN" || targetEmail === SUPER_ADMIN_EMAIL) {
    return { allowed: false, reason: "不能删除超级管理员账号" };
  }

  if (!isSuperAdmin(actorRole)) {
    return { allowed: false, reason: "只有超级管理员可以删除用户" };
  }

  return { allowed: true };
}

/** 获取角色的中文显示名称 */
export function getRoleLabel(role: UserRole): string {
  const labels: Record<UserRole, string> = {
    GUEST: "游客",
    USER: "用户",
    MODERATOR: "版主",
    ADMIN: "管理员",
    SUPER_ADMIN: "超级管理员",
  };
  return labels[role] || role;
}

/** 获取当前角色可以赋予的角色列表 */
export function getAssignableRoles(actorRole: UserRole): UserRole[] {
  if (isSuperAdmin(actorRole)) {
    return ["USER", "MODERATOR", "ADMIN"];
  }
  if (actorRole === "ADMIN") {
    return ["USER", "MODERATOR"];
  }
  return [];
}

/** 所有合法角色值 */
export const ALL_ROLES: UserRole[] = ["GUEST", "USER", "MODERATOR", "ADMIN", "SUPER_ADMIN"];

/** 非 SUPER_ADMIN 的可设置角色 */
export const ASSIGNABLE_ROLES: UserRole[] = ["GUEST", "USER", "MODERATOR", "ADMIN"];

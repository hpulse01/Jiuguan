import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiRequireSuperAdmin, isAuthError } from "@/lib/api-auth";
import { SUPER_ADMIN_EMAIL, getRoleLabel } from "@/lib/permissions";

export async function GET() {
  try {
    const result = await apiRequireSuperAdmin();
    if (isAuthError(result)) return result;

    // 获取所有高权限用户
    const privilegedUsers = await db.user.findMany({
      where: {
        role: { in: ["SUPER_ADMIN", "ADMIN", "MODERATOR"] },
      },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        isBanned: true,
        createdAt: true,
        profile: { select: { nickname: true, avatar: true } },
        _count: {
          select: {
            moderationLogs: true,
          },
        },
      },
      orderBy: [
        { role: "desc" },
        { createdAt: "asc" },
      ],
    });

    // 角色分布
    const roleDistribution = await db.user.groupBy({
      by: ["role"],
      _count: { role: true },
    });

    // 最近敏感操作日志
    const sensitiveActions = await db.moderationLog.findMany({
      where: {
        action: {
          in: [
            "ROLE_CHANGED",
            "USER_BANNED",
            "USER_UNBANNED",
            "ILLEGAL_ROLE_CHANGE_ATTEMPT",
            "ILLEGAL_BAN_ATTEMPT",
            "ILLEGAL_DELETE_ATTEMPT",
          ],
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        moderator: {
          select: {
            id: true,
            username: true,
            email: true,
            role: true,
            profile: { select: { nickname: true } },
          },
        },
      },
    });

    // 超级管理员信息
    const superAdmin = await db.user.findUnique({
      where: { email: SUPER_ADMIN_EMAIL },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        createdAt: true,
        profile: { select: { nickname: true } },
      },
    });

    return NextResponse.json({
      superAdmin,
      superAdminEmail: SUPER_ADMIN_EMAIL,
      privilegedUsers: privilegedUsers.map((u) => ({
        ...u,
        roleLabel: getRoleLabel(u.role),
      })),
      roleDistribution: roleDistribution.map((r) => ({
        role: r.role,
        label: getRoleLabel(r.role),
        count: r._count.role,
      })),
      sensitiveActions,
      roleHierarchy: [
        { role: "SUPER_ADMIN", label: "超级管理员", description: "全系统唯一最高权限，可管理所有功能和用户" },
        { role: "ADMIN", label: "管理员", description: "可管理内容、用户（不含超级管理员）、分类、标签" },
        { role: "MODERATOR", label: "版主", description: "可审核案例、处理举报、管理基础内容" },
        { role: "USER", label: "用户", description: "可发布案例、评论、投票、收藏" },
        { role: "GUEST", label: "游客", description: "只读浏览" },
      ],
    });
  } catch (error) {
    console.error("Failed to fetch permissions data:", error);
    return NextResponse.json({ error: "获取权限数据失败" }, { status: 500 });
  }
}

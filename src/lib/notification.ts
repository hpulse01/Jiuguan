/**
 * 通知服务 - 统一处理站内通知 + 邮件通知
 */

import { db } from "./db";
import { sendNotificationEmail, isEmailConfigured } from "./email";
import type { NotificationType } from "@prisma/client";

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  message: string;
  link?: string;
}

// 需要发送邮件的通知类型及其邮件主题映射
const EMAIL_NOTIFICATION_TYPES: Partial<Record<NotificationType, string>> = {
  COMMENT: "有人评论了你的案例",
  REPLY: "有人回复了你的评论",
  REVIEW_APPROVED: "你的案例已通过审核",
  REVIEW_REJECTED: "你的案例未通过审核",
  REPORT_HANDLED: "你的举报已处理",
};

/**
 * 创建通知并可选发送邮件
 * 对关键事件（评论、审核结果等）同时发送邮件
 */
export async function createNotification(params: CreateNotificationParams) {
  const { userId, type, message, link } = params;

  // 创建站内通知
  const notification = await db.notification.create({
    data: {
      userId,
      type,
      message,
      link: link || null,
    },
  });

  // 异步发送邮件（不阻塞主流程）
  if (isEmailConfigured() && EMAIL_NOTIFICATION_TYPES[type]) {
    sendEmailNotification(userId, type, message, link).catch((err) => {
      console.error("Failed to send notification email:", err);
    });
  }

  return notification;
}

async function sendEmailNotification(
  userId: string,
  type: NotificationType,
  message: string,
  link?: string
) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });

  if (!user) return;

  const subject = EMAIL_NOTIFICATION_TYPES[type] || "新通知";

  await sendNotificationEmail(
    user.email,
    subject,
    subject,
    message,
    link,
    "查看详情"
  );
}

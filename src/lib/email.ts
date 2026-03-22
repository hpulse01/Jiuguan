/**
 * 邮件发送工具
 * 支持 SMTP 发送验证邮件、密码重置邮件、通知邮件
 */

import nodemailer from "nodemailer";

const smtpPort = parseInt(process.env.SMTP_PORT || "587");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: smtpPort,
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  // 本地开发服务器不支持 TLS，跳过 STARTTLS
  ...(["localhost", "127.0.0.1"].includes(process.env.SMTP_HOST || "") && {
    ignoreTLS: true,
  }),
});

const FROM_EMAIL = process.env.SMTP_FROM || "酒馆 <noreply@jiuguan.com>";
const APP_URL = process.env.NEXTAUTH_URL || "http://localhost:3000";

function wrapHtml(title: string, body: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>${title}</title></head>
<body style="margin:0;padding:0;background:#0f0d0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#1c1917;border-radius:12px;border:1px solid #44403c;overflow:hidden;">
    <div style="background:linear-gradient(135deg,#78350f,#451a03);padding:24px 32px;text-align:center;">
      <h1 style="margin:0;color:#f59e0b;font-size:24px;">🍷 酒馆</h1>
    </div>
    <div style="padding:32px;color:#d6d3d1;line-height:1.6;">
      ${body}
    </div>
    <div style="padding:16px 32px;border-top:1px solid #292524;text-align:center;">
      <p style="margin:0;color:#78716c;font-size:12px;">在酒馆，每一次失败都值得被倾听</p>
    </div>
  </div>
</body>
</html>`;
}

/** 发送邮箱验证邮件 */
export async function sendVerificationEmail(email: string, token: string): Promise<void> {
  if (!isEmailConfigured()) {
    console.log(`[Email] SMTP 未配置，跳过发送验证邮件到 ${email}`);
    return;
  }
  const verifyUrl = `${APP_URL}/verify-email?token=${token}`;
  const html = wrapHtml(
    "验证你的邮箱",
    `
    <h2 style="color:#fbbf24;margin-top:0;">欢迎加入酒馆！</h2>
    <p>请点击下方按钮验证你的邮箱地址，完成注册：</p>
    <div style="text-align:center;margin:24px 0;">
      <a href="${verifyUrl}" style="display:inline-block;background:#f59e0b;color:#0f0d0a;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px;">验证邮箱</a>
    </div>
    <p style="color:#a8a29e;font-size:14px;">如果按钮无法点击，请复制以下链接到浏览器：</p>
    <p style="color:#a8a29e;font-size:12px;word-break:break-all;">${verifyUrl}</p>
    <p style="color:#78716c;font-size:13px;margin-top:24px;">此链接将在24小时后失效。如果你没有注册酒馆账号，请忽略此邮件。</p>
    `
  );

  await transporter.sendMail({
    from: FROM_EMAIL,
    to: email,
    subject: "【酒馆】验证你的邮箱",
    html,
  });
}

/** 发送密码重置邮件 */
export async function sendPasswordResetEmail(email: string, token: string): Promise<void> {
  if (!isEmailConfigured()) {
    console.log(`[Email] SMTP 未配置，跳过发送密码重置邮件到 ${email}`);
    return;
  }
  const resetUrl = `${APP_URL}/reset-password?token=${token}`;
  const html = wrapHtml(
    "重置密码",
    `
    <h2 style="color:#fbbf24;margin-top:0;">重置你的密码</h2>
    <p>我们收到了你的密码重置请求。点击下方按钮设置新密码：</p>
    <div style="text-align:center;margin:24px 0;">
      <a href="${resetUrl}" style="display:inline-block;background:#f59e0b;color:#0f0d0a;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px;">重置密码</a>
    </div>
    <p style="color:#a8a29e;font-size:14px;">如果按钮无法点击，请复制以下链接到浏览器：</p>
    <p style="color:#a8a29e;font-size:12px;word-break:break-all;">${resetUrl}</p>
    <p style="color:#78716c;font-size:13px;margin-top:24px;">此链接将在1小时后失效。如果你没有请求重置密码，请忽略此邮件。</p>
    `
  );

  await transporter.sendMail({
    from: FROM_EMAIL,
    to: email,
    subject: "【酒馆】重置你的密码",
    html,
  });
}

/** 发送通知邮件（通用） */
export async function sendNotificationEmail(
  email: string,
  subject: string,
  title: string,
  message: string,
  actionUrl?: string,
  actionText?: string
): Promise<void> {
  if (!isEmailConfigured()) {
    return;
  }
  const actionHtml = actionUrl
    ? `<div style="text-align:center;margin:24px 0;">
        <a href="${APP_URL}${actionUrl}" style="display:inline-block;background:#f59e0b;color:#0f0d0a;padding:10px 24px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:14px;">${actionText || "查看详情"}</a>
       </div>`
    : "";

  const html = wrapHtml(subject, `
    <h2 style="color:#fbbf24;margin-top:0;">${title}</h2>
    <p>${message}</p>
    ${actionHtml}
    <p style="color:#78716c;font-size:13px;margin-top:24px;">
      你可以在 <a href="${APP_URL}/settings" style="color:#f59e0b;">设置</a> 中管理邮件通知偏好。
    </p>
  `);

  await transporter.sendMail({
    from: FROM_EMAIL,
    to: email,
    subject: `【酒馆】${subject}`,
    html,
  });
}

/** 检查邮件服务是否已配置 */
export function isEmailConfigured(): boolean {
  return !!(process.env.SMTP_USER && process.env.SMTP_PASS);
}

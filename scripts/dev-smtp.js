/**
 * 本地开发邮件服务器
 * 接收所有邮件并输出到控制台 + 保存到 ./emails/ 目录
 *
 * 用法: node scripts/dev-smtp.js
 * 默认端口: 2525
 */

const { SMTPServer } = require("smtp-server");
const { simpleParser } = require("mailparser");
const fs = require("fs");
const path = require("path");

const PORT = parseInt(process.env.DEV_SMTP_PORT || "2525");
const EMAIL_DIR = path.join(__dirname, "..", "emails");

if (!fs.existsSync(EMAIL_DIR)) {
  fs.mkdirSync(EMAIL_DIR, { recursive: true });
}

const server = new SMTPServer({
  secure: false,
  authOptional: true,
  disabledCommands: ["STARTTLS"],
  onAuth(auth, session, callback) {
    callback(null, { user: auth.username });
  },
  onData(stream, session, callback) {
    const chunks = [];
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("end", async () => {
      const raw = Buffer.concat(chunks).toString();
      try {
        const parsed = await simpleParser(raw);
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const subject = (parsed.subject || "no-subject").replace(/[^a-zA-Z0-9\u4e00-\u9fff-]/g, "_");
        const filename = `${timestamp}_${subject}.html`;
        const htmlContent = parsed.html || parsed.textAsHtml || parsed.text || "";
        fs.writeFileSync(path.join(EMAIL_DIR, filename), htmlContent);

        console.log("\n" + "=".repeat(60));
        console.log(`📧 收到邮件 [${new Date().toLocaleTimeString()}]`);
        console.log("=".repeat(60));
        console.log(`  From:    ${parsed.from?.text}`);
        console.log(`  To:      ${parsed.to?.text}`);
        console.log(`  Subject: ${parsed.subject}`);
        console.log(`  保存至:  emails/${filename}`);
        if (parsed.text) {
          const preview = parsed.text.substring(0, 200).replace(/\s+/g, " ").trim();
          console.log(`  预览:    ${preview}...`);
        }
        const linkMatch = (htmlContent || "").match(/href="(http[^"]+)"/g);
        if (linkMatch) {
          console.log("  链接:");
          linkMatch.forEach((link) => {
            const url = link.replace('href="', "").replace('"', "");
            console.log(`    → ${url}`);
          });
        }
        console.log("=".repeat(60));
      } catch (err) {
        console.error("解析邮件失败:", err);
      }
      callback();
    });
  },
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`\n🍷 酒馆开发邮件服务器已启动`);
  console.log(`   SMTP 端口: ${PORT}`);
  console.log(`   邮件保存: ./emails/`);
  console.log(`   无需认证，接收所有邮件\n`);
  console.log(`   .env 配置:`);
  console.log(`   SMTP_HOST="127.0.0.1"`);
  console.log(`   SMTP_PORT="${PORT}"`);
  console.log(`   SMTP_USER="dev"`);
  console.log(`   SMTP_PASS="dev"`);
  console.log(`\n   等待邮件...\n`);
});

server.on("error", (err) => {
  console.error("SMTP 服务器错误:", err.message);
});

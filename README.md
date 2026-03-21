# 酒馆 (Jiuguan)

> 别人都在教你成功，酒馆告诉你如何避开失败。

酒馆是一个专门收集失败经历、失败复盘、踩坑经验和避坑建议的真实交流平台。目标不是教人成功，而是帮助人避开失败。

## 技术栈

- **框架**: Next.js 15 (App Router)
- **语言**: TypeScript
- **数据库**: PostgreSQL + Prisma ORM
- **认证**: NextAuth.js v5 (Credentials)
- **样式**: Tailwind CSS + shadcn/ui
- **表单**: React Hook Form + Zod
- **测试**: Vitest + Testing Library

## 快速开始

### 环境要求

- Node.js 18+
- PostgreSQL 16+（或使用 Docker）

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env`，设置数据库连接和密钥：

```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/jiuguan?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-change-in-production"
```

### 3. 启动数据库

使用 Docker Compose：

```bash
docker-compose up -d
```

或使用已有的 PostgreSQL 实例，确保 `DATABASE_URL` 配置正确。

### 4. 初始化数据库

```bash
# 生成 Prisma Client
npm run db:generate

# 推送 Schema 到数据库
npm run db:push

# 初始化种子数据（超级管理员、分类、标签、示例案例）
npm run db:seed
```

### 5. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

## 角色权限体系

酒馆采用分层权限模型，共 5 个角色等级：

| 等级 | 角色 | 说明 |
|------|------|------|
| 5 | **SUPER_ADMIN** (超级管理员) | 全系统唯一最高权限，固定为 `hpulse001@gmail.com` |
| 4 | **ADMIN** (管理员) | 内容管理、用户管理（不含超级管理员）、分类/标签管理 |
| 3 | **MODERATOR** (版主) | 案例审核、举报处理、基础内容管理 |
| 2 | **USER** (用户) | 发布案例、评论、投票、收藏 |
| 1 | **GUEST** (游客) | 只读浏览 |

### 超级管理员唯一性规则

- **系统中有且只有一个 SUPER_ADMIN**，固定邮箱为 `hpulse001@gmail.com`
- 任何人（包括超级管理员自己）都不能通过接口创建第二个 SUPER_ADMIN
- SUPER_ADMIN 不能被降级、封禁或删除
- 所有对超级管理员的非法操作尝试都会被记录到审计日志
- ADMIN 不能提升别人为 ADMIN（只有 SUPER_ADMIN 可以）
- ADMIN 不能修改其他 ADMIN 的角色

### 后台访问权限分层

| 功能 | SUPER_ADMIN | ADMIN | MODERATOR |
|------|:-----------:|:-----:|:---------:|
| 仪表盘 | ✅ | ✅ | ✅ |
| 案例管理/审核 | ✅ | ✅ | ✅ |
| 举报管理 | ✅ | ✅ | ✅ |
| 分类/标签管理 | ✅ | ✅ | ✅ |
| 操作日志 | ✅ (含敏感日志) | ✅ | ✅ |
| 用户管理 | ✅ (全部) | ✅ (不含SA) | 只读 |
| 用户封禁/解封 | ✅ | ✅ (不含ADMIN+) | ❌ |
| 角色升降级 | ✅ (可升至ADMIN) | ✅ (仅MODERATOR以下) | ❌ |
| **权限管理页** | ✅ | ❌ | ❌ |
| 敏感操作日志 | ✅ | ❌ | ❌ |

## 初始账号

种子数据会创建以下账号：

| 角色 | 邮箱 | 密码 |
|------|------|------|
| **超级管理员** | hpulse001@gmail.com | 123456 |
| 管理员 | admin@jiuguan.com | admin123 |
| 版主 | mod@jiuguan.com | mod123 |
| 用户 | user@jiuguan.com | user123 |

### 超级管理员恢复

如果超级管理员账号异常，重新运行 seed 即可修复：

```bash
npm run db:seed
```

seed 脚本会：
1. 降级所有非 `hpulse001@gmail.com` 的 SUPER_ADMIN 为 ADMIN
2. 创建或更新 `hpulse001@gmail.com` 为 SUPER_ADMIN
3. 更新密码为指定值的 bcrypt 哈希
4. 验证唯一性（若不唯一则报错中断）

## 可用脚本

```bash
npm run dev          # 启动开发服务器
npm run build        # 构建生产版本
npm run start        # 启动生产服务器
npm run lint         # 代码检查
npm run typecheck    # TypeScript 类型检查
npm run test         # 运行测试
npm run test:watch   # 监听模式测试
npm run db:generate  # 生成 Prisma Client
npm run db:migrate   # 运行数据库迁移
npm run db:push      # 推送 Schema 到数据库
npm run db:seed      # 初始化种子数据
npm run db:studio    # 打开 Prisma Studio
```

## 功能模块

### 用户系统
- 邮箱注册/登录/登出
- 个人资料编辑
- 用户主页
- 关注/粉丝
- 用户封禁/解封

### 失败案例
- 结构化案例发布（背景、目标、决策、行动、预警、结果、代价、根因、建议）
- 草稿保存与继续编辑
- 提交审核 -> 发布/驳回工作流
- 驳回后可重新编辑提交
- 匿名发布
- 案例详情页（完整展示所有字段）
- 精选案例管理
- 内容隐藏与恢复

### 互动功能
- "有用"投票
- "我也踩过这个坑"共鸣
- 收藏
- 结构化评论（提问/补充/不同看法/替代方案）
- 回复评论
- 举报

### 发现与搜索
- 首页（精选/最新/统计）
- 发现页（多维度推荐）
- 全文搜索
- 分类/标签筛选
- 多种排序（最新/最热/最有用/最共鸣）

### 通知系统
- 评论/回复通知
- 投票/收藏通知
- 审核结果通知
- 举报处理结果通知
- 关注通知
- 全部已读/单条已读

### 管理后台
- 仪表盘（统计数据、趋势图、角色分布）
- 案例审核（通过/驳回/恢复）
- 精选管理
- 举报处理（处理/驳回/一键隐藏内容）
- 分类/标签管理（CRUD）
- 用户管理（搜索/筛选/角色管理/封禁/解封）
- 操作日志（含敏感操作审计）
- **权限管理**（仅超级管理员）
  - 角色体系说明
  - 高权限账号列表
  - 角色分布统计
  - 敏感操作日志

## 项目结构

```
src/
  app/                  # Next.js App Router 页面
    api/                # API 路由
      admin/            # 管理后台 API
        permissions/    # 权限管理 API (仅 SUPER_ADMIN)
        users/          # 用户管理 API
        cases/          # 案例管理 API
        reports/        # 举报管理 API
        categories/     # 分类管理 API
        tags/           # 标签管理 API
        stats/          # 统计 API
        moderation-logs/# 操作日志 API
    admin/              # 管理后台页面
      permissions/      # 权限管理页 (仅 SUPER_ADMIN)
    cases/              # 案例相关页面
    categories/         # 分类页面
    tags/               # 标签页面
    my/                 # 用户个人中心
    user/               # 用户公开主页
  components/           # React 组件
    ui/                 # shadcn/ui 基础组件
    layout/             # 布局组件
  lib/                  # 工具库
    auth.ts             # NextAuth 配置
    auth-utils.ts       # 服务端认证工具函数
    api-auth.ts         # API 路由统一权限校验
    permissions.ts      # 集中式权限规则引擎
    db.ts               # Prisma 客户端
    validations.ts      # Zod 验证 Schema
    utils.ts            # 工具函数
prisma/
  schema.prisma         # 数据库 Schema
  seed.ts               # 种子数据（含超级管理员初始化）
```

## 安全特性

- 密码使用 bcrypt 哈希存储
- JWT Session 策略
- 服务端权限校验（所有后台 API 均有服务端权限检查）
- 集中式权限规则引擎（`src/lib/permissions.ts`）
- 统一 API 权限校验工具（`src/lib/api-auth.ts`）
- 超级管理员保护机制（不可降级/封禁/删除）
- 高敏感操作审计日志
- Rate Limiting
- Security Headers（X-Frame-Options, CSP 等）
- 匿名发布保护（不泄露真实身份）

## 生产部署

### 使用 Docker（推荐）

```bash
# 1. 创建 .env.production 文件
cat > .env.production << 'EOF'
POSTGRES_PASSWORD=<使用 openssl rand -base64 32 生成>
NEXTAUTH_SECRET=<使用 openssl rand -base64 32 生成>
NEXTAUTH_URL=https://your-domain.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=酒馆 <noreply@your-domain.com>
EOF

# 2. 启动所有服务（应用 + 数据库 + 自动备份）
docker compose -f docker-compose.prod.yml --env-file .env.production up -d

# 3. 初始化数据库
docker compose -f docker-compose.prod.yml exec app npx prisma db push
docker compose -f docker-compose.prod.yml exec app npx prisma db seed
```

生产部署包含：
- **健康检查**: `GET /api/health` — 返回应用和数据库状态
- **自动备份**: 每天凌晨3点自动备份数据库，保留最近30天
- **日志轮转**: JSON 格式日志，单文件最大10MB，最多保留5个文件
- **自动重启**: 服务异常时自动重启

### 手动部署

```bash
npm run build          # 构建
npm run start          # 启动
```

### 环境变量

生产环境必须修改：
- `NEXTAUTH_SECRET`: 使用 `openssl rand -base64 32` 生成强密钥
- `DATABASE_URL`: 使用生产数据库地址
- `NEXTAUTH_URL`: 设置为实际域名

### ⚠️ 生产安全检查清单

部署到生产环境前，**必须**完成以下安全检查：

1. **修改所有默认密码**
   - 超级管理员 `hpulse001@gmail.com` 的密码（seed 默认为 `123456`，**极度不安全**）
   - 管理员 `admin@jiuguan.com`（默认 `admin123`）
   - 版主 `mod@jiuguan.com`（默认 `mod123`）
   - 测试用户 `user@jiuguan.com`（默认 `user123`）
   - 如无需测试账号，**建议直接删除非超级管理员的 seed 账号**

2. **修改数据库密码**
   - Docker Compose 默认密码为 `postgres`，必须替换为强密码
   - 使用 `openssl rand -base64 32` 生成

3. **生成新的 NEXTAUTH_SECRET**
   - 使用 `openssl rand -base64 32` 生成，**不要使用默认值**

4. **配置 HTTPS**
   - 使用反向代理（Nginx/Caddy）配置 SSL 证书
   - 确保 `NEXTAUTH_URL` 使用 `https://` 协议

5. **数据库安全**
   - 不要将 PostgreSQL 5432 端口暴露到公网
   - 配置防火墙仅允许应用服务器访问数据库
   - 定期验证自动备份是否正常运行

6. **监控与告警**
   - 定期检查 `/api/health` 端点
   - 配置日志收集（可对接 ELK、Loki 等）
   - 监控磁盘空间（备份文件和日志增长）

## 许可证

MIT

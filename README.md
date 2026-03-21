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

# 初始化种子数据（分类、标签、示例案例、管理员账号）
npm run db:seed
```

### 5. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

### 初始账号

种子数据会创建以下账号：

| 角色 | 邮箱 | 密码 |
|------|------|------|
| 管理员 | admin@jiuguan.com | admin123 |
| 版主 | mod@jiuguan.com | mod123 |
| 用户 | user@jiuguan.com | user123 |

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

### 失败案例
- 结构化案例发布（背景、目标、决策、行动、预警、结果、代价、根因、建议）
- 草稿保存与继续编辑
- 提交审核 -> 发布/驳回工作流
- 匿名发布
- 案例详情页（完整展示所有字段）

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
- 关注通知
- 全部已读

### 管理后台
- 仪表盘（统计数据、趋势图）
- 案例审核（通过/驳回）
- 精选管理
- 举报处理
- 分类/标签管理（CRUD）
- 用户管理（角色分配）
- 操作日志

## 项目结构

```
src/
  app/                  # Next.js App Router 页面
    api/                # API 路由
    admin/              # 管理后台页面
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
    db.ts               # Prisma 客户端
    validations.ts      # Zod 验证 Schema
    utils.ts            # 工具函数
prisma/
  schema.prisma         # 数据库 Schema
  seed.ts               # 种子数据
```

## 生产部署

### 使用 Docker

```bash
docker-compose up -d   # 启动 PostgreSQL
npm run db:push        # 初始化数据库
npm run db:seed        # 填充种子数据
npm run build          # 构建
npm run start          # 启动
```

### 环境变量

生产环境必须修改：
- `NEXTAUTH_SECRET`: 使用 `openssl rand -base64 32` 生成强密钥
- `DATABASE_URL`: 使用生产数据库地址
- `NEXTAUTH_URL`: 设置为实际域名

## 许可证

MIT

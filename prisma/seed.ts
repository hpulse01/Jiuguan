import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const SUPER_ADMIN_EMAIL = "hpulse001@gmail.com";
const SUPER_ADMIN_PASSWORD = "123456";

async function ensureSuperAdmin() {
  console.log("🔐 初始化超级管理员...\n");

  const passwordHash = await bcrypt.hash(SUPER_ADMIN_PASSWORD, 12);

  // Step 1: 降级所有非指定邮箱的 SUPER_ADMIN
  const illegitimateSuperAdmins = await prisma.user.findMany({
    where: {
      role: "SUPER_ADMIN",
      email: { not: SUPER_ADMIN_EMAIL },
    },
  });

  for (const user of illegitimateSuperAdmins) {
    await prisma.user.update({
      where: { id: user.id },
      data: { role: "ADMIN" },
    });
    console.log(`⚠️ 已将 ${user.email} 从 SUPER_ADMIN 降级为 ADMIN`);
  }

  // Step 2: 创建或更新超级管理员
  const existingUser = await prisma.user.findUnique({
    where: { email: SUPER_ADMIN_EMAIL },
  });

  if (existingUser) {
    await prisma.user.update({
      where: { email: SUPER_ADMIN_EMAIL },
      data: {
        role: "SUPER_ADMIN",
        passwordHash,
        isBanned: false,
      },
    });

    // 确保 profile 存在
    await prisma.profile.upsert({
      where: { userId: existingUser.id },
      update: {},
      create: {
        userId: existingUser.id,
        nickname: "酒馆掌柜",
        bio: "酒馆的最高管理者，守护这个分享失败经历的社区。",
      },
    });

    console.log(`✅ 超级管理员已更新: ${SUPER_ADMIN_EMAIL}`);
  } else {
    await prisma.user.create({
      data: {
        email: SUPER_ADMIN_EMAIL,
        username: "superadmin",
        passwordHash,
        role: "SUPER_ADMIN",
        profile: {
          create: {
            nickname: "酒馆掌柜",
            bio: "酒馆的最高管理者，守护这个分享失败经历的社区。",
          },
        },
      },
    });
    console.log(`✅ 超级管理员已创建: ${SUPER_ADMIN_EMAIL}`);
  }

  // Step 3: 最终验证 - 确保只有一个 SUPER_ADMIN
  const superAdminCount = await prisma.user.count({
    where: { role: "SUPER_ADMIN" },
  });

  if (superAdminCount !== 1) {
    throw new Error(
      `超级管理员数量异常：期望 1，实际 ${superAdminCount}。请检查数据库。`
    );
  }

  const superAdmin = await prisma.user.findFirst({
    where: { role: "SUPER_ADMIN" },
  });

  if (superAdmin?.email !== SUPER_ADMIN_EMAIL) {
    throw new Error(
      `超级管理员邮箱异常：期望 ${SUPER_ADMIN_EMAIL}，实际 ${superAdmin?.email}`
    );
  }

  console.log(`✅ 超级管理员唯一性验证通过\n`);
}

async function main() {
  console.log("🍺 开始初始化酒馆数据...\n");

  // 1. 确保超级管理员存在且唯一
  await ensureSuperAdmin();

  // 2. 创建管理员用户（降级为 ADMIN）
  const adminPassword = await bcrypt.hash("admin123", 12);
  await prisma.user.upsert({
    where: { email: "admin@jiuguan.com" },
    update: { role: "ADMIN" },
    create: {
      email: "admin@jiuguan.com",
      username: "admin",
      passwordHash: adminPassword,
      role: "ADMIN",
      profile: {
        create: {
          nickname: "酒馆管理员",
          bio: "酒馆的日常管理者，负责内容审核与社区维护。",
        },
      },
    },
  });
  console.log(`✅ 管理员: admin@jiuguan.com / admin123`);

  // 3. 创建版主用户
  const modPassword = await bcrypt.hash("mod123", 12);
  await prisma.user.upsert({
    where: { email: "mod@jiuguan.com" },
    update: {},
    create: {
      email: "mod@jiuguan.com",
      username: "moderator",
      passwordHash: modPassword,
      role: "MODERATOR",
      profile: {
        create: {
          nickname: "酒馆小二",
          bio: "负责审核内容，维护社区秩序。",
        },
      },
    },
  });
  console.log(`✅ 版主: mod@jiuguan.com / mod123`);

  // 4. 创建普通测试用户
  const userPassword = await bcrypt.hash("user123", 12);
  const testUser = await prisma.user.upsert({
    where: { email: "user@jiuguan.com" },
    update: {},
    create: {
      email: "user@jiuguan.com",
      username: "testuser",
      passwordHash: userPassword,
      role: "USER",
      profile: {
        create: {
          nickname: "老酒客",
          bio: "踩过很多坑，愿意分享出来。",
        },
      },
    },
  });
  console.log(`✅ 测试用户: user@jiuguan.com / user123`);

  // 5. 创建分类
  const categories = [
    { name: "创业失败", slug: "startup", description: "创业过程中的失败经验与教训", icon: "Rocket", sortOrder: 1 },
    { name: "投资踩坑", slug: "investment", description: "投资理财中的踩坑经历", icon: "TrendingDown", sortOrder: 2 },
    { name: "职场翻车", slug: "career", description: "职场发展中的失误与反思", icon: "Briefcase", sortOrder: 3 },
    { name: "技术决策", slug: "tech", description: "技术选型与架构决策的失败案例", icon: "Code", sortOrder: 4 },
    { name: "产品设计", slug: "product", description: "产品设计方向上的失误", icon: "Lightbulb", sortOrder: 5 },
    { name: "人际关系", slug: "relationship", description: "人际交往与合作中的失败教训", icon: "Users", sortOrder: 6 },
    { name: "健康管理", slug: "health", description: "健康管理方面的忽视与教训", icon: "Heart", sortOrder: 7 },
    { name: "其他", slug: "other", description: "其他类型的失败经历", icon: "MoreHorizontal", sortOrder: 8 },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, description: cat.description, icon: cat.icon, sortOrder: cat.sortOrder },
      create: cat,
    });
  }
  console.log(`✅ 已创建 ${categories.length} 个分类`);

  // 6. 创建标签
  const tags = [
    "盲目扩张", "缺乏调研", "合伙人纠纷", "现金流断裂", "技术债务",
    "过度自信", "忽视用户反馈", "时机错误", "资源浪费", "沟通失败",
    "决策拖延", "跟风投资", "忽视风险", "团队管理", "信息不对称",
    "短视行为", "缺乏耐心", "选人失误", "目标不清", "执行力不足",
  ];

  for (const tagName of tags) {
    const slug = tagName
      .toLowerCase()
      .replace(/[^\w\u4e00-\u9fff]+/g, "-")
      .replace(/^-+|-+$/g, "");
    await prisma.tag.upsert({
      where: { slug },
      update: { name: tagName },
      create: { name: tagName, slug },
    });
  }
  console.log(`✅ 已创建 ${tags.length} 个标签`);

  // 7. 创建示例案例
  const startupCat = await prisma.category.findUnique({ where: { slug: "startup" } });
  const investCat = await prisma.category.findUnique({ where: { slug: "investment" } });
  const careerCat = await prisma.category.findUnique({ where: { slug: "career" } });

  if (startupCat && investCat && careerCat) {
    const allTags = await prisma.tag.findMany({ take: 5 });

    const sampleCases = [
      {
        slug: "first-startup-failure",
        title: "第一次创业：盲目追风口，三个月烧光50万",
        summary: "看到别人做社区团购赚钱，没有做任何调研就冲进去，三个月后血本无归。",
        background: "2021年社区团购非常火，身边有朋友做了赚到钱。我觉得这个模式简单，就拿出积蓄加上借的钱，总共50万，开始做社区团购。",
        originalGoal: "半年内覆盖本市50个社区，月流水达到100万。",
        decisionPoint: "没有做任何市场调研，没有了解竞争对手的情况，仅凭朋友的成功案例就决定入场。",
        actionsTaken: "租了仓库、买了配送车、雇了5个人，开始在小区里地推。",
        ignoredSignals: "前两周就发现获客成本远超预期，每单补贴后是亏损的，但我觉得先做量再说。",
        earliestWarning: "第一周，地推转化率不到2%，远低于朋友说的10%。",
        outcome: "三个月后，资金全部烧完，欠了10万外债，团队解散。",
        costTime: "3个月全职投入",
        costMoney: "50万积蓄 + 10万外债",
        costRelationship: "和借钱的朋友关系变差",
        costOpportunity: "错过了当时一个不错的工作机会",
        rootCause: "根本原因是盲目跟风，没有独立思考。朋友的成功有他的特殊条件（早期入场、有供应链资源），这些我都不具备。",
        whatWouldDoDifferently: "1. 先花一个月深入调研市场和竞品\n2. 先小规模验证，不要一开始就铺大\n3. 设定明确的止损线\n4. 不要用全部积蓄去冒险",
        adviceToOthers: "看到别人赚钱就想跟，这是最危险的创业动机。一定要问自己：我有什么独特的优势？如果答不上来，就不要进场。",
        categoryId: startupCat.id,
        authorId: testUser.id,
        status: "PUBLISHED" as const,
        isFeatured: true,
        publishedAt: new Date(),
      },
      {
        slug: "stock-investment-loss",
        title: "炒股亏了80%：从自信满满到怀疑人生",
        summary: "牛市入场，觉得自己是股神，结果在熊市里亏掉了大部分本金。",
        background: "2020年下半年股市行情好，看到同事在股市里赚了不少钱，我也跟着开了户。",
        originalGoal: "用20万本金，一年翻倍到40万。",
        decisionPoint: "在牛市末期重仓了几只热门股票，没有设置止损。",
        actionsTaken: "把20万全部投入股市，集中买了3只热门科技股。最初两个月确实涨了30%。",
        ignoredSignals: "市场已经出现了明显的泡沫信号，但我觉得'这次不一样'。",
        earliestWarning: "身边完全不懂股票的人也开始炒股了，这是典型的市场过热信号。",
        outcome: "2021年初市场回调，我不仅没有及时止损，还在下跌中补仓，最终亏损80%。",
        costTime: "1年多的精力投入",
        costMoney: "本金20万亏损80%，约16万",
        costRelationship: "因为投资失败情绪不好，和家人关系紧张",
        costOpportunity: "这笔钱原本计划用来读MBA",
        rootCause: "贪婪和过度自信。牛市赚钱让我产生了'我很懂投资'的错觉，实际上只是运气好。没有风控意识，没有止损纪律。",
        whatWouldDoDifferently: "1. 学习基本的投资知识再入场\n2. 分散投资，不要重仓单只股票\n3. 严格设置止损线\n4. 用闲钱投资，不要投入不能承受损失的钱",
        adviceToOthers: "牛市里人人都是股神，这是最大的陷阱。永远记住：你赚的钱可能只是运气，但亏的钱一定是你的。",
        categoryId: investCat.id,
        authorId: testUser.id,
        status: "PUBLISHED" as const,
        isFeatured: true,
        publishedAt: new Date(),
      },
      {
        slug: "career-wrong-choice",
        title: "为了高薪跳槽，结果进了一家即将倒闭的公司",
        summary: "被高薪吸引跳槽到一家创业公司，结果三个月后公司倒闭，赔了夫人又折兵。",
        background: "在上一家公司工作了3年，薪资一直没有大幅增长。收到一家创业公司的offer，薪资翻倍。",
        originalGoal: "通过跳槽实现薪资翻倍，同时获得更大的发展空间。",
        decisionPoint: "只看了薪资和title，没有深入了解公司的财务状况和业务前景。",
        actionsTaken: "裸辞跳槽，放弃了上家公司的年终奖和期权。",
        ignoredSignals: "面试时发现公司换了3轮CTO，团队流动性很大，但我觉得这是'创业公司的常态'。",
        earliestWarning: "入职第一天发现公司只有10个人，但JD上写的是'百人团队'。",
        outcome: "入职3个月后公司资金链断裂，拖欠两个月工资后正式倒闭。",
        costTime: "3个月工作经历，简历上不好解释",
        costMoney: "损失年终奖5万 + 被拖欠工资3万",
        costRelationship: "离开老公司时关系处理得不好",
        costOpportunity: "错过了老公司后来的晋升机会",
        rootCause: "被高薪蒙蔽了判断力。跳槽前没有做足够的尽职调查，对创业公司的风险认识不足。",
        whatWouldDoDifferently: "1. 跳槽前深入调查目标公司的融资情况和财务状况\n2. 和公司的离职员工聊聊\n3. 不要裸辞，先拿到offer再走\n4. 对高出市场价太多的薪资保持警惕",
        adviceToOthers: "高薪往往是高风险的信号。如果一家公司给出远超市场的薪资，要问问自己：他们为什么需要用这么高的薪资来吸引人？",
        categoryId: careerCat.id,
        authorId: testUser.id,
        status: "PUBLISHED" as const,
        publishedAt: new Date(),
      },
    ];

    for (const caseData of sampleCases) {
      const existing = await prisma.failureCase.findUnique({ where: { slug: caseData.slug } });
      if (!existing) {
        const created = await prisma.failureCase.create({ data: caseData });
        const tagsToAdd = allTags.slice(0, 3);
        for (const tag of tagsToAdd) {
          await prisma.failureCaseTag.create({
            data: { caseId: created.id, tagId: tag.id },
          });
        }
      }
    }
    console.log(`✅ 已创建 ${sampleCases.length} 个示例案例`);
  }

  console.log("\n🎉 酒馆数据初始化完成！");
  console.log("\n📋 账号信息：");
  console.log("  超级管理员: hpulse001@gmail.com / 123456");
  console.log("  管理员:     admin@jiuguan.com / admin123");
  console.log("  版主:       mod@jiuguan.com / mod123");
  console.log("  用户:       user@jiuguan.com / user123");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

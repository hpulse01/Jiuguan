import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("请输入有效的邮箱地址"),
  password: z.string().min(6, "密码至少6个字符"),
});

export const registerSchema = z.object({
  email: z.string().email("请输入有效的邮箱地址"),
  username: z.string().min(2, "用户名至少2个字符").max(20, "用户名最多20个字符").regex(/^[a-zA-Z0-9_\u4e00-\u9fff]+$/, "用户名只能包含字母、数字、下划线和中文"),
  password: z.string().min(6, "密码至少6个字符"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "两次输入的密码不一致",
  path: ["confirmPassword"],
});

export const profileSchema = z.object({
  nickname: z.string().max(30, "昵称最多30个字符").optional(),
  bio: z.string().max(200, "简介最多200个字符").optional(),
  avatar: z.string().url("请输入有效的URL").optional().or(z.literal("")),
  location: z.string().max(50).optional(),
  website: z.string().url("请输入有效的URL").optional().or(z.literal("")),
});

export const failureCaseSchema = z.object({
  title: z.string().min(5, "标题至少5个字符").max(100, "标题最多100个字符"),
  summary: z.string().min(10, "一句话总结至少10个字符").max(200, "一句话总结最多200个字符"),
  categoryId: z.string().min(1, "请选择分类"),
  tagIds: z.array(z.string()).min(1, "请至少选择一个标签").max(5, "最多选择5个标签"),
  scene: z.string().optional(),
  background: z.string().min(20, "背景描述至少20个字符"),
  originalGoal: z.string().min(10, "当时目标至少10个字符"),
  decisionPoint: z.string().min(10, "关键决策点至少10个字符"),
  actionsTaken: z.string().min(10, "请描述做了什么"),
  ignoredSignals: z.string().min(10, "请描述忽略了什么信号"),
  earliestWarning: z.string().min(10, "请描述最早出现的预警"),
  outcome: z.string().min(10, "请描述最终结果"),
  costTime: z.string().optional(),
  costMoney: z.string().optional(),
  costRelationship: z.string().optional(),
  costOpportunity: z.string().optional(),
  rootCause: z.string().min(10, "根因分析至少10个字符"),
  whatWouldDoDifferently: z.string().min(10, "请描述如果重来会怎么做"),
  adviceToOthers: z.string().min(10, "请给后来者一些建议"),
  isAnonymous: z.boolean().default(false),
  coverImage: z.string().optional(),
});

export const draftCaseSchema = failureCaseSchema.partial().extend({
  title: z.string().min(1, "标题不能为空"),
});

export const commentSchema = z.object({
  content: z.string().min(2, "评论至少2个字符").max(2000, "评论最多2000个字符"),
  commentType: z.enum(["QUESTION", "SUPPLEMENT", "DISAGREEMENT", "ALTERNATIVE"]).default("QUESTION"),
  isAnonymous: z.boolean().default(false),
  parentId: z.string().optional(),
});

export const reportSchema = z.object({
  reason: z.string().min(1, "请选择举报原因"),
  detail: z.string().max(500, "详细说明最多500个字符").optional(),
});

export const searchSchema = z.object({
  q: z.string().optional(),
  categoryId: z.string().optional(),
  tagIds: z.array(z.string()).optional(),
  sort: z.enum(["latest", "hot", "useful", "resonance"]).default("latest"),
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(50).default(12),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
export type FailureCaseInput = z.infer<typeof failureCaseSchema>;
export type DraftCaseInput = z.infer<typeof draftCaseSchema>;
export type CommentInput = z.infer<typeof commentSchema>;
export type ReportInput = z.infer<typeof reportSchema>;
export type SearchInput = z.infer<typeof searchSchema>;

/**
 * 安全的数据库查询辅助常量
 * 防止敏感字段（passwordHash, email等）泄露到API响应
 */

/** 安全的 author select - 不包含 passwordHash、email 等敏感字段 */
export const safeAuthorSelect = {
  id: true,
  username: true,
  role: true,
  profile: {
    select: {
      nickname: true,
      avatar: true,
      bio: true,
    },
  },
} as const;

/** 安全的 author include（用于需要 include 语法的场景） */
export const safeAuthorInclude = {
  author: {
    select: safeAuthorSelect,
  },
} as const;

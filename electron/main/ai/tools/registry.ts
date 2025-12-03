/**
 * 工具注册
 * 在这里注册所有可用的 AI 工具
 */

import { registerTool } from './index'
import type { ToolDefinition } from '../llm/types'
import type { ToolContext } from './types'
import * as workerManager from '../../worker/workerManager'

// ==================== 工具定义 ====================

/**
 * 搜索消息工具
 * 根据关键词搜索群聊记录
 */
const searchMessagesTool: ToolDefinition = {
  type: 'function',
  function: {
    name: 'search_messages',
    description: '根据关键词搜索群聊记录。适用于用户想要查找特定话题、关键词相关的聊天内容。可以指定时间范围来筛选特定时间段的消息。',
    parameters: {
      type: 'object',
      properties: {
        keywords: {
          type: 'array',
          description: '搜索关键词列表，会用 OR 逻辑匹配包含任一关键词的消息',
          items: { type: 'string' },
        },
        limit: {
          type: 'number',
          description: '返回消息数量限制，默认 200，最大 5000',
        },
        year: {
          type: 'number',
          description: '筛选指定年份的消息，如 2024',
        },
        month: {
          type: 'number',
          description: '筛选指定月份的消息（1-12），需要配合 year 使用',
        },
      },
      required: ['keywords'],
    },
  },
}

async function searchMessagesExecutor(
  params: { keywords: string[]; limit?: number; year?: number; month?: number },
  context: ToolContext
): Promise<unknown> {
  const { sessionId, timeFilter: contextTimeFilter } = context
  // 默认 200，上限 5000
  const limit = Math.min(params.limit || 200, 5000)

  // 构建时间过滤器：优先使用 LLM 指定的年/月，否则使用 context 中的
  let effectiveTimeFilter = contextTimeFilter
  if (params.year) {
    const year = params.year
    const month = params.month // 可能为 undefined

    let startDate: Date
    let endDate: Date

    if (month) {
      // 指定了年月
      startDate = new Date(year, month - 1, 1) // 月份从 0 开始
      endDate = new Date(year, month, 0, 23, 59, 59) // 下个月的第 0 天 = 当月最后一天
    } else {
      // 只指定了年
      startDate = new Date(year, 0, 1)
      endDate = new Date(year, 11, 31, 23, 59, 59)
    }

    effectiveTimeFilter = {
      startTs: Math.floor(startDate.getTime() / 1000),
      endTs: Math.floor(endDate.getTime() / 1000),
    }
  }

  const result = await workerManager.searchMessages(
    sessionId,
    params.keywords,
    effectiveTimeFilter,
    limit,
    0
  )

  // 格式化为 LLM 易于理解的格式
  return {
    total: result.total,
    returned: result.messages.length,
    timeRange: effectiveTimeFilter
      ? {
          start: new Date(effectiveTimeFilter.startTs * 1000).toLocaleDateString('zh-CN'),
          end: new Date(effectiveTimeFilter.endTs * 1000).toLocaleDateString('zh-CN'),
        }
      : '全部时间',
    messages: result.messages.map((m) => ({
      sender: m.senderName,
      content: m.content,
      time: new Date(m.timestamp * 1000).toLocaleString('zh-CN'),
    })),
  }
}

/**
 * 获取最近消息工具
 * 获取最近的群聊消息，用于回答概览性问题
 */
const getRecentMessagesTool: ToolDefinition = {
  type: 'function',
  function: {
    name: 'get_recent_messages',
    description: '获取指定时间段内的群聊消息。适用于回答"最近大家聊了什么"、"X月群里聊了什么"等概览性问题。可以指定年/月来筛选特定时间段。',
    parameters: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: '返回消息数量限制，默认 100',
        },
        year: {
          type: 'number',
          description: '筛选指定年份的消息，如 2024',
        },
        month: {
          type: 'number',
          description: '筛选指定月份的消息（1-12），需要配合 year 使用',
        },
      },
    },
  },
}

async function getRecentMessagesExecutor(
  params: { limit?: number; year?: number; month?: number },
  context: ToolContext
): Promise<unknown> {
  const { sessionId, timeFilter: contextTimeFilter } = context
  const limit = params.limit || 100

  // 构建时间过滤器：优先使用 LLM 指定的年/月
  let effectiveTimeFilter = contextTimeFilter
  if (params.year) {
    const year = params.year
    const month = params.month

    let startDate: Date
    let endDate: Date

    if (month) {
      startDate = new Date(year, month - 1, 1)
      endDate = new Date(year, month, 0, 23, 59, 59)
    } else {
      startDate = new Date(year, 0, 1)
      endDate = new Date(year, 11, 31, 23, 59, 59)
    }

    effectiveTimeFilter = {
      startTs: Math.floor(startDate.getTime() / 1000),
      endTs: Math.floor(endDate.getTime() / 1000),
    }
  }

  const result = await workerManager.getRecentMessages(sessionId, effectiveTimeFilter, limit)

  return {
    total: result.total,
    returned: result.messages.length,
    timeRange: effectiveTimeFilter
      ? {
          start: new Date(effectiveTimeFilter.startTs * 1000).toLocaleDateString('zh-CN'),
          end: new Date(effectiveTimeFilter.endTs * 1000).toLocaleDateString('zh-CN'),
        }
      : '全部时间',
    messages: result.messages.map((m) => ({
      sender: m.senderName,
      content: m.content,
      time: new Date(m.timestamp * 1000).toLocaleString('zh-CN'),
    })),
  }
}

/**
 * 获取成员活跃度统计工具
 */
const getMemberStatsTool: ToolDefinition = {
  type: 'function',
  function: {
    name: 'get_member_stats',
    description: '获取群成员的活跃度统计数据。适用于回答"谁最活跃"、"发言最多的是谁"等问题。',
    parameters: {
      type: 'object',
      properties: {
        top_n: {
          type: 'number',
          description: '返回前 N 名成员，默认 10',
        },
      },
    },
  },
}

async function getMemberStatsExecutor(
  params: { top_n?: number },
  context: ToolContext
): Promise<unknown> {
  const { sessionId, timeFilter } = context
  const topN = params.top_n || 10

  const result = await workerManager.getMemberActivity(sessionId, timeFilter)

  // 只返回前 N 名
  const topMembers = result.slice(0, topN)

  return {
    totalMembers: result.length,
    topMembers: topMembers.map((m, index) => ({
      rank: index + 1,
      name: m.name,
      messageCount: m.messageCount,
      percentage: `${m.percentage}%`,
    })),
  }
}

/**
 * 获取时间分布统计工具
 */
const getTimeStatsTool: ToolDefinition = {
  type: 'function',
  function: {
    name: 'get_time_stats',
    description: '获取群聊的时间分布统计。适用于回答"什么时候最活跃"、"大家一般几点聊天"等问题。',
    parameters: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          description: '统计类型：hourly（按小时）、weekday（按星期）、daily（按日期）',
          enum: ['hourly', 'weekday', 'daily'],
        },
      },
      required: ['type'],
    },
  },
}

async function getTimeStatsExecutor(
  params: { type: 'hourly' | 'weekday' | 'daily' },
  context: ToolContext
): Promise<unknown> {
  const { sessionId, timeFilter } = context

  switch (params.type) {
    case 'hourly': {
      const result = await workerManager.getHourlyActivity(sessionId, timeFilter)
      const peak = result.reduce((max, curr) =>
        curr.messageCount > max.messageCount ? curr : max
      )
      return {
        distribution: result.map((h) => ({
          hour: `${h.hour}:00`,
          count: h.messageCount,
        })),
        peakHour: `${peak.hour}:00`,
        peakCount: peak.messageCount,
      }
    }
    case 'weekday': {
      const weekdayNames = ['', '周一', '周二', '周三', '周四', '周五', '周六', '周日']
      const result = await workerManager.getWeekdayActivity(sessionId, timeFilter)
      const peak = result.reduce((max, curr) =>
        curr.messageCount > max.messageCount ? curr : max
      )
      return {
        distribution: result.map((w) => ({
          weekday: weekdayNames[w.weekday],
          count: w.messageCount,
        })),
        peakDay: weekdayNames[peak.weekday],
        peakCount: peak.messageCount,
      }
    }
    case 'daily': {
      const result = await workerManager.getDailyActivity(sessionId, timeFilter)
      // 只返回最近 30 天
      const recent = result.slice(-30)
      const total = recent.reduce((sum, d) => sum + d.messageCount, 0)
      const avg = Math.round(total / recent.length)
      return {
        recentDays: recent.length,
        totalMessages: total,
        averagePerDay: avg,
        trend: recent.map((d) => ({
          date: d.date,
          count: d.messageCount,
        })),
      }
    }
  }
}

// ==================== 注册工具 ====================

registerTool(searchMessagesTool, searchMessagesExecutor)
registerTool(getRecentMessagesTool, getRecentMessagesExecutor)
registerTool(getMemberStatsTool, getMemberStatsExecutor)
registerTool(getTimeStatsTool, getTimeStatsExecutor)


import { ToolCall } from '../types/chat'

/**
 * 工具结果文本格式化和截断工具
 * 参考TUI中的text_formatting.rs实现
 */

/**
 * 格式化JSON为紧凑单行格式，在保持可读性的同时节省空间
 * 示例: {"a":"b",c:["d","e"]} -> {"a": "b", "c": ["d", "e"]}
 */
export function formatJsonCompact(text: string): string | null {
  try {
    const json = JSON.parse(text)
    const prettyJson = JSON.stringify(json, null, 2)
    
    // 将多行JSON转换为紧凑单行格式
    let result = ''
    let inString = false
    let escapeNext = false
    
    for (let i = 0; i < prettyJson.length; i++) {
      const ch = prettyJson[i]
      const nextCh = prettyJson[i + 1]
      const lastCh = result[result.length - 1]
      
      switch (ch) {
        case '"':
          if (!escapeNext) {
            inString = !inString
          }
          result += ch
          break
          
        case '\\':
          if (inString) {
            escapeNext = !escapeNext
          }
          result += ch
          break
          
        case '\n':
        case '\r':
          if (!inString) {
            // 跳过字符串外的换行符
            continue
          }
          result += ch
          break
          
        case ' ':
        case '\t':
          if (!inString) {
            // 在 : 和 , 后添加空格，但不在字符串内
            if ((lastCh === ':' || lastCh === ',') && 
                nextCh && nextCh !== '}' && nextCh !== ']') {
              result += ' '
            }
          } else {
            result += ch
          }
          break
          
        default:
          if (escapeNext && inString) {
            escapeNext = false
          }
          result += ch
          break
      }
    }
    
    return result
  } catch {
    return null
  }
}

/**
 * 截断文本到指定的最大字符数
 * 使用Unicode安全的截断方式
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text
  }
  
  if (maxLength < 3) {
    return text.substring(0, maxLength)
  }
  
  return text.substring(0, maxLength - 3) + '...'
}

/**
 * 格式化和截断工具结果以适应给定的显示限制
 * 如果文本是有效的JSON，会先格式化为紧凑格式再截断
 */
export function formatAndTruncateToolResult(
  text: string,
  maxLines: number = 5,
  lineWidth: number = 80
): string {
  // 计算最大字符数 (每行减1作为换行符的缓冲)
  const maxChars = (maxLines * lineWidth) - maxLines
  
  // 如果是JSON，先格式化
  const formattedJson = formatJsonCompact(text)
  const textToTruncate = formattedJson || text
  
  return truncateText(textToTruncate, maxChars)
}

/**
 * 检测工具调用结果的类型
 */
export function detectToolResultType(result: any): 'text' | 'json' | 'image' | 'url' | 'file' | 'binary' {
  if (typeof result === 'string') {
    // URL检测
    if (result.match(/^https?:\/\//i)) {
      return 'url'
    }
    
    // 图片数据检测
    if (result.startsWith('data:image/')) {
      return 'image'
    }
    
    // JSON字符串检测
    if (formatJsonCompact(result) !== null) {
      return 'json'
    }
    
    return 'text'
  }
  
  if (typeof result === 'object' && result !== null) {
    return 'json'
  }
  
  return 'text'
}

/**
 * 判断工具调用是否为探索类型（文件读取、搜索等）
 * 参考TUI中的is_exploring_call逻辑
 */
export function isExploringToolCall(toolCall: ToolCall): boolean {
  const exploringTools = [
    'read_file',
    'list_files', 
    'search_files',
    'grep',
    'find',
    'cat',
    'ls',
    'dir'
  ]
  
  return exploringTools.some(tool => 
    toolCall.name.toLowerCase().includes(tool.toLowerCase())
  )
}

/**
 * 检查多个工具调用是否可以合并显示
 * 如果都是探索类型的工具调用，可以合并展示
 */
export function canCoalesceToolCalls(toolCalls: ToolCall[]): boolean {
  return toolCalls.length > 1 && toolCalls.every(isExploringToolCall)
}

/**
 * 为工具调用生成显示文本
 * 参考TUI中format_mcp_invocation的逻辑
 */
export function formatToolInvocation(toolCall: ToolCall): string {
  const argsStr = Object.keys(toolCall.arguments).length > 0
    ? JSON.stringify(toolCall.arguments)
    : ''
  
  return `${toolCall.name}(${argsStr})`
}

/**
 * 格式化工具执行时间
 */
export function formatDuration(startTime: number, endTime?: number): string {
  const duration = endTime ? endTime - startTime : Date.now() - startTime
  
  if (duration < 1000) {
    return `${duration}ms`
  } else if (duration < 60000) {
    return `${(duration / 1000).toFixed(1)}s`
  } else {
    const minutes = Math.floor(duration / 60000)
    const seconds = Math.floor((duration % 60000) / 1000)
    return `${minutes}m ${seconds}s`
  }
}

/**
 * 根据工具调用状态获取显示样式
 */
export function getToolCallStatusStyle(status: string) {
  switch (status) {
    case 'pending':
      return {
        icon: '⏳',
        color: 'text-gray-500',
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-200'
      }
    case 'running':
      return {
        icon: '⚡',
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200'
      }
    case 'success':
      return {
        icon: '✅',
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200'
      }
    case 'error':
      return {
        icon: '❌',
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200'
      }
    default:
      return {
        icon: '❓',
        color: 'text-gray-500',
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-200'
      }
  }
}
/**
 * 事件分类和管理类型定义
 */

import { EventMsg } from './protocol/EventMsg'
import { ConversationEvent } from './chat'

// 里程碑事件类型 - 在主视图中显示的重要事件
export const MILESTONE_EVENT_TYPES = [
  'user_message',
  'agent_message', 
  'task_complete',
  'task_started',
  'mcp_tool_call_begin',
  'mcp_tool_call_end',
  'web_search_begin',
  'web_search_end',
  'exec_command_begin',
  'exec_command_end',
  'exec_approval_request',
  'apply_patch_approval_request',
  'error',
  'session_configured'
] as const

// 增量事件类型 - 实时更新但通常不单独显示的事件
export const INCREMENTAL_EVENT_TYPES = [
  'agent_message_delta',
  'agent_reasoning_delta',
  'agent_reasoning_raw_content_delta',
  'exec_command_output_delta'
] as const

// 推理相关事件类型 - 可选显示的详细事件
export const REASONING_EVENT_TYPES = [
  'agent_reasoning',
  'agent_reasoning_raw_content',
  'agent_reasoning_section_break'
] as const

export type MilestoneEventType = typeof MILESTONE_EVENT_TYPES[number]
export type IncrementalEventType = typeof INCREMENTAL_EVENT_TYPES[number]
export type ReasoningEventType = typeof REASONING_EVENT_TYPES[number]

/**
 * 成对事件定义 - 生命周期事件
 */
export const PAIRED_EVENT_TYPES = [
  {
    begin: 'exec_command_begin',
    end: 'exec_command_end',
    name: '命令执行',
    outputDelta: 'exec_command_output_delta'
  },
  {
    begin: 'mcp_tool_call_begin',
    end: 'mcp_tool_call_end', 
    name: 'MCP工具调用'
  },
  {
    begin: 'web_search_begin',
    end: 'web_search_end',
    name: 'Web搜索'
  },
  {
    begin: 'patch_apply_begin',
    end: 'patch_apply_end',
    name: '补丁应用'
  }
] as const

export type PairedEventType = typeof PAIRED_EVENT_TYPES[number]

/**
 * 事件分类枚举
 */
export enum EventCategory {
  MILESTONE = 'milestone',      // 里程碑事件
  INCREMENTAL = 'incremental',  // 增量事件
  REASONING = 'reasoning',      // 推理事件
  LIFECYCLE = 'lifecycle',     // 生命周期事件（成对）
  OTHER = 'other'              // 其他事件
}

/**
 * 分层事件结构 - 将相关事件组织在一起
 */
export interface EventLayer {
  /** 主要的里程碑事件 */
  milestone: ConversationEvent
  /** 相关的增量/详细事件 */
  relatedEvents: ConversationEvent[]
  /** 是否展开显示详细事件 */
  isExpanded: boolean
  /** 事件分类 */
  category: EventCategory
  /** 合并的增量数据（如果适用） */
  aggregatedData?: {
    totalUpdates: number
    lastUpdateTime: number
    combinedContent?: string
  }
  /** 生命周期事件数据（如果适用） */
  lifecycleData?: {
    beginEvent: ConversationEvent
    endEvent?: ConversationEvent
    pairType: PairedEventType
    status: 'running' | 'completed' | 'error'
    duration?: number
    outputContent?: string
  }
}

/**
 * 事件合并配置
 */
export interface EventMergeConfig {
  /** 是否启用增量事件合并 */
  enableIncrementalMerging: boolean
  /** 合并时间窗口（毫秒） */
  mergeTimeWindow: number
  /** 最大合并事件数量 */
  maxMergeCount: number
  /** 是否在合并时保留原始事件 */
  preserveOriginalEvents: boolean
}

/**
 * 默认事件合并配置
 */
export const DEFAULT_EVENT_MERGE_CONFIG: EventMergeConfig = {
  enableIncrementalMerging: true,
  mergeTimeWindow: 1000, // 1秒
  maxMergeCount: 100,
  preserveOriginalEvents: false
}

/**
 * 判断事件类型的工具函数
 */
export const EventClassifier = {
  isMilestone: (eventType: string): eventType is MilestoneEventType => {
    return MILESTONE_EVENT_TYPES.includes(eventType as MilestoneEventType)
  },
  
  isIncremental: (eventType: string): eventType is IncrementalEventType => {
    return INCREMENTAL_EVENT_TYPES.includes(eventType as IncrementalEventType)
  },
  
  isReasoning: (eventType: string): eventType is ReasoningEventType => {
    return REASONING_EVENT_TYPES.includes(eventType as ReasoningEventType)
  },

  isLifecycleBegin: (eventType: string): boolean => {
    return PAIRED_EVENT_TYPES.some(pair => pair.begin === eventType)
  },

  isLifecycleEnd: (eventType: string): boolean => {
    return PAIRED_EVENT_TYPES.some(pair => pair.end === eventType)
  },

  findPairedEventType: (eventType: string): PairedEventType | null => {
    return PAIRED_EVENT_TYPES.find(pair => 
      pair.begin === eventType || pair.end === eventType
    ) || null
  },

  getLifecyclePartner: (eventType: string): string | null => {
    const pairedType = EventClassifier.findPairedEventType(eventType)
    if (!pairedType) return null
    
    if (pairedType.begin === eventType) {
      return pairedType.end
    } else if (pairedType.end === eventType) {
      return pairedType.begin
    }
    return null
  },
  
  getCategory: (eventType: string): EventCategory => {
    if (EventClassifier.isLifecycleBegin(eventType) || EventClassifier.isLifecycleEnd(eventType)) {
      return EventCategory.LIFECYCLE
    }
    if (EventClassifier.isMilestone(eventType)) {
      return EventCategory.MILESTONE
    }
    if (EventClassifier.isIncremental(eventType)) {
      return EventCategory.INCREMENTAL
    }
    if (EventClassifier.isReasoning(eventType)) {
      return EventCategory.REASONING
    }
    return EventCategory.OTHER
  },
  
  /**
   * 判断两个事件是否可以合并
   */
  canMerge: (event1: EventMsg, event2: EventMsg): boolean => {
    // 只有相同类型的增量事件才能合并
    if (event1.type !== event2.type) return false
    if (!EventClassifier.isIncremental(event1.type)) return false
    
    return true
  },
  
  /**
   * 判断事件是否应该聚合到指定的里程碑事件下
   */
  shouldAggregateUnder: (incrementalEvent: EventMsg, milestoneEvent: EventMsg): boolean => {
    switch (incrementalEvent.type) {
      case 'agent_message_delta':
        return milestoneEvent.type === 'agent_message'
      
      case 'agent_reasoning_delta':
        return milestoneEvent.type === 'agent_reasoning'
      
      case 'agent_reasoning_raw_content_delta':
        return milestoneEvent.type === 'agent_reasoning_raw_content'
      
      case 'exec_command_output_delta':
        return milestoneEvent.type === 'exec_command_begin'
      
      default:
        return false
    }
  }
}

/**
 * 事件聚合器 - 将相关事件组织成层级结构
 */
export class EventAggregator {
  private config: EventMergeConfig
  
  constructor(config: EventMergeConfig = DEFAULT_EVENT_MERGE_CONFIG) {
    this.config = config
  }
  
  /**
   * 将事件列表聚合成分层结构
   */
  aggregateEvents(events: ConversationEvent[]): EventLayer[] {
    const layers: EventLayer[] = []
    const lifecycleTracker = new Map<string, EventLayer>() // 按call_id追踪生命周期事件
    
    for (const event of events) {
      const category = EventClassifier.getCategory(event.event.type)
      
      if (category === EventCategory.LIFECYCLE) {
        this.handleLifecycleEvent(layers, event, lifecycleTracker)
      } else if (category === EventCategory.MILESTONE) {
        // 创建新的里程碑层
        layers.push({
          milestone: event,
          relatedEvents: [],
          isExpanded: false,
          category,
          aggregatedData: {
            totalUpdates: 1,
            lastUpdateTime: event.timestamp
          }
        })
      } else if (category === EventCategory.INCREMENTAL) {
        // 尝试聚合到最近的相关里程碑事件下（包括生命周期事件）
        const targetLayer = this.findTargetLayer(layers, event)
        
        if (targetLayer && this.config.enableIncrementalMerging) {
          targetLayer.relatedEvents.push(event)
          this.updateAggregatedData(targetLayer, event)
          
          // 如果是输出增量，更新生命周期数据
          if (targetLayer.lifecycleData && event.event.type === 'exec_command_output_delta') {
            const delta = (event.event as any).delta || ''
            targetLayer.lifecycleData.outputContent = 
              (targetLayer.lifecycleData.outputContent || '') + delta
          }
        } else {
          // 如果找不到合适的里程碑事件，创建虚拟里程碑
          this.createVirtualMilestone(layers, event)
        }
      } else {
        // 推理事件和其他事件的处理
        const lastLayer = layers[layers.length - 1]
        if (lastLayer) {
          lastLayer.relatedEvents.push(event)
          this.updateAggregatedData(lastLayer, event)
        } else {
          // 创建独立层
          layers.push({
            milestone: event,
            relatedEvents: [],
            isExpanded: false,
            category,
            aggregatedData: {
              totalUpdates: 1,
              lastUpdateTime: event.timestamp
            }
          })
        }
      }
    }
    
    return layers
  }

  /**
   * 处理生命周期事件（成对事件）
   */
  private handleLifecycleEvent(
    layers: EventLayer[], 
    event: ConversationEvent, 
    lifecycleTracker: Map<string, EventLayer>
  ): void {
    const callId = (event.event as any).call_id
    const pairedType = EventClassifier.findPairedEventType(event.event.type)
    
    if (!callId || !pairedType) {
      // 如果没有call_id或不是已知的成对事件，作为普通里程碑事件处理
      layers.push({
        milestone: event,
        relatedEvents: [],
        isExpanded: false,
        category: EventCategory.MILESTONE,
        aggregatedData: {
          totalUpdates: 1,
          lastUpdateTime: event.timestamp
        }
      })
      return
    }

    if (EventClassifier.isLifecycleBegin(event.event.type)) {
      // 开始事件 - 创建新的生命周期层
      const layer: EventLayer = {
        milestone: event,
        relatedEvents: [],
        isExpanded: false,
        category: EventCategory.LIFECYCLE,
        aggregatedData: {
          totalUpdates: 1,
          lastUpdateTime: event.timestamp
        },
        lifecycleData: {
          beginEvent: event,
          pairType: pairedType,
          status: 'running'
        }
      }
      
      layers.push(layer)
      lifecycleTracker.set(callId, layer)
      
    } else if (EventClassifier.isLifecycleEnd(event.event.type)) {
      // 结束事件 - 更新对应的生命周期层
      const existingLayer = lifecycleTracker.get(callId)
      
      if (existingLayer && existingLayer.lifecycleData) {
        // 更新现有层的状态
        existingLayer.lifecycleData.endEvent = event
        existingLayer.lifecycleData.status = event.status === 'error' ? 'error' : 'completed'
        existingLayer.lifecycleData.duration = event.timestamp - existingLayer.lifecycleData.beginEvent.timestamp
        
        // 更新层的聚合数据
        existingLayer.aggregatedData!.totalUpdates += 1
        existingLayer.aggregatedData!.lastUpdateTime = event.timestamp
        
        // 清理追踪器
        lifecycleTracker.delete(callId)
      } else {
        // 找不到对应的开始事件，作为独立事件处理
        layers.push({
          milestone: event,
          relatedEvents: [],
          isExpanded: false,
          category: EventCategory.MILESTONE,
          aggregatedData: {
            totalUpdates: 1,
            lastUpdateTime: event.timestamp
          }
        })
      }
    }
  }
  
  private findTargetLayer(layers: EventLayer[], incrementalEvent: ConversationEvent): EventLayer | null {
    // 从后往前查找最近的相关里程碑事件
    for (let i = layers.length - 1; i >= 0; i--) {
      const layer = layers[i]
      if (EventClassifier.shouldAggregateUnder(incrementalEvent.event, layer.milestone.event)) {
        return layer
      }
    }
    return null
  }
  
  private createVirtualMilestone(layers: EventLayer[], incrementalEvent: ConversationEvent): void {
    // 为孤立的增量事件创建虚拟里程碑
    const virtualMilestone: ConversationEvent = {
      ...incrementalEvent,
      event: {
        type: this.getVirtualMilestoneType(incrementalEvent.event.type),
        message: this.getVirtualMilestoneMessage(incrementalEvent.event.type)
      } as any,
      status: 'processing'
    }
    
    layers.push({
      milestone: virtualMilestone,
      relatedEvents: [incrementalEvent],
      isExpanded: false,
      category: EventCategory.MILESTONE,
      aggregatedData: {
        totalUpdates: 1,
        lastUpdateTime: incrementalEvent.timestamp
      }
    })
  }
  
  private getVirtualMilestoneType(incrementalType: string): string {
    switch (incrementalType) {
      case 'agent_message_delta': return 'agent_message'
      case 'agent_reasoning_delta': return 'agent_reasoning'
      case 'agent_reasoning_raw_content_delta': return 'agent_reasoning_raw_content'
      case 'exec_command_output_delta': return 'exec_command_begin'
      default: return 'task_started'
    }
  }
  
  private getVirtualMilestoneMessage(incrementalType: string): string {
    switch (incrementalType) {
      case 'agent_message_delta': return '智能助手正在回复...'
      case 'agent_reasoning_delta': return '智能助手正在推理...'
      case 'agent_reasoning_raw_content_delta': return '正在处理推理内容...'
      case 'exec_command_output_delta': return '命令正在执行...'
      default: return '正在处理...'
    }
  }
  
  private updateAggregatedData(layer: EventLayer, event: ConversationEvent): void {
    if (!layer.aggregatedData) {
      layer.aggregatedData = {
        totalUpdates: 0,
        lastUpdateTime: event.timestamp
      }
    }
    
    layer.aggregatedData.totalUpdates += 1
    layer.aggregatedData.lastUpdateTime = Math.max(
      layer.aggregatedData.lastUpdateTime, 
      event.timestamp
    )
    
    // 如果是文本增量事件，合并内容
    if (event.event.type === 'agent_message_delta' && 'delta' in event.event) {
      const delta = (event.event as any).delta
      layer.aggregatedData.combinedContent = 
        (layer.aggregatedData.combinedContent || '') + delta
    }
  }
}
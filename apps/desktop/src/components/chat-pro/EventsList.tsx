import { memo, useCallback, useMemo, useState } from "react";
import { Badge } from "../ui/badge";
import { cn } from "../../lib/utils";
import { EventMsgRenderer } from "../events";
import { EventMsg } from "../../types/protocol/EventMsg";
import { EventLayer, EventCategory } from "../../types/events";
import {
  Circle,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  ChevronDown,
  ChevronRight,
  Package,
  Activity,
} from "lucide-react";

interface ChatProEvent {
  id: string;
  event: EventMsg;
  timestamp: Date;
  status?: "pending" | "processing" | "completed" | "error";
}

interface EventsListProps {
  /** 事件列表 */
  events: ChatProEvent[];
  /** 分层事件列表 - 优先使用此属性 */
  eventLayers?: EventLayer[];
  /** 当前选中的事件ID */
  selectedEventId?: string | null;
  /** 是否正在处理中 */
  isProcessing?: boolean;
  /** 自定义样式类名 */
  className?: string;
  /** 事件选择回调 */
  onEventSelect?: (eventId: string) => void;
  /** 当前对话ID */
  conversationId?: string;
  /** 是否启用分层显示 */
  enableLayeredView?: boolean;
}

/**
 * 事件列表组件 - 使用 EventMsgRenderer 渲染事件
 *
 * 特性:
 * - 使用 EventMsgRenderer 统一渲染所有事件类型
 * - 支持事件选择和状态指示
 * - 自动滚动到最新事件
 * - 性能优化的虚拟滚动支持
 * - 符合 ag-ui 设计规范
 */
export const EventsList = memo(function EventsList({
  events,
  eventLayers,
  selectedEventId,
  isProcessing = false,
  className,
  onEventSelect: _onEventSelect,
  conversationId,
  enableLayeredView = true,
}: EventsListProps) {
  // 层级展开状态管理
  const [expandedLayers, setExpandedLayers] = useState<Set<string>>(new Set());
  
  // 切换层级展开状态
  const toggleLayerExpanded = useCallback((layerId: string) => {
    setExpandedLayers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(layerId)) {
        newSet.delete(layerId);
      } else {
        newSet.add(layerId);
      }
      return newSet;
    });
  }, []);
  
  // 获取状态指示器
  const getStatusIndicator = useCallback((status?: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case "error":
        return <XCircle className="w-4 h-4 text-red-600" />;
      case "processing":
        return <Zap className="w-4 h-4 text-blue-600 animate-pulse" />;
      case "pending":
      default:
        return <Circle className="w-4 h-4 text-muted-foreground" />;
    }
  }, []);

  // 获取状态颜色类名
  const getStatusColorClass = useCallback((status?: string) => {
    switch (status) {
      case "completed":
        return "border-l-green-500 bg-green-50/30";
      case "error":
        return "border-l-red-500 bg-red-50/30";
      case "processing":
        return "border-l-blue-500 bg-blue-50/30";
      case "pending":
      default:
        return "border-l-muted-foreground/30 bg-muted/10";
    }
  }, []);

  // 获取分类图标
  const getCategoryIcon = useCallback((category: EventCategory, layer?: EventLayer) => {
    switch (category) {
      case EventCategory.MILESTONE:
        return <Package className="w-4 h-4" />;
      case EventCategory.INCREMENTAL:
        return <Activity className="w-4 h-4" />;
      case EventCategory.REASONING:
        return <Zap className="w-4 h-4" />;
      case EventCategory.LIFECYCLE:
        // 根据生命周期状态显示不同图标
        if (layer?.lifecycleData?.status === 'running') {
          return <Activity className="w-4 h-4 animate-pulse" />;
        } else if (layer?.lifecycleData?.status === 'error') {
          return <XCircle className="w-4 h-4" />;
        } else {
          return <CheckCircle2 className="w-4 h-4" />;
        }
      default:
        return <Circle className="w-4 h-4" />;
    }
  }, []);

  // 获取聚合信息显示
  const getAggregatedInfo = useCallback((layer: EventLayer) => {
    const badges: React.ReactNode[] = [];
    
    // 普通聚合信息
    if (layer.aggregatedData && layer.aggregatedData.totalUpdates > 1) {
      const { totalUpdates, combinedContent } = layer.aggregatedData;
      badges.push(
        <Badge key="updates" variant="outline" className="ml-2 text-xs">
          {totalUpdates} 次更新
          {combinedContent && ` · ${combinedContent.length} 字符`}
        </Badge>
      );
    }
    
    // 生命周期信息
    if (layer.lifecycleData) {
      const { status, duration, outputContent } = layer.lifecycleData;
      
      // 状态徽章
      const statusVariant = status === 'error' ? 'destructive' : 
                           status === 'completed' ? 'default' : 'secondary';
      const statusText = status === 'running' ? '进行中' :
                        status === 'error' ? '失败' : '完成';
      
      badges.push(
        <Badge key="status" variant={statusVariant} className="ml-2 text-xs">
          {statusText}
        </Badge>
      );
      
      // 持续时间
      if (duration && duration > 0) {
        const durationText = duration < 1000 ? `${duration}ms` : `${(duration/1000).toFixed(1)}s`;
        badges.push(
          <Badge key="duration" variant="outline" className="ml-2 text-xs">
            {durationText}
          </Badge>
        );
      }
      
      // 输出内容长度
      if (outputContent && outputContent.length > 0) {
        badges.push(
          <Badge key="output" variant="outline" className="ml-2 text-xs">
            {outputContent.length} 字符输出
          </Badge>
        );
      }
    }
    
    return badges.length > 0 ? <>{badges}</> : null;
  }, []);

  // 决定使用哪种渲染模式
  const useLayeredView = enableLayeredView && eventLayers && eventLayers.length > 0;
  
  // 分组事件（按类型或时间） - 兼容旧模式
  const groupedEvents = useMemo(() => {
    if (useLayeredView) return [];
    return events.map((event, index) => ({
      ...event,
      index,
      isLast: index === events.length - 1,
    }));
  }, [events, useLayeredView]);

  // 检查是否有事件显示
  const hasEvents = useLayeredView ? eventLayers!.length > 0 : events.length > 0;

  if (!hasEvents) {
    return (
      <div className={cn("text-center py-8", className)}>
        <div className="text-muted-foreground">暂无事件</div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {useLayeredView ? (
        // 分层显示模式
        eventLayers!.map((layer, layerIndex) => {
          const layerId = layer.milestone.id;
          
          // 为审批事件确保key的唯一性
          const isApprovalEvent = layer.milestone.event.type === 'exec_approval_request' || 
                                 layer.milestone.event.type === 'apply_patch_approval_request';
          const stableKey = isApprovalEvent 
            ? `${layer.milestone.event.type}-${layerId}-${layer.milestone.timestamp}` 
            : layerId;
          
          const isLayerExpanded = expandedLayers.has(layerId);
          const isSelected = selectedEventId === layerId;
          const statusColorClass = getStatusColorClass(layer.milestone.status);
          const hasRelatedEvents = layer.relatedEvents.length > 0;
          const isLastLayer = layerIndex === eventLayers!.length - 1;

          return (
            <div key={stableKey} className="space-y-2">
              {/* 里程碑事件 */}
              <div
                className={cn("relative group", {
                  "ring-2 ring-blue-200": isSelected,
                })}
              >
                {/* 状态指示和分类图标 */}
                <div className="absolute left-4 top-1 z-10 flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    {getStatusIndicator(layer.milestone.status)}
                    {getCategoryIcon(layer.category, layer)}
                  </div>
                </div>

                {/* 事件内容 */}
                <div className={cn("ml-12 transition-all", statusColorClass)}>
                  <EventMsgRenderer
                    event={layer.milestone.event}
                    timestamp={new Date(layer.milestone.timestamp)}
                    conversationId={conversationId}
                    eventId={layerId}
                    className={cn("border-l-1 transition-all duration-200", {
                      "shadow-sm": isSelected,
                      "hover:shadow-sm": !isSelected,
                    })}
                  />
                </div>

                {/* 展开/折叠按钮和聚合信息 */}
                {hasRelatedEvents && (
                  <div className="absolute left-12 top-2 flex items-center gap-2">
                    <button
                      onClick={() => toggleLayerExpanded(layerId)}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {isLayerExpanded ? (
                        <ChevronDown className="w-3 h-3" />
                      ) : (
                        <ChevronRight className="w-3 h-3" />
                      )}
                      {layer.relatedEvents.length} 个相关事件
                    </button>
                    {getAggregatedInfo(layer)}
                  </div>
                )}

                {/* 时间戳和序号 */}
                <div className="absolute right-2 top-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Badge variant="outline" className="text-xs font-mono">
                    #{layerIndex + 1}
                  </Badge>
                  <div className="text-xs text-muted-foreground">
                    {new Date(layer.milestone.timestamp).toLocaleTimeString()}
                  </div>
                </div>

                {/* 连接线（除了最后一个层级） */}
                {!isLastLayer && (
                  <div className="absolute left-7 top-12 w-0.5 h-6 bg-border" />
                )}
              </div>

              {/* 相关事件（展开时显示） */}
              {hasRelatedEvents && isLayerExpanded && (
                <div className="ml-8 pl-4 border-l-2 border-dashed border-muted space-y-2">
                  {layer.relatedEvents.map((relatedEvent, relatedIndex) => {
                    const isRelatedSelected = selectedEventId === relatedEvent.id;
                    const relatedStatusColorClass = getStatusColorClass(relatedEvent.status);

                    return (
                      <div
                        key={relatedEvent.id}
                        className={cn("relative group", {
                          "ring-1 ring-blue-100": isRelatedSelected,
                        })}
                      >
                        <div className="absolute left-2 top-1 z-10 flex items-center gap-1">
                          <Activity className="w-3 h-3 text-muted-foreground" />
                        </div>

                        <div className={cn("ml-6 transition-all", relatedStatusColorClass)}>
                          <EventMsgRenderer
                            event={relatedEvent.event}
                            timestamp={new Date(relatedEvent.timestamp)}
                            conversationId={conversationId}
                            eventId={relatedEvent.id}
                            className={cn("border-l-1 transition-all duration-200 scale-95", {
                              "shadow-xs": isRelatedSelected,
                            })}
                          />
                        </div>

                        <div className="absolute right-2 top-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Badge variant="secondary" className="text-xs">
                            {relatedIndex + 1}/{layer.relatedEvents.length}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 处理中指示器 */}
              {isLastLayer && isProcessing && (
                <div className="ml-7 flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="w-0.5 h-3 bg-blue-300 animate-pulse" />
                  <Clock className="w-3 h-3 animate-pulse" />
                  <span>处理中...</span>
                </div>
              )}
            </div>
          );
        })
      ) : (
        // 传统显示模式
        groupedEvents.map((eventItem) => {
          const isSelected = selectedEventId === eventItem.id;
          const statusColorClass = getStatusColorClass(eventItem.status);

          return (
            <div
              key={eventItem.id}
              className={cn("relative group", {
                "ring-2 ring-blue-200": isSelected,
              })}
            >
              <div className="absolute left-4 top-1 z-10 flex items-center gap-2">
                <div className="flex items-center gap-1">
                  {getStatusIndicator(eventItem.status)}
                </div>
              </div>

              <div className={cn("ml-10 transition-all", statusColorClass)}>
                <EventMsgRenderer
                  event={eventItem.event}
                  timestamp={eventItem.timestamp}
                  conversationId={conversationId}
                  eventId={eventItem.id}
                  className={cn("border-l-1 transition-all duration-200", {
                    "shadow-sm": isSelected,
                    "hover:shadow-sm": !isSelected,
                  })}
                />
              </div>

              <div className="absolute right-2 top-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Badge variant="outline" className="text-xs font-mono">
                  #{eventItem.index + 1}
                </Badge>
                <div className="text-xs text-muted-foreground">
                  {eventItem.timestamp.toLocaleTimeString()}
                </div>
              </div>

              {!eventItem.isLast && (
                <div className="absolute left-7 top-12 w-0.5 h-3 bg-border" />
              )}

              {eventItem.isLast && isProcessing && (
                <div className="absolute left-7 top-12 flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="w-0.5 h-3 bg-blue-300 animate-pulse" />
                  <Clock className="w-3 h-3 animate-pulse" />
                  <span>处理中...</span>
                </div>
              )}
            </div>
          );
        })
      )}

      {/* 底部间距 */}
      <div className="h-4" />
    </div>
  );
});

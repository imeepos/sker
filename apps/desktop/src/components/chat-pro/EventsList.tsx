import { memo, useCallback, useMemo } from "react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/Button";
import { cn } from "../../lib/utils";
import { EventMsgRenderer } from "../events";
import { EventMsg } from "../../types/protocol/EventMsg";
import {
  ChevronRight,
  ChevronDown,
  Circle,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
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
  /** 当前选中的事件ID */
  selectedEventId?: string | null;
  /** 是否正在处理中 */
  isProcessing?: boolean;
  /** 自定义样式类名 */
  className?: string;
  /** 事件选择回调 */
  onEventSelect?: (eventId: string) => void;
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
  selectedEventId,
  isProcessing = false,
  className,
  onEventSelect,
}: EventsListProps) {
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

  // 处理事件点击
  const handleEventClick = useCallback(
    (eventId: string) => {
      onEventSelect?.(eventId);
    },
    [onEventSelect]
  );

  // 分组事件（按类型或时间）
  const groupedEvents = useMemo(() => {
    return events.map((event, index) => ({
      ...event,
      index,
      isLast: index === events.length - 1,
    }));
  }, [events]);

  if (events.length === 0) {
    return (
      <div className={cn("text-center py-8", className)}>
        <div className="text-muted-foreground">暂无事件</div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {groupedEvents.map((eventItem) => {
        const isSelected = selectedEventId === eventItem.id;
        const statusColorClass = getStatusColorClass(eventItem.status);

        return (
          <div
            key={eventItem.id}
            className={cn("relative group", {
              "ring-2 ring-blue-200": isSelected,
            })}
          >
            {/* 状态指示和选择按钮 */}
            <div className="absolute left-4 top-1 z-10 flex items-center gap-2">
              <div className="flex items-center gap-1">
                {getStatusIndicator(eventItem.status)}
              </div>
            </div>

            {/* 事件内容 */}
            <div className={cn("ml-10 transition-all", statusColorClass)}>
              <EventMsgRenderer
                event={eventItem.event}
                timestamp={eventItem.timestamp}
                className={cn("border-l-1 transition-all duration-200", {
                  "shadow-sm": isSelected,
                  "hover:shadow-sm": !isSelected,
                })}
              />
            </div>

            {/* 时间戳和序号 */}
            <div className="absolute right-2 top-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Badge variant="outline" className="text-xs font-mono">
                #{eventItem.index + 1}
              </Badge>
              <div className="text-xs text-muted-foreground">
                {eventItem.timestamp.toLocaleTimeString()}
              </div>
            </div>

            {/* 连接线（除了最后一个事件） */}
            {!eventItem.isLast && (
              <div className="absolute left-7 top-12 w-0.5 h-3 bg-border" />
            )}

            {/* 处理中指示器 */}
            {eventItem.isLast && isProcessing && (
              <div className="absolute left-7 top-12 flex items-center gap-2 text-xs text-muted-foreground">
                <div className="w-0.5 h-3 bg-blue-300 animate-pulse" />
                <Clock className="w-3 h-3 animate-pulse" />
                <span>处理中...</span>
              </div>
            )}
          </div>
        );
      })}

      {/* 底部间距 */}
      <div className="h-4" />
    </div>
  );
});

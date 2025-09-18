import { EventMsg } from '../../types/protocol/EventMsg'
import { ErrorEventComponent } from './ErrorEventComponent'
import { TaskStartedEventComponent } from './TaskStartedEventComponent'
import { TaskCompleteEventComponent } from './TaskCompleteEventComponent'
import { TokenCountEventComponent } from './TokenCountEventComponent'
import { AgentMessageEventComponent } from './AgentMessageEventComponent'
import { UserMessageEventComponent } from './UserMessageEventComponent'
import { McpToolCallBeginEventComponent } from './McpToolCallBeginEventComponent'
import { McpToolCallEndEventComponent } from './McpToolCallEndEventComponent'
import { WebSearchBeginEventComponent } from './WebSearchBeginEventComponent'
import { WebSearchEndEventComponent } from './WebSearchEndEventComponent'
import { ExecCommandBeginEventComponent } from './ExecCommandBeginEventComponent'
import { ExecCommandOutputDeltaEventComponent } from './ExecCommandOutputDeltaEventComponent'
import { ExecCommandEndEventComponent } from './ExecCommandEndEventComponent'
import { 
  AgentMessageDeltaEventComponent,
  AgentReasoningEventComponent,
  AgentReasoningDeltaEventComponent,
  AgentReasoningRawContentEventComponent,
  AgentReasoningRawContentDeltaEventComponent,
  AgentReasoningSectionBreakEventComponent,
  SessionConfiguredEventComponent,
  BackgroundEventEventComponent,
  StreamErrorEventComponent,
  PatchApplyBeginEventComponent,
  PatchApplyEndEventComponent,
  TurnDiffEventComponent,
  GetHistoryEntryResponseEventComponent,
  McpListToolsResponseEventComponent,
  ListCustomPromptsResponseEventComponent,
  UpdatePlanArgsComponent,
  TurnAbortedEventComponent,
  ConversationPathResponseEventComponent,
  ReviewRequestComponent,
  ExitedReviewModeEventComponent
} from './EventComponentStubs'
import { ExecApprovalRequestEventComponent } from './ExecApprovalRequestEventComponent'
import { ApplyPatchApprovalRequestEventComponent } from './ApplyPatchApprovalRequestEventComponent'

interface EventMsgRendererProps {
  event: EventMsg
  className?: string
  timestamp?: Date
  conversationId?: string
  eventId?: string
}

/**
 * EventMsg 渲染器 - 根据事件类型渲染对应的交互组件
 */
export function EventMsgRenderer({ event, className, timestamp, conversationId, eventId }: EventMsgRendererProps) {
  switch (event.type) {
    case 'error':
      return <ErrorEventComponent event={event} className={className} timestamp={timestamp} />
    
    case 'task_started':
      return <TaskStartedEventComponent event={event} className={className} timestamp={timestamp} />
    
    case 'task_complete':
      return <TaskCompleteEventComponent event={event} className={className} timestamp={timestamp} />
    
    case 'token_count':
      return <TokenCountEventComponent event={event} className={className} timestamp={timestamp} />
    
    case 'agent_message':
      return <AgentMessageEventComponent event={event} className={className} timestamp={timestamp} />
    
    case 'user_message':
      return <UserMessageEventComponent event={event} className={className} timestamp={timestamp} />
    
    case 'agent_message_delta':
      return <AgentMessageDeltaEventComponent event={event} className={className} timestamp={timestamp} />
    
    case 'agent_reasoning':
      return <AgentReasoningEventComponent event={event} className={className} timestamp={timestamp} />
    
    case 'agent_reasoning_delta':
      return <AgentReasoningDeltaEventComponent event={event} className={className} timestamp={timestamp} />
    
    case 'agent_reasoning_raw_content':
      return <AgentReasoningRawContentEventComponent event={event} className={className} timestamp={timestamp} />
    
    case 'agent_reasoning_raw_content_delta':
      return <AgentReasoningRawContentDeltaEventComponent event={event} className={className} timestamp={timestamp} />
    
    case 'agent_reasoning_section_break':
      return <AgentReasoningSectionBreakEventComponent event={event} className={className} timestamp={timestamp} />
    
    case 'session_configured':
      return <SessionConfiguredEventComponent event={event} className={className} timestamp={timestamp} />
    
    case 'mcp_tool_call_begin':
      return <McpToolCallBeginEventComponent event={event} className={className} timestamp={timestamp} />
    
    case 'mcp_tool_call_end':
      return <McpToolCallEndEventComponent event={event} className={className} timestamp={timestamp} />
    
    case 'web_search_begin':
      return <WebSearchBeginEventComponent event={event} className={className} timestamp={timestamp} />
    
    case 'web_search_end':
      return <WebSearchEndEventComponent event={event} className={className} timestamp={timestamp} />
    
    case 'exec_command_begin':
      return <ExecCommandBeginEventComponent event={event} className={className} timestamp={timestamp} />
    
    case 'exec_command_output_delta':
      return <ExecCommandOutputDeltaEventComponent event={event} className={className} timestamp={timestamp} />
    
    case 'exec_command_end':
      return <ExecCommandEndEventComponent event={event} className={className} timestamp={timestamp} />
    
    case 'exec_approval_request':
      return (
        <ExecApprovalRequestEventComponent 
          event={event} 
          className={className} 
          timestamp={timestamp}
          conversationId={conversationId || ''}
          eventId={eventId || ''}
        />
      )
    
    case 'apply_patch_approval_request':
      return (
        <ApplyPatchApprovalRequestEventComponent 
          event={event} 
          className={className} 
          timestamp={timestamp}
          conversationId={conversationId || ''}
          eventId={eventId || ''}
        />
      )
    
    case 'background_event':
      return <BackgroundEventEventComponent event={event} className={className} timestamp={timestamp} />
    
    case 'stream_error':
      return <StreamErrorEventComponent event={event} className={className} timestamp={timestamp} />
    
    case 'patch_apply_begin':
      return <PatchApplyBeginEventComponent event={event} className={className} timestamp={timestamp} />
    
    case 'patch_apply_end':
      return <PatchApplyEndEventComponent event={event} className={className} timestamp={timestamp} />
    
    case 'turn_diff':
      return <TurnDiffEventComponent event={event} className={className} timestamp={timestamp} />
    
    case 'get_history_entry_response':
      return <GetHistoryEntryResponseEventComponent event={event} className={className} timestamp={timestamp} />
    
    case 'mcp_list_tools_response':
      return <McpListToolsResponseEventComponent event={event} className={className} timestamp={timestamp} />
    
    case 'list_custom_prompts_response':
      return <ListCustomPromptsResponseEventComponent event={event} className={className} timestamp={timestamp} />
    
    case 'plan_update':
      return <UpdatePlanArgsComponent event={event} className={className} timestamp={timestamp} />
    
    case 'turn_aborted':
      return <TurnAbortedEventComponent event={event} className={className} timestamp={timestamp} />
    
    case 'shutdown_complete':
      return (
        <div className={className}>
          <div className="text-sm text-muted-foreground">会话结束</div>
        </div>
      )
    
    case 'conversation_path':
      return <ConversationPathResponseEventComponent event={event} className={className} timestamp={timestamp} />
    
    case 'entered_review_mode':
      return <ReviewRequestComponent event={event} className={className} timestamp={timestamp} />
    
    case 'exited_review_mode':
      return <ExitedReviewModeEventComponent event={event} className={className} timestamp={timestamp} />
    
    default:
      return (
        <div className={className}>
          <div className="text-sm text-muted-foreground">
            未知事件类型: {(event as any).type}
          </div>
        </div>
      )
  }
}
import {
  AgentMessageDeltaEvent,
  AgentMessageEvent,
  AgentReasoningDeltaEvent,
  AgentReasoningEvent,
  AgentReasoningRawContentDeltaEvent,
  AgentReasoningRawContentEvent,
  AgentReasoningSectionBreakEvent,
  ApplyPatchApprovalRequestEvent,
  BackgroundEventEvent,
  ConversationPathResponseEvent,
  ErrorEvent,
  EventMsg,
  ExecApprovalRequestEvent,
  ExecCommandBeginEvent,
  ExecCommandEndEvent,
  ExecCommandOutputDeltaEvent,
  ExitedReviewModeEvent,
  GetHistoryEntryResponseEvent,
  ListCustomPromptsResponseEvent,
  McpListToolsResponseEvent,
  McpToolCallBeginEvent,
  McpToolCallEndEvent,
  PatchApplyBeginEvent,
  PatchApplyEndEvent,
  ReviewRequest,
  SessionConfiguredEvent,
  StreamErrorEvent,
  TaskCompleteEvent,
  TaskStartedEvent,
  TokenCountEvent,
  TurnAbortedEvent,
  TurnDiffEvent,
  UpdatePlanArgs,
  UserMessageEvent,
  WebSearchBeginEvent,
  WebSearchEndEvent,
} from "./protocol";

/**
 * 检查事件消息是否为代理消息事件
 * @param eventMsg 事件消息对象
 * @returns 如果是代理消息事件则返回 true
 */
export function isAgentMessage(
  eventMsg: EventMsg
): eventMsg is AgentMessageEvent & { type: `agent_message` } {
  return eventMsg.type === "agent_message";
}

/**
 * 检查事件消息是否为代理消息增量事件
 * @param eventMsg 事件消息对象
 * @returns 如果是代理消息增量事件则返回 true
 */
export function isAgentMessageDelta(
  eventMsg: EventMsg
): eventMsg is AgentMessageDeltaEvent & { type: `agent_message_delta` } {
  return eventMsg.type === "agent_message_delta";
}

/**
 * 检查事件消息是否为错误事件
 * @param eventMsg 事件消息对象
 * @returns 如果是错误事件则返回 true
 */
export function isError(
  eventMsg: EventMsg
): eventMsg is ErrorEvent & { type: `error` } {
  return eventMsg.type === "error";
}

/**
 * 检查事件消息是否为任务开始事件
 * @param eventMsg 事件消息对象
 * @returns 如果是任务开始事件则返回 true
 */
export function isTaskStarted(
  eventMsg: EventMsg
): eventMsg is TaskStartedEvent & { type: `task_started` } {
  return eventMsg.type === "task_started";
}

/**
 * 检查事件消息是否为任务完成事件
 * @param eventMsg 事件消息对象
 * @returns 如果是任务完成事件则返回 true
 */
export function isTaskComplete(
  eventMsg: EventMsg
): eventMsg is TaskCompleteEvent & { type: `task_complete` } {
  return eventMsg.type === "task_complete";
}

/**
 * 检查事件消息是否为令牌计数事件
 * @param eventMsg 事件消息对象
 * @returns 如果是令牌计数事件则返回 true
 */
export function isTokenCount(
  eventMsg: EventMsg
): eventMsg is TokenCountEvent & { type: `token_count` } {
  return eventMsg.type === "token_count";
}

/**
 * 检查事件消息是否为用户消息事件
 * @param eventMsg 事件消息对象
 * @returns 如果是用户消息事件则返回 true
 */
export function isUserMessage(
  eventMsg: EventMsg
): eventMsg is UserMessageEvent & { type: `user_message` } {
  return eventMsg.type === "user_message";
}

/**
 * 检查事件消息是否为代理推理事件
 * @param eventMsg 事件消息对象
 * @returns 如果是代理推理事件则返回 true
 */
export function isAgentReasoning(
  eventMsg: EventMsg
): eventMsg is AgentReasoningEvent & { type: `agent_reasoning` } {
  return eventMsg.type === "agent_reasoning";
}

/**
 * 检查事件消息是否为代理推理增量事件
 * @param eventMsg 事件消息对象
 * @returns 如果是代理推理增量事件则返回 true
 */
export function isAgentReasoningDelta(
  eventMsg: EventMsg
): eventMsg is AgentReasoningDeltaEvent & { type: `agent_reasoning_delta` } {
  return eventMsg.type === "agent_reasoning_delta";
}

/**
 * 检查事件消息是否为代理推理原始内容事件
 * @param eventMsg 事件消息对象
 * @returns 如果是代理推理原始内容事件则返回 true
 */
export function isAgentReasoningRawContent(
  eventMsg: EventMsg
): eventMsg is AgentReasoningRawContentEvent & { type: `agent_reasoning_raw_content` } {
  return eventMsg.type === "agent_reasoning_raw_content";
}

/**
 * 检查事件消息是否为代理推理原始内容增量事件
 * @param eventMsg 事件消息对象
 * @returns 如果是代理推理原始内容增量事件则返回 true
 */
export function isAgentReasoningRawContentDelta(
  eventMsg: EventMsg
): eventMsg is AgentReasoningRawContentDeltaEvent & { type: `agent_reasoning_raw_content_delta` } {
  return eventMsg.type === "agent_reasoning_raw_content_delta";
}

/**
 * 检查事件消息是否为代理推理分节事件
 * @param eventMsg 事件消息对象
 * @returns 如果是代理推理分节事件则返回 true
 */
export function isAgentReasoningSectionBreak(
  eventMsg: EventMsg
): eventMsg is AgentReasoningSectionBreakEvent & { type: `agent_reasoning_section_break` } {
  return eventMsg.type === "agent_reasoning_section_break";
}

/**
 * 检查事件消息是否为会话配置事件
 * @param eventMsg 事件消息对象
 * @returns 如果是会话配置事件则返回 true
 */
export function isSessionConfigured(
  eventMsg: EventMsg
): eventMsg is SessionConfiguredEvent & { type: `session_configured` } {
  return eventMsg.type === "session_configured";
}

/**
 * 检查事件消息是否为MCP工具调用开始事件
 * @param eventMsg 事件消息对象
 * @returns 如果是MCP工具调用开始事件则返回 true
 */
export function isMcpToolCallBegin(
  eventMsg: EventMsg
): eventMsg is McpToolCallBeginEvent & { type: `mcp_tool_call_begin` } {
  return eventMsg.type === "mcp_tool_call_begin";
}

/**
 * 检查事件消息是否为MCP工具调用结束事件
 * @param eventMsg 事件消息对象
 * @returns 如果是MCP工具调用结束事件则返回 true
 */
export function isMcpToolCallEnd(
  eventMsg: EventMsg
): eventMsg is McpToolCallEndEvent & { type: `mcp_tool_call_end` } {
  return eventMsg.type === "mcp_tool_call_end";
}

/**
 * 检查事件消息是否为网页搜索开始事件
 * @param eventMsg 事件消息对象
 * @returns 如果是网页搜索开始事件则返回 true
 */
export function isWebSearchBegin(
  eventMsg: EventMsg
): eventMsg is WebSearchBeginEvent & { type: `web_search_begin` } {
  return eventMsg.type === "web_search_begin";
}

/**
 * 检查事件消息是否为网页搜索结束事件
 * @param eventMsg 事件消息对象
 * @returns 如果是网页搜索结束事件则返回 true
 */
export function isWebSearchEnd(
  eventMsg: EventMsg
): eventMsg is WebSearchEndEvent & { type: `web_search_end` } {
  return eventMsg.type === "web_search_end";
}

/**
 * 检查事件消息是否为执行命令开始事件
 * @param eventMsg 事件消息对象
 * @returns 如果是执行命令开始事件则返回 true
 */
export function isExecCommandBegin(
  eventMsg: EventMsg
): eventMsg is ExecCommandBeginEvent & { type: `exec_command_begin` } {
  return eventMsg.type === "exec_command_begin";
}

/**
 * 检查事件消息是否为执行命令输出增量事件
 * @param eventMsg 事件消息对象
 * @returns 如果是执行命令输出增量事件则返回 true
 */
export function isExecCommandOutputDelta(
  eventMsg: EventMsg
): eventMsg is ExecCommandOutputDeltaEvent & { type: `exec_command_output_delta` } {
  return eventMsg.type === "exec_command_output_delta";
}

/**
 * 检查事件消息是否为执行命令结束事件
 * @param eventMsg 事件消息对象
 * @returns 如果是执行命令结束事件则返回 true
 */
export function isExecCommandEnd(
  eventMsg: EventMsg
): eventMsg is ExecCommandEndEvent & { type: `exec_command_end` } {
  return eventMsg.type === "exec_command_end";
}

/**
 * 检查事件消息是否为执行批准请求事件
 * @param eventMsg 事件消息对象
 * @returns 如果是执行批准请求事件则返回 true
 */
export function isExecApprovalRequest(
  eventMsg: EventMsg
): eventMsg is ExecApprovalRequestEvent & { type: `exec_approval_request` } {
  return eventMsg.type === "exec_approval_request";
}

/**
 * 检查事件消息是否为应用补丁批准请求事件
 * @param eventMsg 事件消息对象
 * @returns 如果是应用补丁批准请求事件则返回 true
 */
export function isApplyPatchApprovalRequest(
  eventMsg: EventMsg
): eventMsg is ApplyPatchApprovalRequestEvent & { type: `apply_patch_approval_request` } {
  return eventMsg.type === "apply_patch_approval_request";
}

/**
 * 检查事件消息是否为后台事件
 * @param eventMsg 事件消息对象
 * @returns 如果是后台事件则返回 true
 */
export function isBackgroundEvent(
  eventMsg: EventMsg
): eventMsg is BackgroundEventEvent & { type: `background_event` } {
  return eventMsg.type === "background_event";
}

/**
 * 检查事件消息是否为流错误事件
 * @param eventMsg 事件消息对象
 * @returns 如果是流错误事件则返回 true
 */
export function isStreamError(
  eventMsg: EventMsg
): eventMsg is StreamErrorEvent & { type: `stream_error` } {
  return eventMsg.type === "stream_error";
}

/**
 * 检查事件消息是否为补丁应用开始事件
 * @param eventMsg 事件消息对象
 * @returns 如果是补丁应用开始事件则返回 true
 */
export function isPatchApplyBegin(
  eventMsg: EventMsg
): eventMsg is PatchApplyBeginEvent & { type: `patch_apply_begin` } {
  return eventMsg.type === "patch_apply_begin";
}

/**
 * 检查事件消息是否为补丁应用结束事件
 * @param eventMsg 事件消息对象
 * @returns 如果是补丁应用结束事件则返回 true
 */
export function isPatchApplyEnd(
  eventMsg: EventMsg
): eventMsg is PatchApplyEndEvent & { type: `patch_apply_end` } {
  return eventMsg.type === "patch_apply_end";
}

/**
 * 检查事件消息是否为对话轮次差异事件
 * @param eventMsg 事件消息对象
 * @returns 如果是对话轮次差异事件则返回 true
 */
export function isTurnDiff(
  eventMsg: EventMsg
): eventMsg is TurnDiffEvent & { type: `turn_diff` } {
  return eventMsg.type === "turn_diff";
}

/**
 * 检查事件消息是否为获取历史条目响应事件
 * @param eventMsg 事件消息对象
 * @returns 如果是获取历史条目响应事件则返回 true
 */
export function isGetHistoryEntryResponse(
  eventMsg: EventMsg
): eventMsg is GetHistoryEntryResponseEvent & { type: `get_history_entry_response` } {
  return eventMsg.type === "get_history_entry_response";
}

/**
 * 检查事件消息是否为MCP工具列表响应事件
 * @param eventMsg 事件消息对象
 * @returns 如果是MCP工具列表响应事件则返回 true
 */
export function isMcpListToolsResponse(
  eventMsg: EventMsg
): eventMsg is McpListToolsResponseEvent & { type: `mcp_list_tools_response` } {
  return eventMsg.type === "mcp_list_tools_response";
}

/**
 * 检查事件消息是否为自定义提示列表响应事件
 * @param eventMsg 事件消息对象
 * @returns 如果是自定义提示列表响应事件则返回 true
 */
export function isListCustomPromptsResponse(
  eventMsg: EventMsg
): eventMsg is ListCustomPromptsResponseEvent & { type: `list_custom_prompts_response` } {
  return eventMsg.type === "list_custom_prompts_response";
}

/**
 * 检查事件消息是否为计划更新事件
 * @param eventMsg 事件消息对象
 * @returns 如果是计划更新事件则返回 true
 */
export function isPlanUpdate(
  eventMsg: EventMsg
): eventMsg is UpdatePlanArgs & { type: `plan_update` } {
  return eventMsg.type === "plan_update";
}

/**
 * 检查事件消息是否为对话轮次中止事件
 * @param eventMsg 事件消息对象
 * @returns 如果是对话轮次中止事件则返回 true
 */
export function isTurnAborted(
  eventMsg: EventMsg
): eventMsg is TurnAbortedEvent & { type: `turn_aborted` } {
  return eventMsg.type === "turn_aborted";
}

/**
 * 检查事件消息是否为关闭完成事件
 * @param eventMsg 事件消息对象
 * @returns 如果是关闭完成事件则返回 true
 */
export function isShutdownComplete(
  eventMsg: EventMsg
): eventMsg is { type: `shutdown_complete` } {
  return eventMsg.type === "shutdown_complete";
}

/**
 * 检查事件消息是否为对话路径事件
 * @param eventMsg 事件消息对象
 * @returns 如果是对话路径事件则返回 true
 */
export function isConversationPath(
  eventMsg: EventMsg
): eventMsg is ConversationPathResponseEvent & { type: `conversation_path` } {
  return eventMsg.type === "conversation_path";
}

/**
 * 检查事件消息是否为进入审查模式事件
 * @param eventMsg 事件消息对象
 * @returns 如果是进入审查模式事件则返回 true
 */
export function isEnteredReviewMode(
  eventMsg: EventMsg
): eventMsg is ReviewRequest & { type: `entered_review_mode` } {
  return eventMsg.type === "entered_review_mode";
}

/**
 * 检查事件消息是否为退出审查模式事件
 * @param eventMsg 事件消息对象
 * @returns 如果是退出审查模式事件则返回 true
 */
export function isExitedReviewMode(
  eventMsg: EventMsg
): eventMsg is ExitedReviewModeEvent & { type: `exited_review_mode` } {
  return eventMsg.type === "exited_review_mode";
}

// 聊天相关 Hooks
import React, { useCallback } from 'react';
import { useApiQuery, useApiMutation } from '@/shared/hooks/api';
import { useAppStore } from '@/shared/stores/app';
import { useErrorHandler } from '@/shared/hooks/utils';
import { queryClient } from '@/app/providers';
import { 
  chatApi, 
  type SendMessageRequest, 
  type CreateConversationRequest,
  type UpdateConversationRequest,
  type GetMessagesParams,
  type GetConversationsParams 
} from '../api/chatApi';

/**
 * 聊天会话 Hook
 */
export function useConversations(params?: GetConversationsParams) {
  const { handleError } = useErrorHandler();
  const { addNotification } = useAppStore();

  // 获取会话列表
  const conversationsQuery = useApiQuery(
    ['chat', 'conversations', params],
    () => chatApi.getConversations(params)
  );

  // 处理查询错误
  React.useEffect(() => {
    if (conversationsQuery.error) {
      handleError(conversationsQuery.error);
    }
  }, [conversationsQuery.error, handleError]);

  // 创建会话
  const createConversationMutation = useApiMutation(
    chatApi.createConversation,
    {
      onSuccess: (data) => {
        // 更新会话列表缓存
        queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] });
        addNotification({
          type: 'success',
          title: '会话已创建',
          message: `已创建会话：${data.title}`,
        });
      },
      onError: (error) => {
        handleError(error, {
          customMessage: '创建会话失败',
        });
      },
    }
  );

  // 更新会话
  const updateConversationMutation = useApiMutation(
    ({ conversationId, updates }: { conversationId: string; updates: UpdateConversationRequest }) =>
      chatApi.updateConversation(conversationId, updates),
    {
      onSuccess: (data) => {
        // 更新相关缓存
        queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] });
        queryClient.invalidateQueries({ queryKey: ['chat', 'conversation', data.id] });
        addNotification({
          type: 'success',
          title: '会话已更新',
        });
      },
      onError: (error) => {
        handleError(error, {
          customMessage: '更新会话失败',
        });
      },
    }
  );

  // 删除会话
  const deleteConversationMutation = useApiMutation(
    chatApi.deleteConversation,
    {
      onSuccess: () => {
        // 更新会话列表缓存
        queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] });
        addNotification({
          type: 'success',
          title: '会话已删除',
        });
      },
      onError: (error) => {
        handleError(error, {
          customMessage: '删除会话失败',
        });
      },
    }
  );

  return {
    conversations: conversationsQuery.data || [],
    isLoading: conversationsQuery.isLoading,
    error: conversationsQuery.error,
    
    createConversation: (request: CreateConversationRequest) =>
      createConversationMutation.mutate(request),
    updateConversation: (conversationId: string, updates: UpdateConversationRequest) =>
      updateConversationMutation.mutate({ conversationId, updates }),
    deleteConversation: (conversationId: string) =>
      deleteConversationMutation.mutate(conversationId),
    
    isCreating: createConversationMutation.isPending,
    isUpdating: updateConversationMutation.isPending,
    isDeleting: deleteConversationMutation.isPending,
    
    refetch: conversationsQuery.refetch,
  };
}

/**
 * 单个会话 Hook
 */
export function useConversation(conversationId: string) {
  const { handleError } = useErrorHandler();

  const conversationQuery = useApiQuery(
    ['chat', 'conversation', conversationId],
    () => chatApi.getConversation(conversationId),
    {
      enabled: !!conversationId,
    }
  );

  // 处理查询错误
  React.useEffect(() => {
    if (conversationQuery.error) {
      handleError(conversationQuery.error);
    }
  }, [conversationQuery.error, handleError]);

  return {
    conversation: conversationQuery.data,
    isLoading: conversationQuery.isLoading,
    error: conversationQuery.error,
    refetch: conversationQuery.refetch,
  };
}

/**
 * 聊天消息 Hook
 */
export function useMessages(params: GetMessagesParams) {
  const { handleError } = useErrorHandler();
  const { addNotification } = useAppStore();

  // 获取消息列表
  const messagesQuery = useApiQuery(
    ['chat', 'messages', params.conversation_id, params],
    () => chatApi.getMessages(params),
    {
      enabled: !!params.conversation_id,
    }
  );

  // 处理查询错误
  React.useEffect(() => {
    if (messagesQuery.error) {
      handleError(messagesQuery.error);
    }
  }, [messagesQuery.error, handleError]);

  // 发送消息
  const sendMessageMutation = useApiMutation(
    chatApi.sendMessage,
    {
      onSuccess: () => {
        // 更新消息列表缓存
        queryClient.invalidateQueries({ 
          queryKey: ['chat', 'messages', params.conversation_id] 
        });
        // 更新会话的最后消息时间
        queryClient.invalidateQueries({ 
          queryKey: ['chat', 'conversations'] 
        });
      },
      onError: (error) => {
        handleError(error, {
          customMessage: '发送消息失败',
        });
      },
    }
  );

  // 删除消息
  const deleteMessageMutation = useApiMutation(
    chatApi.deleteMessage,
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ 
          queryKey: ['chat', 'messages', params.conversation_id] 
        });
        addNotification({
          type: 'success',
          title: '消息已删除',
        });
      },
      onError: (error) => {
        handleError(error, {
          customMessage: '删除消息失败',
        });
      },
    }
  );

  return {
    messages: messagesQuery.data || [],
    isLoading: messagesQuery.isLoading,
    error: messagesQuery.error,
    
    sendMessage: (request: SendMessageRequest) =>
      sendMessageMutation.mutate(request),
    deleteMessage: (messageId: string) =>
      deleteMessageMutation.mutate(messageId),
    
    isSending: sendMessageMutation.isPending,
    isDeleting: deleteMessageMutation.isPending,
    
    refetch: messagesQuery.refetch,
  };
}

/**
 * 聊天搜索 Hook
 */
export function useChatSearch() {
  const { handleError } = useErrorHandler();

  const searchMutation = useApiMutation(
    ({ query, conversationId }: { query: string; conversationId?: string }) =>
      chatApi.searchMessages(query, conversationId),
    {
      onError: (error) => {
        handleError(error, {
          customMessage: '搜索失败',
        });
      },
    }
  );

  return {
    search: (query: string, conversationId?: string) =>
      searchMutation.mutate({ query, conversationId }),
    
    results: searchMutation.data || [],
    isSearching: searchMutation.isPending,
    error: searchMutation.error,
    
    reset: searchMutation.reset,
  };
}

/**
 * 流式聊天 Hook
 */
export function useStreamChat() {
  const { handleError } = useErrorHandler();

  const sendStreamMessage = useCallback(
    async (
      request: SendMessageRequest,
      onMessage: (chunk: string) => void,
      onComplete: (message: any) => void
    ) => {
      try {
        const cancelFn = await chatApi.sendMessageStream(
          request,
          onMessage,
          onComplete,
          handleError
        );
        return cancelFn;
      } catch (error) {
        handleError(error as Error, {
          customMessage: '流式聊天连接失败',
        });
        throw error;
      }
    },
    [handleError]
  );

  return {
    sendStreamMessage,
  };
}
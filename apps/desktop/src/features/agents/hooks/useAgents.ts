// 智能体相关 hooks
import { useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { agentsApi } from '../api/agentsApi';
import { useAgentsStore, useAgentsList, useAgentExecution as useStoreAgentExecution, useAgentTemplates as useStoreAgentTemplates } from '@/shared/stores/agents';
import type {
  CreateAgentRequest,
  UpdateAgentRequest,
  GetAgentsParams,
  ExecuteAgentRequest,
} from '../api/agentsApi';

// Query Keys
export const agentsQueryKeys = {
  all: ['agents'] as const,
  lists: () => [...agentsQueryKeys.all, 'list'] as const,
  list: (params: GetAgentsParams) => [...agentsQueryKeys.lists(), params] as const,
  details: () => [...agentsQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...agentsQueryKeys.details(), id] as const,
  stats: (id: string) => [...agentsQueryKeys.all, 'stats', id] as const,
  templates: () => ['agent-templates'] as const,
  search: (query: string) => [...agentsQueryKeys.all, 'search', query] as const,
};

/**
 * 智能体管理 Hook
 */
export function useAgents(params?: GetAgentsParams) {
  const queryClient = useQueryClient();
  const { setAgents, setLoading, setError, addAgent, updateAgent, removeAgent } = useAgentsStore();
  
  // 获取智能体列表
  const {
    data: agents = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: agentsQueryKeys.list(params || {}),
    queryFn: () => agentsApi.getAgents(params),
    staleTime: 5 * 60 * 1000, // 5分钟
  });

  // 同步到store
  useEffect(() => {
    if (agents) {
      setAgents(agents);
    }
    setLoading('agents', isLoading);
    setError('agents', error?.message);
  }, [agents, isLoading, error, setAgents, setLoading, setError]);

  // 创建智能体
  const createMutation = useMutation({
    mutationFn: (data: CreateAgentRequest) => agentsApi.createAgent(data),
    onSuccess: (newAgent) => {
      addAgent(newAgent);
      queryClient.invalidateQueries({ queryKey: agentsQueryKeys.lists() });
      toast.success('智能体创建成功');
    },
    onError: (error: Error) => {
      toast.error(`创建失败: ${error.message}`);
    },
  });

  // 更新智能体
  const updateMutation = useMutation({
    mutationFn: ({ agentId, updates }: { agentId: string; updates: UpdateAgentRequest }) =>
      agentsApi.updateAgent(agentId, updates),
    onSuccess: (updatedAgent) => {
      updateAgent(updatedAgent.id, updatedAgent);
      queryClient.invalidateQueries({ queryKey: agentsQueryKeys.detail(updatedAgent.id) });
      queryClient.invalidateQueries({ queryKey: agentsQueryKeys.lists() });
      toast.success('智能体更新成功');
    },
    onError: (error: Error) => {
      toast.error(`更新失败: ${error.message}`);
    },
  });

  // 删除智能体
  const deleteMutation = useMutation({
    mutationFn: (agentId: string) => agentsApi.deleteAgent(agentId),
    onSuccess: (_, agentId) => {
      removeAgent(agentId);
      queryClient.invalidateQueries({ queryKey: agentsQueryKeys.lists() });
      queryClient.removeQueries({ queryKey: agentsQueryKeys.detail(agentId) });
      toast.success('智能体删除成功');
    },
    onError: (error: Error) => {
      toast.error(`删除失败: ${error.message}`);
    },
  });

  // 复制智能体
  const duplicateMutation = useMutation({
    mutationFn: ({ agentId, name }: { agentId: string; name?: string }) =>
      agentsApi.duplicateAgent(agentId, name),
    onSuccess: (duplicatedAgent) => {
      addAgent(duplicatedAgent);
      queryClient.invalidateQueries({ queryKey: agentsQueryKeys.lists() });
      toast.success('智能体复制成功');
    },
    onError: (error: Error) => {
      toast.error(`复制失败: ${error.message}`);
    },
  });

  // 切换智能体状态
  const toggleMutation = useMutation({
    mutationFn: ({ agentId, isActive }: { agentId: string; isActive: boolean }) =>
      agentsApi.toggleAgent(agentId, isActive),
    onSuccess: (updatedAgent) => {
      updateAgent(updatedAgent.id, updatedAgent);
      queryClient.invalidateQueries({ queryKey: agentsQueryKeys.lists() });
      toast.success(`智能体已${updatedAgent.is_active ? '启用' : '禁用'}`);
    },
    onError: (error: Error) => {
      toast.error(`操作失败: ${error.message}`);
    },
  });

  const agentsList = useAgentsList();

  return {
    // 数据
    agents,
    isLoading,
    error,
    
    // 操作
    refetch,
    createAgent: createMutation.mutateAsync,
    updateAgent: (agentId: string, updates: UpdateAgentRequest) =>
      updateMutation.mutateAsync({ agentId, updates }),
    deleteAgent: deleteMutation.mutateAsync,
    duplicateAgent: (agentId: string, name?: string) =>
      duplicateMutation.mutateAsync({ agentId, name }),
    toggleAgent: (agentId: string, isActive: boolean) =>
      toggleMutation.mutateAsync({ agentId, isActive }),
    
    // 加载状态
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isDuplicating: duplicateMutation.isPending,
    isToggling: toggleMutation.isPending,
    
    // Store hooks
    totalCount: agentsList.totalCount,
  };
}

/**
 * 单个智能体详情 Hook
 */
export function useAgent(agentId: string | undefined) {
  const queryClient = useQueryClient();
  const { setSelectedAgent } = useAgentsStore();

  const {
    data: agent,
    isLoading,
    error,
  } = useQuery({
    queryKey: agentsQueryKeys.detail(agentId!),
    queryFn: () => agentsApi.getAgent(agentId!),
    enabled: !!agentId,
    staleTime: 5 * 60 * 1000,
  });

  // 获取智能体统计信息
  const {
    data: stats,
    isLoading: isLoadingStats,
  } = useQuery({
    queryKey: agentsQueryKeys.stats(agentId!),
    queryFn: () => agentsApi.getAgentStats(agentId!),
    enabled: !!agentId,
    staleTime: 2 * 60 * 1000, // 2分钟
  });

  // 同步选中的智能体到store
  useEffect(() => {
    if (agent) {
      setSelectedAgent(agent);
    }
  }, [agent, setSelectedAgent]);

  // 刷新统计信息
  const refreshStats = useCallback(() => {
    if (agentId) {
      queryClient.invalidateQueries({ queryKey: agentsQueryKeys.stats(agentId) });
    }
  }, [agentId, queryClient]);

  return {
    agent,
    stats,
    isLoading,
    isLoadingStats,
    error,
    refreshStats,
  };
}

/**
 * 智能体执行 Hook
 */
export function useAgentExecution(agentId?: string) {
  const queryClient = useQueryClient();
  const storeExecution = useStoreAgentExecution(agentId);
  const { setLoading, setError } = useAgentsStore();

  // 执行智能体
  const executeMutation = useMutation({
    mutationFn: (request: ExecuteAgentRequest) => agentsApi.executeAgent(request),
    onMutate: (request) => {
      // 开始执行时创建执行记录
      const executionId = storeExecution.startExecution({
        agent_id: request.agent_id,
        input: request.input,
      });
      setLoading('execution', true);
      return { executionId };
    },
    onSuccess: (response, variables, context) => {
      if (context?.executionId) {
        storeExecution.completeExecution(context.executionId, response);
      }
      setLoading('execution', false);
      
      // 刷新智能体统计信息
      if (variables.agent_id) {
        queryClient.invalidateQueries({ 
          queryKey: agentsQueryKeys.stats(variables.agent_id) 
        });
      }
    },
    onError: (error: Error, _variables, context) => {
      if (context?.executionId) {
        storeExecution.failExecution(context.executionId, error.message);
      }
      setLoading('execution', false);
      setError('execution', error.message);
      toast.error(`执行失败: ${error.message}`);
    },
  });

  // 流式执行智能体
  const executeStreamMutation = useMutation({
    mutationFn: async ({
      request,
      onChunk,
    }: {
      request: ExecuteAgentRequest;
      onChunk: (chunk: string) => void;
    }) => {
      const executionId = storeExecution.startExecution({
        agent_id: request.agent_id,
        input: request.input,
      });

      setLoading('execution', true);

      try {
        let fullOutput = '';
        
        const cleanup = await agentsApi.executeAgentStream(
          request,
          (chunk) => {
            fullOutput += chunk;
            onChunk(chunk);
            // 更新执行状态
            storeExecution.updateExecution(executionId, {
              output: fullOutput,
            });
          },
          (response) => {
            storeExecution.completeExecution(executionId, response);
            setLoading('execution', false);
            
            // 刷新智能体统计信息
            queryClient.invalidateQueries({ 
              queryKey: agentsQueryKeys.stats(request.agent_id) 
            });
          },
          (error) => {
            storeExecution.failExecution(executionId, error.message);
            setLoading('execution', false);
            setError('execution', error.message);
            toast.error(`执行失败: ${error.message}`);
          }
        );

        return cleanup;
      } catch (error) {
        storeExecution.failExecution(executionId, (error as Error).message);
        setLoading('execution', false);
        throw error;
      }
    },
  });

  return {
    ...storeExecution,
    executeAgent: executeMutation.mutateAsync,
    executeAgentStream: executeStreamMutation.mutateAsync,
    isExecuting: executeMutation.isPending || executeStreamMutation.isPending,
  };
}

/**
 * 智能体模板 Hook
 */
export function useAgentTemplates() {
  const storeTemplates = useStoreAgentTemplates();
  const { setLoading, setError } = useAgentsStore();

  // 获取模板列表
  const {
    data: templates = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: agentsQueryKeys.templates(),
    queryFn: () => agentsApi.getTemplates(),
    staleTime: 10 * 60 * 1000, // 10分钟
  });

  // 同步到store
  useEffect(() => {
    if (templates) {
      storeTemplates.setTemplates(templates);
    }
    setLoading('templates', isLoading);
    setError('templates', error?.message);
  }, [templates, isLoading, error, storeTemplates, setLoading, setError]);

  // 从模板创建智能体
  const createFromTemplateMutation = useMutation({
    mutationFn: ({ templateId, name }: { templateId: string; name: string }) =>
      agentsApi.createFromTemplate(templateId, name),
    onSuccess: () => {
      toast.success('从模板创建智能体成功');
    },
    onError: (error: Error) => {
      toast.error(`创建失败: ${error.message}`);
    },
  });

  return {
    ...storeTemplates,
    isLoading,
    error,
    refetch,
    createFromTemplate: createFromTemplateMutation.mutateAsync,
    isCreatingFromTemplate: createFromTemplateMutation.isPending,
  };
}

/**
 * 智能体搜索 Hook
 */
export function useAgentSearch() {
  const searchMutation = useMutation({
    mutationFn: (query: string) => agentsApi.searchAgents(query),
    onError: (error: Error) => {
      toast.error(`搜索失败: ${error.message}`);
    },
  });

  return {
    searchAgents: searchMutation.mutateAsync,
    isSearching: searchMutation.isPending,
    searchResults: searchMutation.data,
    searchError: searchMutation.error,
  };
}

/**
 * 智能体导入导出 Hook
 */
export function useAgentImportExport() {
  // 导出智能体
  const exportMutation = useMutation({
    mutationFn: (agentId: string) => agentsApi.exportAgent(agentId),
    onSuccess: () => {
      toast.success('智能体导出成功');
    },
    onError: (error: Error) => {
      toast.error(`导出失败: ${error.message}`);
    },
  });

  // 导入智能体
  const importMutation = useMutation({
    mutationFn: (config: string) => agentsApi.importAgent(config),
    onSuccess: () => {
      toast.success('智能体导入成功');
    },
    onError: (error: Error) => {
      toast.error(`导入失败: ${error.message}`);
    },
  });

  return {
    exportAgent: exportMutation.mutateAsync,
    importAgent: importMutation.mutateAsync,
    isExporting: exportMutation.isPending,
    isImporting: importMutation.isPending,
    exportData: exportMutation.data,
    importedAgent: importMutation.data,
  };
}
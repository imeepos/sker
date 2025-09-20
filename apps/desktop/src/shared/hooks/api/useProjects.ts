/**
 * 项目管理相关的React Query hooks
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { useToast } from '../useToast';
import {
  createProject,
  getProjects,
  getProject,
  updateProject,
  deleteProject,
  getProjectStats,
} from '../../api/projects';
import type { 
  Project, 
  CreateProjectRequest, 
  UpdateProjectRequest 
} from '../../types/project';

// Query Keys
export const PROJECT_QUERY_KEYS = {
  all: ['projects'] as const,
  lists: () => [...PROJECT_QUERY_KEYS.all, 'list'] as const,
  list: (filters: string) => [...PROJECT_QUERY_KEYS.lists(), { filters }] as const,
  details: () => [...PROJECT_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...PROJECT_QUERY_KEYS.details(), id] as const,
  stats: () => [...PROJECT_QUERY_KEYS.all, 'stats'] as const,
};

/**
 * 获取项目列表
 */
export function useProjects() {
  const { token } = useAuth();
  
  return useQuery({
    queryKey: PROJECT_QUERY_KEYS.lists(),
    queryFn: () => getProjects(token!),
    enabled: !!token,
    staleTime: 1000 * 60 * 5, // 5分钟缓存
  });
}

/**
 * 获取项目详情
 */
export function useProject(projectId: string | undefined) {
  return useQuery({
    queryKey: PROJECT_QUERY_KEYS.detail(projectId || ''),
    queryFn: () => getProject(projectId!),
    enabled: !!projectId,
    staleTime: 1000 * 60 * 5, // 5分钟缓存
  });
}

/**
 * 获取项目统计信息
 */
export function useProjectStats() {
  const { token } = useAuth();
  
  return useQuery({
    queryKey: PROJECT_QUERY_KEYS.stats(),
    queryFn: () => getProjectStats(token!),
    enabled: !!token,
    staleTime: 1000 * 60 * 2, // 2分钟缓存
  });
}

/**
 * 创建项目
 */
export function useCreateProject() {
  const queryClient = useQueryClient();
  const { token } = useAuth();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (request: CreateProjectRequest) => createProject(request, token!),
    onSuccess: (newProject) => {
      // 更新项目列表缓存
      queryClient.invalidateQueries({ queryKey: PROJECT_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: PROJECT_QUERY_KEYS.stats() });
      
      // 添加到缓存
      queryClient.setQueryData(
        PROJECT_QUERY_KEYS.detail(newProject.project_id),
        newProject
      );
      
      showToast({
        type: 'success',
        title: '项目创建成功',
        message: `项目 "${newProject.name}" 已成功创建`,
      });
    },
    onError: (error) => {
      showToast({
        type: 'error',
        title: '创建项目失败',
        message: error.message || '创建项目时发生未知错误',
      });
    },
  });
}

/**
 * 更新项目
 */
export function useUpdateProject() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (request: UpdateProjectRequest) => updateProject(request),
    onSuccess: (updatedProject) => {
      // 更新缓存
      queryClient.invalidateQueries({ queryKey: PROJECT_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: PROJECT_QUERY_KEYS.stats() });
      queryClient.setQueryData(
        PROJECT_QUERY_KEYS.detail(updatedProject.project_id),
        updatedProject
      );
      
      showToast({
        type: 'success',
        title: '项目更新成功',
        message: `项目 "${updatedProject.name}" 已成功更新`,
      });
    },
    onError: (error) => {
      showToast({
        type: 'error',
        title: '更新项目失败',
        message: error.message || '更新项目时发生未知错误',
      });
    },
  });
}

/**
 * 删除项目
 */
export function useDeleteProject() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (projectId: string) => deleteProject(projectId),
    onSuccess: (_, projectId) => {
      // 更新缓存
      queryClient.invalidateQueries({ queryKey: PROJECT_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: PROJECT_QUERY_KEYS.stats() });
      queryClient.removeQueries({ queryKey: PROJECT_QUERY_KEYS.detail(projectId) });
      
      showToast({
        type: 'success',
        title: '项目删除成功',
        message: '项目已成功删除',
      });
    },
    onError: (error) => {
      showToast({
        type: 'error',
        title: '删除项目失败',
        message: error.message || '删除项目时发生未知错误',
      });
    },
  });
}

/**
 * 批量操作项目状态
 */
export function useBatchUpdateProjectStatus() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: async (requests: { projectId: string; status: string }[]) => {
      const promises = requests.map(({ projectId, status }) =>
        updateProject({ project_id: projectId, status })
      );
      return Promise.all(promises);
    },
    onSuccess: (updatedProjects) => {
      // 更新缓存
      queryClient.invalidateQueries({ queryKey: PROJECT_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: PROJECT_QUERY_KEYS.stats() });
      
      updatedProjects.forEach((project) => {
        queryClient.setQueryData(
          PROJECT_QUERY_KEYS.detail(project.project_id),
          project
        );
      });
      
      showToast({
        type: 'success',
        title: '批量更新成功',
        message: `已成功更新 ${updatedProjects.length} 个项目的状态`,
      });
    },
    onError: (error) => {
      showToast({
        type: 'error',
        title: '批量更新失败',
        message: error.message || '批量更新项目时发生未知错误',
      });
    },
  });
}
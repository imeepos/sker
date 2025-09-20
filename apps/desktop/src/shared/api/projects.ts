/**
 * 项目管理相关的API调用封装
 */
import { invoke } from '@tauri-apps/api/core';
import { handleIpcError } from './client';
import type { 
  Project, 
  CreateProjectRequest, 
  UpdateProjectRequest,
  ProjectQueryParams 
} from '../types/project';

/**
 * 创建新项目
 */
export async function createProject(
  request: CreateProjectRequest, 
  token: string
): Promise<Project> {
  try {
    const result = await invoke<Project>('create_project', {
      request,
      token
    });
    return result;
  } catch (error) {
    throw handleIpcError(error);
  }
}

/**
 * 获取项目列表
 */
export async function getProjects(token: string): Promise<Project[]> {
  try {
    const result = await invoke<Project[]>('get_projects', {
      token
    });
    return result;
  } catch (error) {
    throw handleIpcError(error);
  }
}

/**
 * 获取项目详情
 */
export async function getProject(projectId: string): Promise<Project | null> {
  try {
    const result = await invoke<Project | null>('get_project', {
      projectId
    });
    return result;
  } catch (error) {
    throw handleIpcError(error);
  }
}

/**
 * 更新项目
 */
export async function updateProject(request: UpdateProjectRequest): Promise<Project> {
  try {
    const result = await invoke<Project>('update_project', {
      request
    });
    return result;
  } catch (error) {
    throw handleIpcError(error);
  }
}

/**
 * 删除项目
 */
export async function deleteProject(projectId: string): Promise<void> {
  try {
    await invoke<void>('delete_project', {
      projectId
    });
  } catch (error) {
    throw handleIpcError(error);
  }
}

/**
 * 获取项目统计信息
 */
export async function getProjectStats(token: string): Promise<{
  total: number;
  active: number;
  completed: number;
  paused: number;
}> {
  try {
    const projects = await getProjects(token);
    const stats = {
      total: projects.length,
      active: projects.filter(p => p.status === 'active').length,
      completed: projects.filter(p => p.status === 'completed').length,
      paused: projects.filter(p => p.status === 'paused').length,
    };
    return stats;
  } catch (error) {
    throw handleIpcError(error);
  }
}
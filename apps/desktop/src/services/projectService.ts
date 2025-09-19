import { invoke } from '@tauri-apps/api/core'

export interface Project {
  project_id: string
  user_id: string
  name: string
  description?: string
  repository_url: string
  main_branch: string
  workspace_path: string
  technology_stack: string[]
  status: string
  created_at: string
  updated_at: string
}

export interface CreateProjectRequest {
  name: string
  description?: string
  repository_url: string
  main_branch?: string
  workspace_path: string
  technology_stack?: string[]
}

export interface UpdateProjectRequest {
  project_id: string
  name?: string
  description?: string
  repository_url?: string
  main_branch?: string
  workspace_path?: string
  technology_stack?: string[]
  status?: string
}

/**
 * 项目管理服务
 */
export class ProjectService {
  /**
   * 创建新项目
   */
  async createProject(request: CreateProjectRequest): Promise<Project> {
    try {
      const project = await invoke<Project>('create_project', { request })
      console.log('项目创建成功:', project)
      return project
    } catch (error) {
      console.error('创建项目失败:', error)
      throw new Error(`创建项目失败: ${error}`)
    }
  }

  /**
   * 获取项目列表
   */
  async getProjects(): Promise<Project[]> {
    try {
      const projects = await invoke<Project[]>('get_projects')
      console.log('获取项目列表成功:', projects.length)
      return projects
    } catch (error) {
      console.error('获取项目列表失败:', error)
      throw new Error(`获取项目列表失败: ${error}`)
    }
  }

  /**
   * 获取项目详情
   */
  async getProject(projectId: string): Promise<Project | null> {
    try {
      const project = await invoke<Project | null>('get_project', { 
        projectId 
      })
      console.log('获取项目详情成功:', project?.name || '未找到')
      return project
    } catch (error) {
      console.error('获取项目详情失败:', error)
      throw new Error(`获取项目详情失败: ${error}`)
    }
  }

  /**
   * 更新项目
   */
  async updateProject(request: UpdateProjectRequest): Promise<Project> {
    try {
      const project = await invoke<Project>('update_project', { request })
      console.log('项目更新成功:', project.name)
      return project
    } catch (error) {
      console.error('更新项目失败:', error)
      throw new Error(`更新项目失败: ${error}`)
    }
  }

  /**
   * 删除项目
   */
  async deleteProject(projectId: string): Promise<void> {
    try {
      await invoke('delete_project', { projectId })
      console.log('项目删除成功:', projectId)
    } catch (error) {
      console.error('删除项目失败:', error)
      throw new Error(`删除项目失败: ${error}`)
    }
  }
}

// 导出单例实例
export const projectService = new ProjectService()
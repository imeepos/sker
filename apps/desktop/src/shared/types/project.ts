/**
 * 项目相关的类型定义
 * 对应后端 Project 实体
 */

// 项目状态枚举
export enum ProjectStatus {
  PLANNING = 'planning',    // 规划中
  ACTIVE = 'active',        // 进行中
  PAUSED = 'paused',        // 暂停
  COMPLETED = 'completed',  // 已完成
  ARCHIVED = 'archived',    // 已归档
}

// 项目实体
export interface Project {
  project_id: string;        // 项目ID (UUID)
  user_id: string;          // 用户ID
  name: string;             // 项目名称
  description?: string;     // 项目描述
  repository_url: string;   // Git仓库URL
  main_branch: string;      // 主分支
  workspace_path: string;   // 工作空间路径
  technology_stack: string[]; // 技术栈
  status: string;           // 项目状态
  created_at: string;       // 创建时间 (RFC3339格式)
  updated_at: string;       // 更新时间 (RFC3339格式)
}

// 创建项目请求
export interface CreateProjectRequest {
  name: string;                      // 项目名称
  description?: string;              // 项目描述
  repository_url: string;           // Git仓库URL
  main_branch?: string;             // 主分支，默认为main
  workspace_path: string;           // 工作空间路径
  technology_stack?: string[];      // 技术栈
}

// 更新项目请求
export interface UpdateProjectRequest {
  project_id: string;               // 项目ID
  name?: string;                    // 项目名称
  description?: string;             // 项目描述
  repository_url?: string;          // Git仓库URL
  main_branch?: string;             // 主分支
  workspace_path?: string;          // 工作空间路径
  technology_stack?: string[];      // 技术栈
  status?: string;                  // 项目状态
}

// 项目查询参数
export interface ProjectQueryParams {
  project_id?: string;  // 项目ID
  user_id?: string;     // 用户ID
  name?: string;        // 项目名称
  status?: string;      // 项目状态
}

// 项目表单数据（用于创建和编辑）
export interface ProjectFormData {
  name: string;
  description: string;
  repository_url: string;
  main_branch: string;
  workspace_path: string;
  technology_stack: string[];
  status?: string;
}

// 项目统计信息
export interface ProjectStats {
  total: number;        // 总项目数
  active: number;       // 活跃项目数
  completed: number;    // 已完成项目数
  paused: number;       // 暂停项目数
}

// 常用技术栈选项
export const TECHNOLOGY_STACK_OPTIONS = [
  'React',
  'Vue.js',
  'Angular',
  'Node.js',
  'Express',
  'Koa',
  'Nest.js',
  'TypeScript',
  'JavaScript',
  'Python',
  'Django',
  'Flask',
  'Java',
  'Spring Boot',
  'Go',
  'Rust',
  'C++',
  'C#',
  '.NET',
  'PHP',
  'Laravel',
  'MySQL',
  'PostgreSQL',
  'MongoDB',
  'Redis',
  'Docker',
  'Kubernetes',
  'AWS',
  'Azure',
  'GCP',
] as const;

// 项目状态选项
export const PROJECT_STATUS_OPTIONS = [
  { value: ProjectStatus.PLANNING, label: '规划中', color: 'blue' },
  { value: ProjectStatus.ACTIVE, label: '进行中', color: 'green' },
  { value: ProjectStatus.PAUSED, label: '暂停', color: 'yellow' },
  { value: ProjectStatus.COMPLETED, label: '已完成', color: 'gray' },
  { value: ProjectStatus.ARCHIVED, label: '已归档', color: 'red' },
] as const;
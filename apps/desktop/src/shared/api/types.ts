// API 相关类型定义
import type { IpcError } from './client';

/**
 * API 响应包装类型
 */
export type ApiResponse<T> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      error: {
        code: string;
        message: string;
        details?: any;
      };
    };

/**
 * 请求状态
 */
export interface RequestState<T = any> {
  loading: boolean;
  error: IpcError | null;
  data: T | null;
}

/**
 * 分页请求参数
 */
export interface PaginationRequest {
  page: number;
  limit: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

/**
 * 分页响应
 */
export interface PaginationResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  has_next: boolean;
  has_prev: boolean;
}

/**
 * 搜索请求参数
 */
export interface SearchRequest extends PaginationRequest {
  query: string;
  filters?: Record<string, any>;
}

/**
 * 批量操作请求
 */
export interface BatchRequest<T = string> {
  ids: T[];
  action: string;
  params?: Record<string, any>;
}

/**
 * 批量操作响应
 */
export interface BatchResponse<T = any> {
  success_count: number;
  failure_count: number;
  results: Array<{
    id: string;
    success: boolean;
    data?: T;
    error?: string;
  }>;
}

/**
 * 文件上传请求
 */
export interface FileUploadRequest {
  file: File;
  path?: string;
  metadata?: Record<string, any>;
}

/**
 * 文件上传响应
 */
export interface FileUploadResponse {
  id: string;
  filename: string;
  size: number;
  mime_type: string;
  url: string;
  path: string;
}

/**
 * 健康检查响应
 */
export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  version: string;
  uptime: number;
  services: Record<string, 'up' | 'down'>;
}

/**
 * API 版本信息
 */
export interface ApiVersionInfo {
  version: string;
  build: string;
  commit: string;
  build_time: string;
}

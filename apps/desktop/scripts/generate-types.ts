#!/usr/bin/env tsx

import { execSync } from 'child_process';
import fs from 'fs/promises';
import path from 'path';

/**
 * 从 Rust crates 生成 TypeScript 类型定义
 * 基于 protocol-ts crate 实现自动类型映射
 */
async function generateTypes() {
  const projectRoot = path.join(__dirname, '../../..');
  const outputDir = path.join(__dirname, '../src/shared/types');
  const protocolDir = path.join(outputDir, 'protocol');

  console.log('🔄 正在生成 TypeScript 类型...');

  try {
    // 确保输出目录存在
    await fs.mkdir(protocolDir, { recursive: true });

    // 运行 protocol-ts 生成器
    console.log('📦 运行 protocol-ts 生成器...');
    const cmd = `cargo run --bin codex-protocol-ts -- --out "${protocolDir}" --prettier "${path.join(projectRoot, 'apps/desktop/node_modules/.bin/prettier')}"`;
    
    execSync(cmd, {
      cwd: path.join(projectRoot, 'crates/protocol-ts'),
      stdio: 'inherit',
    });

    // 生成基础类型文件
    await generateBaseTypes(outputDir);
    
    // 生成API类型文件
    await generateApiTypes(outputDir);
    
    // 生成UI类型文件
    await generateUiTypes(outputDir);

    console.log('✅ TypeScript 类型生成完成!');
    console.log(`📁 输出目录: ${outputDir}`);
    
  } catch (error) {
    console.error('❌ 类型生成失败:', error);
    process.exit(1);
  }
}

/**
 * 生成基础类型文件
 */
async function generateBaseTypes(outputDir: string) {
  const protocolContent = `// 从 Rust protocol 自动生成的类型
// 警告：此文件为自动生成，请勿手动修改！

// 重新导出从 protocol-ts 生成的所有类型
export * from './protocol';

// 基础类型定义
export interface Id {
  0: string;
}

export interface Timestamp {
  0: number;
}

// API 结果包装类型
export type ApiResult<T> = 
  | { success: true; data: T }
  | { success: false; error: ApiError };

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

// 分页类型
export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  has_next: boolean;
  has_prev: boolean;
}
`;

  await fs.writeFile(path.join(outputDir, 'protocol.ts'), protocolContent);
}

/**
 * 生成API相关类型
 */
async function generateApiTypes(outputDir: string) {
  const apiContent = `// API 相关类型定义
export interface IpcError extends Error {
  code: string;
  details?: any;
}

export interface RequestOptions {
  timeout?: number;
  retries?: number;
}

export interface ApiClient {
  invoke<T>(command: string, args?: Record<string, unknown>, options?: RequestOptions): Promise<T>;
}

// 通用 CRUD 操作类型
export interface CreateOperation<T, K = Omit<T, 'id' | 'created_at' | 'updated_at'>> {
  create(data: K): Promise<T>;
}

export interface ReadOperation<T> {
  getById(id: string): Promise<T>;
  getAll(): Promise<T[]>;
}

export interface UpdateOperation<T, K = Partial<Omit<T, 'id' | 'created_at'>>> {
  update(id: string, data: K): Promise<T>;
}

export interface DeleteOperation {
  delete(id: string): Promise<void>;
}

export interface CrudOperations<T, CreateData = any, UpdateData = any> 
  extends CreateOperation<T, CreateData>, 
          ReadOperation<T>, 
          UpdateOperation<T, UpdateData>, 
          DeleteOperation {}
`;

  await fs.writeFile(path.join(outputDir, 'api.ts'), apiContent);
}

/**
 * 生成UI相关类型
 */
async function generateUiTypes(outputDir: string) {
  const uiContent = `// UI 组件相关类型定义
import type { ReactNode } from 'react';

export interface ComponentProps {
  className?: string;
  children?: ReactNode;
}

export interface ListProps<T> extends ComponentProps {
  items: T[];
  loading?: boolean;
  error?: string;
  onItemClick?: (item: T) => void;
  onItemSelect?: (item: T) => void;
  selectedItem?: T;
}

export interface FormProps<T> extends ComponentProps {
  initialValues?: Partial<T>;
  onSubmit: (values: T) => void | Promise<void>;
  loading?: boolean;
  disabled?: boolean;
  resetOnSubmit?: boolean;
}

export interface TableColumn<T> {
  key: keyof T;
  title: string;
  render?: (value: T[keyof T], record: T) => ReactNode;
  width?: string;
  sortable?: boolean;
  filterable?: boolean;
}

export interface TableProps<T> extends ComponentProps {
  data: T[];
  columns: TableColumn<T>[];
  loading?: boolean;
  error?: string;
  onRowClick?: (record: T) => void;
  actions?: (record: T) => ReactNode;
  pagination?: {
    current: number;
    total: number;
    pageSize: number;
    onChange: (page: number) => void;
  };
}

export interface DialogProps extends ComponentProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
}

export interface LoadingState {
  loading: boolean;
  error?: string;
}

export interface AsyncState<T> extends LoadingState {
  data?: T;
}

// 主题相关类型
export type Theme = 'light' | 'dark' | 'system';

export interface ThemeState {
  theme: Theme;
  isDark: boolean;
  setTheme: (theme: Theme) => void;
}
`;

  await fs.writeFile(path.join(outputDir, 'ui.ts'), uiContent);
}

// 运行生成器
if (require.main === module) {
  generateTypes();
}

export { generateTypes };
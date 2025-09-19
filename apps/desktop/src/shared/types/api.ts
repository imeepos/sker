// API 相关类型定义

export interface IpcError extends Error {
  code: string;
  details?: any;
}

export interface RequestOptions {
  timeout?: number;
  retries?: number;
}

export interface ApiClient {
  invoke<T>(
    command: string,
    args?: Record<string, unknown>,
    options?: RequestOptions
  ): Promise<T>;
}

// 通用 CRUD 操作类型
export interface CreateOperation<
  T,
  K = Omit<T, 'id' | 'created_at' | 'updated_at'>,
> {
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

// UI 组件相关类型定义
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

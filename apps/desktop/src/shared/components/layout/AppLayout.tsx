// 应用主布局组件
import React from 'react';
import { cn } from '@/shared/utils/cn';
import { useAppStore, appSelectors } from '@/shared/stores/app';
import type { ComponentProps } from '@/shared/types';

interface AppLayoutProps extends ComponentProps {
  sidebar?: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
}

export function AppLayout({
  children,
  sidebar,
  header,
  footer,
  className,
}: AppLayoutProps) {
  const sidebarCollapsed = useAppStore(appSelectors.sidebarCollapsed);

  return (
    <div
      className={cn('flex h-screen bg-background text-foreground', className)}
    >
      {/* 侧边栏 */}
      {sidebar && (
        <aside
          className={cn(
            'border-r border-border bg-card transition-all duration-300',
            sidebarCollapsed ? 'w-16' : 'w-64'
          )}
        >
          {sidebar}
        </aside>
      )}

      {/* 主内容区 */}
      <div className='flex flex-1 flex-col overflow-hidden'>
        {/* 头部 */}
        {header && (
          <header className='border-b border-border bg-card px-6 py-4'>
            {header}
          </header>
        )}

        {/* 内容区 */}
        <main className='flex-1 overflow-auto'>{children}</main>

        {/* 底部 */}
        {footer && (
          <footer className='border-t border-border bg-card px-6 py-4'>
            {footer}
          </footer>
        )}
      </div>
    </div>
  );
}

/**
 * 内容容器组件
 */
interface ContentContainerProps extends ComponentProps {
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function ContentContainer({
  children,
  maxWidth = 'full',
  padding = 'md',
  className,
}: ContentContainerProps) {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    full: 'max-w-full',
  };

  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <div
      className={cn(
        'mx-auto w-full',
        maxWidthClasses[maxWidth],
        paddingClasses[padding],
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * 页面头部组件
 */
interface PageHeaderProps extends ComponentProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export function PageHeader({
  title,
  description,
  actions,
  className,
  children,
}: PageHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between', className)}>
      <div className='min-w-0 flex-1'>
        <h1 className='text-2xl font-bold tracking-tight text-foreground'>
          {title}
        </h1>
        {description && (
          <p className='mt-1 text-sm text-muted-foreground'>{description}</p>
        )}
        {children}
      </div>

      {actions && (
        <div className='ml-4 flex items-center space-x-2'>{actions}</div>
      )}
    </div>
  );
}

/**
 * 卡片容器组件
 */
interface CardContainerProps extends ComponentProps {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function CardContainer({
  title,
  description,
  actions,
  padding = 'md',
  children,
  className,
}: CardContainerProps) {
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <div
      className={cn(
        'rounded-lg border border-border bg-card shadow-sm',
        className
      )}
    >
      {(title || description || actions) && (
        <div className={cn('border-b border-border', paddingClasses[padding])}>
          <div className='flex items-center justify-between'>
            <div>
              {title && (
                <h3 className='text-lg font-semibold text-card-foreground'>
                  {title}
                </h3>
              )}
              {description && (
                <p className='mt-1 text-sm text-muted-foreground'>
                  {description}
                </p>
              )}
            </div>
            {actions && <div className='ml-4'>{actions}</div>}
          </div>
        </div>
      )}

      <div className={cn(paddingClasses[padding])}>{children}</div>
    </div>
  );
}

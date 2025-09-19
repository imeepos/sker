// 错误边界组件
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/shared/components/ui/Button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

/**
 * 错误边界状态
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

/**
 * 错误边界属性
 */
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, retry: () => void) => ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

/**
 * 默认错误展示组件
 */
interface DefaultErrorFallbackProps {
  error: Error;
  retry: () => void;
}

function DefaultErrorFallback({ error, retry }: DefaultErrorFallbackProps) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4 p-8">
      <div className="flex items-center space-x-2 text-destructive">
        <AlertTriangle className="h-6 w-6" />
        <h2 className="text-xl font-semibold">出现错误</h2>
      </div>
      
      <div className="max-w-md text-center">
        <p className="text-muted-foreground mb-4">
          应用运行时出现了错误，请尝试刷新页面或联系技术支持。
        </p>
        
        {typeof window !== 'undefined' && import.meta.env.DEV && (
          <details className="text-left">
            <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
              查看错误详情
            </summary>
            <pre className="mt-2 whitespace-pre-wrap rounded bg-muted p-2 text-xs">
              {error.message}
            </pre>
          </details>
        )}
      </div>

      <div className="flex space-x-2">
        <Button onClick={retry} variant="default">
          <RefreshCw className="mr-2 h-4 w-4" />
          重试
        </Button>
        <Button 
          onClick={() => window.location.reload()} 
          variant="outline"
        >
          刷新页面
        </Button>
      </div>
    </div>
  );
}

/**
 * 错误边界组件
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // 更新状态，使下次渲染能够显示降级后的 UI
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 记录错误信息
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // 调用外部错误处理函数
    this.props.onError?.(error, errorInfo);
  }

  /**
   * 重试函数 - 重置错误状态
   */
  retry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      // 如果有自定义错误展示组件，使用自定义组件
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.retry);
      }

      // 使用默认错误展示组件
      return <DefaultErrorFallback error={this.state.error} retry={this.retry} />;
    }

    // 正常渲染子组件
    return this.props.children;
  }
}

/**
 * 带错误边界的高阶组件
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}

/**
 * 异步边界组件 - 用于处理异步组件的错误
 */
interface AsyncErrorBoundaryProps extends ErrorBoundaryProps {
  /** 是否重置异步状态 */
  resetOnRetry?: boolean;
}

export function AsyncErrorBoundary({ 
  resetOnRetry = true, 
  ...props 
}: AsyncErrorBoundaryProps) {
  return <ErrorBoundary {...props} />;
}
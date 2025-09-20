import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface ErrorInfo {
  componentStack: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  fallback?: React.ComponentType<{
    error: Error;
    errorInfo: ErrorInfo;
    resetError: () => void;
  }>;
}

/**
 * 错误边界组件
 * 捕获React组件树中的JavaScript错误并显示友好的错误界面
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo: {
        componentStack: errorInfo.componentStack || '',
      },
    });

    // 调用外部错误处理器
    this.props.onError?.(error, {
      componentStack: errorInfo.componentStack || '',
    });
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError && this.state.error && this.state.errorInfo) {
      // 如果提供了自定义错误UI，使用它
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return (
          <FallbackComponent
            error={this.state.error}
            errorInfo={this.state.errorInfo}
            resetError={this.resetError}
          />
        );
      }

      // 默认错误UI
      return <DefaultErrorFallback error={this.state.error} resetError={this.resetError} />;
    }

    return this.props.children;
  }
}

/**
 * 默认错误回退UI
 */
interface DefaultErrorFallbackProps {
  error: Error;
  resetError: () => void;
}

function DefaultErrorFallback({ error, resetError }: DefaultErrorFallbackProps) {
  const isDevelopment = process.env.NODE_ENV === 'development';

  const handleReload = () => {
    window.location.reload();
  };

  const handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        {/* 错误图标 */}
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
        </div>

        {/* 错误标题和描述 */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            出现了一些问题
          </h2>
          <p className="text-gray-600 mb-6">
            应用程序遇到了意外错误，我们已经记录了这个问题。
          </p>
        </div>

        {/* 开发环境下显示错误详情 */}
        {isDevelopment && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-left">
            <h3 className="text-sm font-semibold text-red-800 mb-2">错误详情（开发模式）</h3>
            <div className="text-xs text-red-700 font-mono bg-red-100 p-2 rounded overflow-auto max-h-32">
              <div className="whitespace-pre-wrap">{error.message}</div>
              {error.stack && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-red-600 hover:text-red-800">
                    查看堆栈跟踪
                  </summary>
                  <div className="mt-1 whitespace-pre-wrap text-xs">
                    {error.stack}
                  </div>
                </details>
              )}
            </div>
          </div>
        )}

        {/* 操作按钮 */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={resetError}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            重试
          </button>
          
          <button
            onClick={handleReload}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            刷新页面
          </button>

          <button
            onClick={handleGoHome}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Home className="w-4 h-4 mr-2" />
            返回首页
          </button>
        </div>

        {/* 帮助信息 */}
        <div className="text-xs text-gray-500">
          如果问题持续存在，请联系技术支持团队。
        </div>
      </div>
    </div>
  );
}
import { useState } from 'react'
import { Input } from './Input'
import { cn } from '@/shared/utils'
import { isValidGitUrl, getGitUrlExamples, parseGitUrl } from '@/shared/utils/git'

interface GitUrlInputProps {
  value: string
  onChange: (url: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  error?: string
  showExamples?: boolean
}

/**
 * Git 仓库 URL 输入组件
 * 支持 HTTPS 和 SSH 格式的验证和提示
 */
export function GitUrlInput({
  value,
  onChange,
  placeholder = '输入 Git 仓库地址',
  className,
  disabled = false,
  error,
  showExamples = true
}: GitUrlInputProps) {
  const [showSuggestions, setShowSuggestions] = useState(false)
  const examples = getGitUrlExamples()

  // 解析当前 URL 获取仓库信息
  const repoInfo = value ? parseGitUrl(value) : null
  const isValid = value ? isValidGitUrl(value) : true

  return (
    <div className={cn('space-y-2', className)}>
      <div className="relative">
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            error && 'border-red-300 focus:border-red-500 focus:ring-red-500',
            !isValid && value && 'border-yellow-300 focus:border-yellow-500 focus:ring-yellow-500'
          )}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
        />
        
        {/* 验证状态指示器 */}
        {value && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            {isValid ? (
              <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            )}
          </div>
        )}
      </div>

      {/* 错误信息 */}
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {/* 格式提示 */}
      {!isValid && value && !error && (
        <p className="text-sm text-yellow-600">
          请检查 Git 仓库地址格式，支持 HTTPS、SSH 等格式
        </p>
      )}

      {/* 仓库信息显示 */}
      {repoInfo && isValid && (
        <div className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded">
          <span className="font-medium">仓库信息：</span>
          <span className="ml-1">{repoInfo.fullName}</span>
          <span className="ml-2 text-gray-500">({repoInfo.protocol?.toUpperCase()})</span>
        </div>
      )}

      {/* 示例建议 */}
      {showExamples && showSuggestions && !value && (
        <div className="border border-gray-200 rounded-md bg-white shadow-sm max-h-48 overflow-y-auto">
          <div className="p-2 text-xs font-medium text-gray-700 bg-gray-50 border-b">
            常用格式示例
          </div>
          {examples.map((example, index) => (
            <button
              key={index}
              type="button"
              onClick={() => {
                onChange(example)
                setShowSuggestions(false)
              }}
              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 focus:bg-gray-50 border-b last:border-b-0"
            >
              <code className="text-gray-800">{example}</code>
            </button>
          ))}
        </div>
      )}

      {/* 格式说明 */}
      {showExamples && !showSuggestions && (
        <div className="text-xs text-gray-500">
          <p className="mb-1">支持的格式：</p>
          <ul className="space-y-0.5 ml-2">
            <li>• HTTPS: <code className="text-gray-600">https://github.com/user/repo.git</code></li>
            <li>• SSH: <code className="text-gray-600">git@github.com:user/repo.git</code></li>
            <li>• SSH URL: <code className="text-gray-600">ssh://git@github.com/user/repo.git</code></li>
          </ul>
        </div>
      )}
    </div>
  )
}

export { GitUrlInput as default }
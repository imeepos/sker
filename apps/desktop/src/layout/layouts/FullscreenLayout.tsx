import { ReactNode } from 'react'
import { BaseLayout } from '../BaseLayout'

interface FullscreenLayoutProps {
  /** 自定义样式类名 */
  className?: string
  /** 是否显示左侧导航栏 */
  showNavigation?: boolean
  /** 主要内容 */
  children: ReactNode
}

/**
 * 全屏布局 - 适用于不需要侧边栏的页面
 * 
 * 使用场景：
 * - 设置页面
 * - 登录页面
 * - 欢迎页面
 * - 其他需要全屏展示的页面
 */
export function FullscreenLayout({
  className,
  showNavigation = true,
  children
}: FullscreenLayoutProps) {
  return (
    <BaseLayout
      className={className}
      showNavigation={showNavigation}
      sidebar={null}
    >
      {children}
    </BaseLayout>
  )
}
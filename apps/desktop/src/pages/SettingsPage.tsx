import { FullscreenLayout } from '../layout/layouts'
import { DefaultPage } from '../layout/DefaultPage'

/**
 * 设置页面 - 使用FullscreenLayout布局（无侧边栏）
 * 
 * 演示了页面如何自主决定布局方式
 */
export function SettingsPage() {
  return (
    <FullscreenLayout showNavigation={true}>
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">设置页面</h2>
          <p className="text-muted-foreground mb-4">
            这个页面使用了FullscreenLayout，占用全部可用空间
          </p>
          <DefaultPage />
        </div>
      </div>
    </FullscreenLayout>
  )
}
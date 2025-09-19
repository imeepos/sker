import { useLocation } from 'react-router-dom'

/**
 * 默认页面组件 - 用于显示开发中的功能页面
 */
export function DefaultPage() {
  const location = useLocation()
  
  // 根据路由路径获取功能名称
  const getFeatureName = (): string => {
    const pathSegments = location.pathname.split('/').filter(Boolean)
    const feature = pathSegments[0] || 'unknown'
    
    const featureNames: Record<string, string> = {
      'calendar': '日历',
      'cloud-docs': '云文档',
      'tables': '多维表格',
      'video-meeting': '视频会议',
      'workbench': '工作台',
      'contacts': '通讯录',
      'ai-assistant': 'AI助手',
      'community': '社区',
      'settings': '设置'
    }
    
    return featureNames[feature] || feature
  }

  return (
    <div className="h-full flex items-center justify-center text-muted-foreground">
      <div className="text-center">
        <h3 className="font-medium mb-2">{getFeatureName()}</h3>
        <p className="text-sm">该功能界面正在开发中</p>
        <p className="text-xs mt-2 opacity-60">路由: {location.pathname}</p>
      </div>
    </div>
  )
}
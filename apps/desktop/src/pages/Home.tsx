import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { SettingsDialog } from '../components/settings'
import { useAuth } from '../components/auth'
import { useSettingsStore } from '../stores/settings'
import { useChatStore } from '../stores/chat'
import { Bot, LogOut, User } from 'lucide-react'
import { checkForAppUpdatesQuiet } from '../lib/updater'


export function Home() {
  const { user, logout } = useAuth()
  const { loadConversations } = useChatStore()
  const { loadSettings } = useSettingsStore()

  useEffect(() => {
    loadConversations()
    loadSettings()
    
    const updateCheckTimer = setTimeout(async () => {
      try {
        await checkForAppUpdatesQuiet()
      } catch (error) {
        console.error('自动更新检查失败:', error)
      }
    }, 3000)
    
    return () => {
      clearTimeout(updateCheckTimer)
    }
  }, [loadConversations, loadSettings])

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* 顶部标题栏 */}
      <header className="shrink-0 border-b bg-card">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Bot className="w-6 h-6 text-primary" />
            <h1 className="font-semibold text-lg">Sker Code Assistant</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 mr-4">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {user?.username}
              </span>
            </div>

            <Button 
              variant="ghost" 
              size="icon"
              onClick={logout}
              title="注销"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* 主要内容区域 - 现在由路由组件自己决定布局 */}
      <div className="flex-1 overflow-hidden">
        <Outlet />
      </div>

      {/* 设置对话框 */}
      <SettingsDialog />
    </div>
  )
}
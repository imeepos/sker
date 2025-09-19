import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { DefaultPage, FullscreenLayout } from './layout'
import { ProjectManagementPage } from './components/multi-agent/Project/ProjectManagementPage'
import { AuthProvider, AuthGuard } from './components/auth'
import { Home, MessagesPage, AgentsPage, SettingsPage } from './pages'
// 导入全局清理工具 - 确保在应用启动时清理旧的监听器
import './utils/globalCleanup'

// 主应用组件，仅负责路由配置和认证
function App() {
  return (
    <Router>
      <AuthProvider>
        <AuthGuard>
          <Routes>
            <Route path="/" element={<Home />}>
              {/* 默认重定向到消息页面 */}
              <Route index element={<Navigate to="/messages" replace />} />
              
              {/* 消息相关路由 - 使用带侧边栏的布局 */}
              <Route path="messages" element={<MessagesPage />} />
              <Route path="messages/:conversationId" element={<MessagesPage />} />
              
              {/* Agent管理路由 - 使用带侧边栏的布局 */}
              <Route path="agents" element={<AgentsPage />} />
              <Route path="agents/:agentId" element={<AgentsPage />} />
              
              {/* 项目管理路由 - 使用带侧边栏的布局 */}
              <Route path="project-management" element={
                <FullscreenLayout>
                  <ProjectManagementPage />
                </FullscreenLayout>
              } />
              <Route path="project-management/:projectId" element={
                <FullscreenLayout>
                  <ProjectManagementPage />
                </FullscreenLayout>
              } />
              
              {/* 设置页面 - 使用全屏布局 */}
              <Route path="settings" element={<SettingsPage />} />
              
              {/* 其他功能路由 - 使用全屏布局 */}
              <Route path="calendar" element={
                <FullscreenLayout>
                  <DefaultPage />
                </FullscreenLayout>
              } />
              <Route path="cloud-docs" element={
                <FullscreenLayout>
                  <DefaultPage />
                </FullscreenLayout>
              } />
              <Route path="tables" element={
                <FullscreenLayout>
                  <DefaultPage />
                </FullscreenLayout>
              } />
              <Route path="video-meeting" element={
                <FullscreenLayout>
                  <DefaultPage />
                </FullscreenLayout>
              } />
              <Route path="workbench" element={
                <FullscreenLayout>
                  <DefaultPage />
                </FullscreenLayout>
              } />
              <Route path="contacts" element={
                <FullscreenLayout>
                  <DefaultPage />
                </FullscreenLayout>
              } />
              <Route path="ai-assistant" element={
                <FullscreenLayout>
                  <DefaultPage />
                </FullscreenLayout>
              } />
              <Route path="community" element={
                <FullscreenLayout>
                  <DefaultPage />
                </FullscreenLayout>
              } />
            </Route>
            {/* 未匹配的路由重定向到根路径 */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthGuard>
      </AuthProvider>
    </Router>
  )
}

export default App

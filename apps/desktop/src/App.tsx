import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { DefaultPage } from './layout'
import { ProjectManagementPage } from './components/multi-agent/Project/ProjectManagementPage'
import { AuthProvider, AuthGuard } from './components/auth'
import { Home, AgentsWrapper, MessagesWrapper } from './pages'
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
              {/* 消息相关路由 */}
              <Route path="messages" element={<MessagesWrapper />} />
              <Route path="messages/:conversationId" element={<MessagesWrapper />} />
              {/* 项目管理路由 */}
              <Route path="project-management" element={<ProjectManagementPage />} />
              {/* Agent管理路由 */}
              <Route path="agents" element={<AgentsWrapper />} />
              <Route path="agents/:agentId" element={<AgentsWrapper />} />
              {/* 其他功能路由 */}
              <Route path="calendar" element={<DefaultPage />} />
              <Route path="cloud-docs" element={<DefaultPage />} />
              <Route path="tables" element={<DefaultPage />} />
              <Route path="video-meeting" element={<DefaultPage />} />
              <Route path="workbench" element={<DefaultPage />} />
              <Route path="contacts" element={<DefaultPage />} />
              <Route path="ai-assistant" element={<DefaultPage />} />
              <Route path="community" element={<DefaultPage />} />
              <Route path="settings" element={<DefaultPage />} />
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

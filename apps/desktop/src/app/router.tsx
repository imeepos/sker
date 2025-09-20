import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '../shared/components/layout/AppLayout';
import { ProtectedRoute } from '../shared/components/auth';
import {
  Dashboard,
  Projects,
  Agents,
  Tasks,
  Conversations,
  Reviews,
  Conflicts,
  Monitoring,
  Settings,
  Login,
  Profile,
} from '../pages';

/**
 * 应用路由配置
 * 基于v3方案设计的路由结构，严格对应后端实体
 */
export const router = createBrowserRouter([
  // 登录页面（不需要认证）
  {
    path: '/login',
    element: <Login />,
  },
  // 受保护的主应用路由
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      // 默认重定向到工作台
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      // 工作台 - 概览和快速操作入口
      {
        path: 'dashboard',
        element: <Dashboard />,
      },
      // 项目管理 - 对应 Project + RequirementDocument
      {
        path: 'projects',
        element: <Projects />,
      },
      // 智能体管理 - 对应 Agent + AgentWorkHistory + AgentPerformanceMetrics  
      {
        path: 'agents',
        element: <Agents />,
      },
      // 任务中心 - 对应 Task + TaskDependency + ExecutionSession + ExecutionLog
      {
        path: 'tasks',
        element: <Tasks />,
      },
      // 协同对话 - 对应 LlmSession + LlmConversation + EventMsg
      {
        path: 'conversations',
        element: <Conversations />,
      },
      // 代码审查 - 对应 CodeReview
      {
        path: 'reviews',
        element: <Reviews />,
      },
      // 冲突处理 - 对应 Conflict + HumanDecision
      {
        path: 'conflicts',
        element: <Conflicts />,
      },
      // 监控中心 - 对应 DomainEvent + EventPublishLog
      {
        path: 'monitoring',
        element: <Monitoring />,
      },
      // 系统设置 - 对应 AppSettings + McpServerConfig + User
      {
        path: 'settings',
        element: <Settings />,
      },
      // 个人中心 - 用户信息管理
      {
        path: 'profile',
        element: <Profile />,
      },
    ],
  },
  // 404 处理
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />,
  },
]);
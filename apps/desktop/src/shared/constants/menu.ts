import {
  Home,
  FolderOpen,
  Bot,
  CheckSquare,
  MessageSquare,
  GitPullRequest,
  AlertTriangle,
  Activity,
  Settings,
  LucideIcon,
} from 'lucide-react';

/**
 * 菜单项接口定义
 */
export interface MenuItem {
  id: string;
  title: string;
  icon: LucideIcon;
  path: string;
  description: string;
  badge?: string | number;
  permission?: string[];
  submenus?: SubMenuItem[];
}

/**
 * 子菜单项接口定义
 */
export interface SubMenuItem {
  id: string;
  title: string;
  path: string;
  description?: string;
  permission?: string[];
}

/**
 * 主菜单配置
 * 基于后端实体模型设计的一级菜单
 */
export const MAIN_MENU_ITEMS: MenuItem[] = [
  {
    id: 'dashboard',
    title: '工作台',
    icon: Home,
    path: '/dashboard',
    description: '概览和快速操作入口',
  },
  {
    id: 'projects',
    title: '项目管理',
    icon: FolderOpen,
    path: '/projects',
    description: '项目和需求文档管理',
  },
  {
    id: 'agents',
    title: '智能体',
    icon: Bot,
    path: '/agents',
    description: 'AI Agent管理和配置',
    badge: '核心',
  },
  {
    id: 'tasks',
    title: '任务中心',
    icon: CheckSquare,
    path: '/tasks',
    description: '任务分配和进度跟踪',
  },
  {
    id: 'conversations',
    title: '协同对话',
    icon: MessageSquare,
    path: '/conversations',
    description: '与AI Agent的交互对话',
  },
  {
    id: 'reviews',
    title: '代码审查',
    icon: GitPullRequest,
    path: '/reviews',
    description: '代码质量审查和反馈',
  },
  {
    id: 'conflicts',
    title: '冲突处理',
    icon: AlertTriangle,
    path: '/conflicts',
    description: '冲突检测和人工决策',
  },
  {
    id: 'monitoring',
    title: '监控中心',
    icon: Activity,
    path: '/monitoring',
    description: '系统事件和性能监控',
  },
  {
    id: 'settings',
    title: '系统设置',
    icon: Settings,
    path: '/settings',
    description: '应用配置和个人设置',
  },
];

/**
 * 根据路径获取菜单项
 */
export function getMenuItemByPath(pathname: string): MenuItem | undefined {
  return MAIN_MENU_ITEMS.find(item => 
    pathname.startsWith(item.path)
  );
}

/**
 * 获取菜单项的显示标题
 */
export function getMenuTitle(pathname: string): string {
  // 特殊页面标题映射
  const specialTitles: Record<string, string> = {
    '/profile': '个人中心',
  };
  
  if (specialTitles[pathname]) {
    return specialTitles[pathname];
  }
  
  const menuItem = getMenuItemByPath(pathname);
  return menuItem?.title || 'Codex';
}
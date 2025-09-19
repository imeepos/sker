// 应用根组件
import {
  AppLayout,
  PageHeader,
  ContentContainer,
} from '@/shared/components/layout';
import { Button } from '@/shared/components/ui';
import { useAppStore, appSelectors } from '@/shared/stores/app';
import { Providers } from './providers';

/**
 * 应用内容组件
 */
function AppContent() {
  const { toggleSidebar, setTheme, addNotification } = useAppStore();
  const theme = useAppStore(appSelectors.theme);
  const notifications = useAppStore(appSelectors.notifications);

  const handleThemeToggle = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    addNotification({
      type: 'success',
      title: '主题已切换',
      message: `已切换到${newTheme === 'light' ? '浅色' : '深色'}模式`,
    });
  };

  const handleNotificationTest = () => {
    addNotification({
      type: 'info',
      title: '测试通知',
      message: '这是一个测试通知消息',
    });
  };

  return (
    <AppLayout
      sidebar={
        <div className='flex h-full flex-col p-4'>
          <h2 className='mb-4 text-lg font-semibold'>导航菜单</h2>
          <nav className='space-y-2'>
            <Button variant='ghost' className='w-full justify-start'>
              首页
            </Button>
            <Button variant='ghost' className='w-full justify-start'>
              聊天
            </Button>
            <Button variant='ghost' className='w-full justify-start'>
              智能体
            </Button>
            <Button variant='ghost' className='w-full justify-start'>
              设置
            </Button>
          </nav>
        </div>
      }
      header={
        <PageHeader
          title='Codex Desktop'
          description='基于 v2.0 架构的桌面应用'
          actions={
            <div className='space-x-2'>
              <Button variant='outline' onClick={toggleSidebar}>
                切换侧边栏
              </Button>
              <Button variant='outline' onClick={handleThemeToggle}>
                切换主题 ({theme})
              </Button>
            </div>
          }
        />
      }
    >
      <ContentContainer>
        <div className='space-y-6'>
          <section>
            <h2 className='mb-4 text-xl font-semibold'>欢迎使用 Codex</h2>
            <p className='text-muted-foreground'>
              这是基于 v2.0 架构搭建的桌面应用基础框架。
              所有的基础设施已经就绪，包括类型系统、状态管理、UI组件库等。
            </p>
          </section>

          <section>
            <h3 className='mb-2 text-lg font-semibold'>架构特性</h3>
            <ul className='space-y-1 text-sm text-muted-foreground'>
              <li>✅ 统一的目录结构 (shared/features/app/pages)</li>
              <li>✅ TypeScript 类型安全</li>
              <li>✅ shadcn/ui 组件库</li>
              <li>✅ Zustand 状态管理</li>
              <li>✅ React Query 数据管理</li>
              <li>✅ Tailwind CSS 样式系统</li>
              <li>✅ ESLint/Prettier 代码规范</li>
              <li>✅ Vitest 测试框架</li>
            </ul>
          </section>

          <section>
            <h3 className='mb-2 text-lg font-semibold'>功能测试</h3>
            <div className='space-x-2'>
              <Button onClick={handleNotificationTest}>测试通知系统</Button>
              <Button variant='secondary'>secondary 按钮</Button>
              <Button variant='outline'>outline 按钮</Button>
            </div>
          </section>

          {notifications.length > 0 && (
            <section>
              <h3 className='mb-2 text-lg font-semibold'>通知列表</h3>
              <div className='space-y-2'>
                {notifications.map(notification => (
                  <div
                    key={notification.id}
                    className='rounded border border-border bg-card p-3'
                  >
                    <div className='font-medium'>{notification.title}</div>
                    {notification.message && (
                      <div className='text-sm text-muted-foreground'>
                        {notification.message}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </ContentContainer>
    </AppLayout>
  );
}

/**
 * 应用根组件
 */
export default function App() {
  return (
    <Providers>
      <AppContent />
    </Providers>
  );
}

# 布局系统重构说明

## 重构背景

原有的`AppLayout`强制所有页面使用固定的三栏布局（左导航 + 中间栏 + 右内容区），这种设计过于死板，不能满足不同页面的个性化布局需求。

## 新的布局系统

### 1. BaseLayout - 基础布局组件

`BaseLayout`是新布局系统的核心，提供灵活的配置选项：

```typescript
<BaseLayout
  showNavigation={true}  // 是否显示左侧导航栏
  sidebar={<SidebarComponent />}  // 可选的中间侧边栏
>
  <MainContent />  // 主要内容区域
</BaseLayout>
```

### 2. 专用布局组件

#### MessagesLayout - 消息页面布局
- 左侧导航栏 + 对话列表侧边栏 + 消息内容区
- 用于需要对话列表的页面

#### AgentsLayout - Agent管理布局  
- 左侧导航栏 + Agent列表侧边栏 + Agent详情区
- 用于Agent管理相关页面

#### FullscreenLayout - 全屏布局
- 可选左侧导航栏 + 全屏内容区
- 用于设置页面、登录页面等不需要侧边栏的页面

### 3. 页面自主决定布局

现在每个页面组件可以根据自身需求选择合适的布局：

```typescript
// 消息页面 - 需要对话列表
export function MessagesPage() {
  return (
    <MessagesLayout conversations={...} onCreateConversation={...}>
      <MessageContent />
    </MessagesLayout>
  )
}

// 设置页面 - 不需要侧边栏
export function SettingsPage() {
  return (
    <FullscreenLayout>
      <SettingsContent />
    </FullscreenLayout>
  )
}
```

## 布局选择指南

| 页面类型 | 推荐布局 | 说明 |
|---------|---------|------|
| 消息/聊天 | MessagesLayout | 需要对话列表侧边栏 |
| Agent管理 | AgentsLayout | 需要Agent列表侧边栏 |
| 设置页面 | FullscreenLayout | 需要最大化内容区域 |
| 登录页面 | FullscreenLayout (showNavigation=false) | 完全全屏 |
| 项目管理 | FullscreenLayout | 复杂界面需要更多空间 |
| 其他功能页面 | FullscreenLayout | 根据具体需求决定 |

## 迁移指南

### 从旧版AppLayout迁移

旧版代码：
```typescript
// 所有页面都被强制套在AppLayout里
<AppLayout conversations={...}>
  <Outlet /> // 页面内容通过路由渲染
</AppLayout>
```

新版代码：
```typescript
// 页面组件内部决定布局方式
export function MyPage() {
  return (
    <MessagesLayout conversations={...}>
      <MyPageContent />
    </MessagesLayout>
  )
}
```

### 路由配置更新

旧版路由：
```typescript
<Route path="/" element={<Home />}>
  <Route path="messages" element={<MessagesWrapper />} />
</Route>
```

新版路由：
```typescript
<Route path="/" element={<Home />}>
  <Route path="messages" element={<MessagesPage />} />
</Route>
```

## 优势

1. **灵活性**: 页面可以根据需求选择最合适的布局方式
2. **复用性**: 不同布局组件可以在多个页面间复用
3. **可维护性**: 布局逻辑分离，易于维护和扩展
4. **性能**: 避免不必要的侧边栏渲染
5. **用户体验**: 不同页面有最适合的布局，提升使用体验

## 向后兼容

旧版的`AppLayout`仍然保留，确保现有代码不会立即破坏。建议逐步迁移到新的布局系统。
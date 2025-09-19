# 项目管理组件

这个目录包含了多Agent协同开发系统的项目管理相关组件。

## 组件概览

### 1. ProjectCard 项目状态展示卡片
- **文件**: `ProjectCard.tsx`
- **功能**: 显示项目基本信息、进度、参与Agent和技术栈
- **特性**:
  - 响应式设计，支持选中状态
  - 实时进度条显示
  - 项目统计信息展示
  - Agent头像组展示
  - 技术栈标签显示

### 2. ProjectList 项目列表容器
- **文件**: `ProjectList.tsx`
- **功能**: 项目列表展示和管理
- **特性**:
  - 搜索和筛选功能
  - 多种视图模式（网格/列表）
  - 排序功能
  - 状态统计
  - 分页支持

### 3. useProjects Hook 项目数据管理
- **文件**: `../../../hooks/useProjects.ts`
- **功能**: 项目数据的状态管理和API调用
- **特性**:
  - 增删改查操作
  - 实时事件监听
  - 错误处理
  - 缓存管理
  - 统计信息计算

### 4. ProjectCreationWizard 多步骤项目创建向导
- **文件**: `ProjectCreationWizard.tsx`
- **功能**: 引导用户完成项目创建流程
- **特性**:
  - 5步向导流程
  - 表单验证
  - 进度指示
  - 错误处理
  - 数据持久化

### 5. RequirementUploader 需求文档上传
- **文件**: `RequirementUploader.tsx`
- **功能**: 处理需求文档的上传和解析
- **特性**:
  - 拖拽上传
  - 多文件格式支持
  - 文件验证
  - 进度显示
  - 内容提取

### 6. ProjectDetails 项目详细信息展示
- **文件**: `ProjectDetails.tsx`
- **功能**: 展示项目的完整详细信息
- **特性**:
  - 项目概览
  - 统计指标
  - Agent管理
  - 技术栈展示
  - 质量门禁信息
  - 项目时间线

### 7. TechnologyStackSelector 技术栈选择器
- **文件**: `TechnologyStackSelector.tsx`
- **功能**: 技术栈选择和管理
- **特性**:
  - 分类展示
  - 搜索功能
  - 多选支持
  - 自定义技术添加
  - 流行技术标识

## 技术实现

### 依赖库
- React 19.1 - UI框架
- TypeScript - 类型安全
- Tailwind CSS - 样式框架
- Radix UI/Shadcn - UI组件库
- Lucide React - 图标库
- Zustand - 状态管理

### 设计模式
- **组合组件模式**: 使用复合组件提高复用性
- **Hook模式**: 分离逻辑和UI，提高可测试性
- **状态管理**: 使用Zustand进行集中式状态管理
- **事件驱动**: 基于事件的实时更新机制

### 文件结构
```
Project/
├── ProjectCard.tsx           # 项目卡片组件
├── ProjectList.tsx           # 项目列表组件  
├── ProjectDetails.tsx        # 项目详情组件
├── ProjectCreationWizard.tsx # 项目创建向导
├── RequirementUploader.tsx   # 需求文档上传器
├── TechnologyStackSelector.tsx # 技术栈选择器
├── index.ts                  # 组件导出
└── README.md                 # 说明文档
```

## 使用示例

### 基本用法
```tsx
import { 
  ProjectList, 
  ProjectCard, 
  ProjectDetails,
  ProjectCreationWizard 
} from '@/components/multi-agent/Project'
import { useProjects } from '@/hooks/useProjects'

function ProjectManagement() {
  const { 
    projects, 
    selectedProject, 
    createProject,
    selectProject 
  } = useProjects()

  return (
    <div className="flex h-full">
      <ProjectList
        projects={projects}
        selectedProjectId={selectedProject?.id}
        onProjectSelect={selectProject}
        onCreateProject={() => setShowWizard(true)}
      />
      
      {selectedProject && (
        <ProjectDetails project={selectedProject} />
      )}
      
      <ProjectCreationWizard
        open={showWizard}
        onClose={() => setShowWizard(false)}
        onComplete={createProject}
      />
    </div>
  )
}
```

### 自定义用法
```tsx
// 自定义项目卡片
<ProjectCard
  project={project}
  isSelected={selected}
  onClick={handleSelect}
  showProgress={true}
  showTeam={true}
  className="custom-project-card"
/>

// 自定义技术栈选择器
<TechnologyStackSelector
  selected={techStack}
  onChange={setTechStack}
  maxSelections={15}
/>
```

## 集成说明

这些组件设计为与现有的Tauri应用架构无缝集成：

1. **路径别名**: 使用 `@/` 前缀引用项目根目录
2. **类型系统**: 基于 `@/types/multi-agent` 的完整类型定义
3. **主题支持**: 完全兼容应用的暗色/亮色主题
4. **国际化**: 支持中文界面文本
5. **性能优化**: 使用React.memo和虚拟化提升性能

## 特性支持

- ✅ 响应式设计
- ✅ 暗色模式支持
- ✅ 键盘导航
- ✅ 无障碍访问
- ✅ 实时数据更新
- ✅ 错误边界处理
- ✅ 加载状态管理
- ✅ 数据持久化
- ✅ 搜索和筛选
- ✅ 排序功能

## 开发注意事项

1. **类型安全**: 所有组件都有完整的TypeScript类型定义
2. **性能优化**: 使用适当的memo化和虚拟化技术
3. **用户体验**: 提供适当的加载状态和错误处理
4. **测试**: 组件设计便于单元测试和集成测试
5. **扩展性**: 支持未来功能扩展和自定义

## 已完成功能

✅ **核心组件完成**：
- ProjectCard - 项目状态展示卡片
- ProjectList - 项目列表容器组件
- ProjectDetails - 项目详细信息展示
- ProjectCreationWizard - 多步骤项目创建向导
- RequirementUploader - 需求文档上传组件
- TaskAllocationMatrix - 任务分配矩阵可视化
- ProjectProgressChart - 项目进度趋势图表

✅ **状态管理完成**：
- useProjects Hook - 完整的项目数据管理
- WebSocket实时更新支持
- 错误处理和加载状态

✅ **用户体验优化**：
- 响应式设计
- 暗色模式兼容
- 拖拽上传文件
- 搜索筛选排序
- 实时进度更新

## 演示组件

ProjectManagementDemo.tsx 提供了完整的集成演示，展示了所有组件的协同工作。

## 待完善功能

根据未来需求，可以考虑添加：
- 项目模板功能
- 批量操作支持 
- 高级筛选器
- 自定义视图
- 导入/导出功能
- 项目克隆功能
- 权限管理集成
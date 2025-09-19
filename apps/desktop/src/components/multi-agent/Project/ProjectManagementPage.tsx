import { useState, useEffect } from 'react'
import { Button } from '../../ui/Button'
import { Card } from '../../ui/card'
import { Badge } from '../../ui/badge'
import { ScrollArea } from '../../ui/scroll-area'
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical,
  GitBranch,
  Folder,
  Calendar
} from 'lucide-react'
import { projectService, type Project } from '../../../services/projectService'
import { ProjectCreationDialog } from './ProjectCreationDialog'
import { ProjectDetailsDialog } from './ProjectDetailsDialog'

interface ProjectManagementPageProps {
  className?: string
}

/**
 * 项目管理主页面
 */
export function ProjectManagementPage({ className }: ProjectManagementPageProps) {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  // 加载项目列表
  const loadProjects = async () => {
    try {
      setLoading(true)
      setError(null)
      const projectList = await projectService.getProjects()
      setProjects(projectList)
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载项目失败')
    } finally {
      setLoading(false)
    }
  }

  // 初始化加载
  useEffect(() => {
    loadProjects()
  }, [])

  // 项目创建成功后回调
  const handleProjectCreated = (newProject: Project) => {
    setProjects(prev => [newProject, ...prev])
    setShowCreateDialog(false)
  }

  // 项目删除
  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('确定要删除此项目吗？此操作不可撤销。')) {
      return
    }
    
    try {
      await projectService.deleteProject(projectId)
      setProjects(prev => prev.filter(p => p.project_id !== projectId))
      if (selectedProject?.project_id === projectId) {
        setSelectedProject(null)
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : '删除项目失败')
    }
  }

  // 过滤项目列表
  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (project.description?.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning': return 'bg-blue-500'
      case 'development': return 'bg-green-500'
      case 'testing': return 'bg-yellow-500'
      case 'production': return 'bg-purple-500'
      case 'completed': return 'bg-gray-500'
      default: return 'bg-gray-400'
    }
  }

  // 获取状态文本
  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      'planning': '计划中',
      'development': '开发中',
      'testing': '测试中',
      'production': '生产中',
      'completed': '已完成'
    }
    return statusMap[status] || status
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载项目列表中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={loadProjects}>重试</Button>
        </div>
      </div>
    )
  }

  return (
    <div className={`h-full flex flex-col ${className}`}>
      {/* 头部工具栏 */}
      <div className="flex-none p-4 border-b bg-white">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">项目管理</h1>
          <Button 
            onClick={() => setShowCreateDialog(true)}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            新建项目
          </Button>
        </div>
        
        {/* 搜索和筛选 */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="搜索项目名称或描述..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="w-4 h-4" />
            筛选
          </Button>
        </div>
      </div>

      {/* 项目列表 */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-4">
            {filteredProjects.length === 0 ? (
              <div className="text-center py-12">
                <Folder className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm ? '未找到匹配的项目' : '还没有项目'}
                </h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm 
                    ? '尝试修改搜索关键词或清空搜索条件' 
                    : '创建你的第一个项目开始使用多Agent协同开发'
                  }
                </p>
                {!searchTerm && (
                  <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
                    <Plus className="w-4 h-4" />
                    新建项目
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProjects.map((project) => (
                  <Card key={project.project_id} className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 
                          className="font-medium text-gray-900 hover:text-blue-600 transition-colors"
                          onClick={() => setSelectedProject(project)}
                        >
                          {project.name}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                          {project.description || '暂无描述'}
                        </p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          // TODO: 显示项目操作菜单
                        }}
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* 项目状态 */}
                    <div className="flex items-center gap-2 mb-3">
                      <Badge 
                        className={`${getStatusColor(project.status)} text-white`}
                      >
                        {getStatusText(project.status)}
                      </Badge>
                      {project.technology_stack.length > 0 && (
                        <Badge variant="outline">
                          {project.technology_stack[0]}
                          {project.technology_stack.length > 1 && (
                            ` +${project.technology_stack.length - 1}`
                          )}
                        </Badge>
                      )}
                    </div>

                    {/* 项目信息 */}
                    <div className="space-y-2 text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <GitBranch className="w-3 h-3" />
                        <span>{project.main_branch}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Folder className="w-3 h-3" />
                        <span className="truncate">{project.workspace_path}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(project.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* 操作按钮 */}
                    <div className="flex gap-2 mt-4">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => setSelectedProject(project)}
                      >
                        查看详情
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteProject(project.project_id)
                        }}
                      >
                        删除
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* 项目创建对话框 */}
      <ProjectCreationDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onProjectCreated={handleProjectCreated}
      />

      {/* 项目详情对话框 */}
      {selectedProject && (
        <ProjectDetailsDialog
          project={selectedProject}
          open={!!selectedProject}
          onClose={() => setSelectedProject(null)}
          onProjectUpdated={(updatedProject) => {
            setProjects(prev => 
              prev.map(p => 
                p.project_id === updatedProject.project_id ? updatedProject : p
              )
            )
            setSelectedProject(updatedProject)
          }}
          onProjectDeleted={(projectId) => {
            setProjects(prev => prev.filter(p => p.project_id !== projectId))
            setSelectedProject(null)
          }}
        />
      )}
    </div>
  )
}
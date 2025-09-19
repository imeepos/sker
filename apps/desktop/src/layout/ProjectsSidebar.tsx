import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { ScrollArea } from '../components/ui/scroll-area'
import { 
  Plus, 
  Search, 
  GitBranch,
  Calendar,
  Folder
} from 'lucide-react'
import { projectService, type Project } from '../services/projectService'

interface ProjectsSidebarProps {
  /** 创建项目回调 */
  onCreateProject?: () => void
}

/**
 * 项目侧边栏组件
 * 显示在AppLayout的中间区域
 */
export function ProjectsSidebar({ onCreateProject }: ProjectsSidebarProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  // 从URL获取当前选中的项目ID
  const selectedProjectId = location.pathname.includes('/project-management/') 
    ? location.pathname.split('/project-management/')[1] 
    : null

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

  // 过滤项目列表
  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (project.description?.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  // 选择项目
  const handleProjectSelect = (project: Project) => {
    navigate(`/project-management/${project.project_id}`)
  }

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
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm">加载项目列表中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4 text-sm">{error}</p>
          <Button onClick={loadProjects} size="sm">重试</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* 头部 */}
      <div className="flex-none p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">项目列表</h2>
          <Button 
            onClick={onCreateProject}
            size="sm"
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            新建
          </Button>
        </div>
        
        {/* 搜索 */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="搜索项目..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
        </div>
      </div>

      {/* 项目列表 */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-4">
            {filteredProjects.length === 0 ? (
              <div className="text-center py-12">
                <Folder className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-base font-medium text-gray-900 mb-2">
                  {searchTerm ? '未找到匹配的项目' : '还没有项目'}
                </h3>
                <p className="text-gray-500 text-sm mb-4">
                  {searchTerm 
                    ? '尝试修改搜索关键词' 
                    : '创建第一个项目开始使用'
                  }
                </p>
                {!searchTerm && (
                  <Button onClick={onCreateProject} size="sm" className="gap-2">
                    <Plus className="w-4 h-4" />
                    新建项目
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredProjects.map((project) => (
                  <Card 
                    key={project.project_id} 
                    className={`p-3 hover:shadow-md transition-all cursor-pointer border-l-4 ${
                      selectedProjectId === project.project_id 
                        ? 'border-l-blue-500 bg-blue-50 shadow-md' 
                        : 'border-l-transparent'
                    }`}
                    onClick={() => handleProjectSelect(project)}
                  >
                    <div className="mb-2">
                      <h3 className="font-medium text-gray-900 text-sm mb-1">
                        {project.name}
                      </h3>
                      <p className="text-xs text-gray-500 line-clamp-2">
                        {project.description || '暂无描述'}
                      </p>
                    </div>

                    {/* 项目状态 */}
                    <div className="flex items-center gap-2 mb-2">
                      <Badge 
                        className={`${getStatusColor(project.status)} text-white text-xs`}
                      >
                        {getStatusText(project.status)}
                      </Badge>
                      {project.technology_stack.length > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {project.technology_stack[0]}
                          {project.technology_stack.length > 1 && (
                            ` +${project.technology_stack.length - 1}`
                          )}
                        </Badge>
                      )}
                    </div>

                    {/* 项目信息 */}
                    <div className="space-y-1 text-xs text-gray-500">
                      <div className="flex items-center gap-2">
                        <GitBranch className="w-3 h-3" />
                        <span>{project.main_branch}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(project.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
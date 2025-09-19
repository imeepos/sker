import { useState } from 'react'
import { Button } from '../../ui/Button'
import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import { Textarea } from '../../ui/textarea'
import { Badge } from '../../ui/badge'
import { Tabs } from '../../ui/tabs'
import { ScrollArea } from '../../ui/scroll-area'
import { 
  Edit2, 
  Save,
  GitBranch,
  Folder,
  Calendar,
  User,
  Globe,
  Settings,
  Trash2,
  X
} from 'lucide-react'
import { projectService, type Project, type UpdateProjectRequest } from '../../../services/projectService'

interface ProjectDetailsProps {
  project: Project | null
  onProjectUpdated: (project: Project) => void
  onProjectDeleted: (projectId: string) => void
}

/**
 * 项目详情展示组件（非弹框版本）
 */
export function ProjectDetails({ 
  project, 
  onProjectUpdated,
  onProjectDeleted
}: ProjectDetailsProps) {
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState<UpdateProjectRequest | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 如果没有选中项目，显示空状态
  if (!project) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Folder className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">选择一个项目</h3>
          <p className="text-gray-500">
            从左侧列表中选择一个项目查看详情
          </p>
        </div>
      </div>
    )
  }

  // 初始化表单数据
  const initFormData = () => {
    setFormData({
      project_id: project.project_id,
      name: project.name,
      description: project.description,
      repository_url: project.repository_url,
      main_branch: project.main_branch,
      workspace_path: project.workspace_path,
      technology_stack: project.technology_stack,
      status: project.status
    })
  }

  // 重置编辑状态
  const resetEditing = () => {
    setFormData(null)
    setEditing(false)
    setError(null)
  }

  // 开始编辑
  const startEditing = () => {
    initFormData()
    setEditing(true)
    setError(null)
  }

  // 取消编辑
  const cancelEditing = () => {
    resetEditing()
  }

  // 保存更改
  const saveChanges = async () => {
    if (!formData || !formData.name?.trim()) {
      setError('项目名称不能为空')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const updatedProject = await projectService.updateProject(formData)
      onProjectUpdated(updatedProject)
      setEditing(false)
      setFormData(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新项目失败')
    } finally {
      setLoading(false)
    }
  }

  // 删除项目
  const handleDelete = async () => {
    if (!confirm(`确定要删除项目 "${project.name}" 吗？此操作不可撤销。`)) {
      return
    }

    setLoading(true)
    try {
      await projectService.deleteProject(project.project_id)
      onProjectDeleted(project.project_id)
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除项目失败')
    } finally {
      setLoading(false)
    }
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

  return (
    <div className="h-full flex flex-col bg-white border-l">
      {/* 头部 */}
      <div className="flex items-center justify-between p-6 border-b bg-white">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">{project.name}</h2>
          <Badge 
            className={`${getStatusColor(project.status)} text-white`}
          >
            {getStatusText(project.status)}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          {!editing && (
            <Button variant="outline" size="sm" onClick={startEditing}>
              <Edit2 className="w-4 h-4 mr-2" />
              编辑
            </Button>
          )}
        </div>
      </div>

      {/* 内容区域 */}
      <ScrollArea className="flex-1">
        <div className="p-6">
          {/* 错误提示 */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-md text-sm mb-4">
              {error}
            </div>
          )}

          <Tabs defaultValue="basic" className="w-full">
            <div className="border-b mb-6">
              <div className="flex space-x-8">
                <button 
                  className="py-2 border-b-2 border-blue-500 text-blue-600 font-medium"
                  type="button"
                >
                  基本信息
                </button>
                <button 
                  className="py-2 text-gray-500 hover:text-gray-700"
                  type="button"
                >
                  配置
                </button>
                <button 
                  className="py-2 text-gray-500 hover:text-gray-700"
                  type="button"
                >
                  统计
                </button>
              </div>
            </div>

            {/* 基本信息标签页 */}
            <div className="space-y-6">
              {editing && formData ? (
                // 编辑模式
                <>
                  {/* 项目名称 */}
                  <div className="space-y-2">
                    <Label htmlFor="edit-name">项目名称</Label>
                    <Input
                      id="edit-name"
                      value={formData.name || ''}
                      onChange={(e) => setFormData(prev => prev ? { ...prev, name: e.target.value } : null)}
                      placeholder="输入项目名称"
                    />
                  </div>

                  {/* 项目描述 */}
                  <div className="space-y-2">
                    <Label htmlFor="edit-description">项目描述</Label>
                    <Textarea
                      id="edit-description"
                      value={formData.description || ''}
                      onChange={(e) => setFormData(prev => prev ? { ...prev, description: e.target.value } : null)}
                      placeholder="输入项目描述"
                      rows={4}
                    />
                  </div>

                  {/* 仓库地址 */}
                  <div className="space-y-2">
                    <Label htmlFor="edit-repository">Git仓库地址</Label>
                    <Input
                      id="edit-repository"
                      value={formData.repository_url || ''}
                      onChange={(e) => setFormData(prev => prev ? { ...prev, repository_url: e.target.value } : null)}
                      placeholder="https://github.com/username/repo.git"
                    />
                  </div>

                  {/* 主分支 */}
                  <div className="space-y-2">
                    <Label htmlFor="edit-branch">主分支</Label>
                    <Input
                      id="edit-branch"
                      value={formData.main_branch || ''}
                      onChange={(e) => setFormData(prev => prev ? { ...prev, main_branch: e.target.value } : null)}
                      placeholder="main"
                    />
                  </div>

                  {/* 工作空间路径 */}
                  <div className="space-y-2">
                    <Label htmlFor="edit-workspace">工作空间路径</Label>
                    <Input
                      id="edit-workspace"
                      value={formData.workspace_path || ''}
                      onChange={(e) => setFormData(prev => prev ? { ...prev, workspace_path: e.target.value } : null)}
                      placeholder="输入工作空间目录路径"
                    />
                  </div>

                  {/* 项目状态 */}
                  <div className="space-y-2">
                    <Label htmlFor="edit-status">项目状态</Label>
                    <select
                      id="edit-status"
                      value={formData.status || ''}
                      onChange={(e) => setFormData(prev => prev ? { ...prev, status: e.target.value } : null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="planning">计划中</option>
                      <option value="development">开发中</option>
                      <option value="testing">测试中</option>
                      <option value="production">生产中</option>
                      <option value="completed">已完成</option>
                    </select>
                  </div>

                  {/* 编辑操作按钮 */}
                  <div className="flex gap-3 pt-4">
                    <Button
                      variant="outline"
                      onClick={cancelEditing}
                      disabled={loading}
                      className="flex-1"
                    >
                      <X className="w-4 h-4 mr-2" />
                      取消
                    </Button>
                    <Button
                      onClick={saveChanges}
                      disabled={loading}
                      className="flex-1"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {loading ? '保存中...' : '保存'}
                    </Button>
                  </div>
                </>
              ) : (
                // 查看模式
                <>
                  {/* 项目描述 */}
                  {project.description && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-medium text-gray-900 mb-2">项目描述</h3>
                      <p className="text-gray-600 leading-relaxed">{project.description}</p>
                    </div>
                  )}

                  {/* 项目信息网格 */}
                  <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 text-sm">
                        <GitBranch className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-500 w-20">主分支:</span>
                        <span className="font-medium">{project.main_branch}</span>
                      </div>
                      
                      <div className="flex items-center gap-3 text-sm">
                        <Globe className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-500 w-20">仓库地址:</span>
                        <a 
                          href={project.repository_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline break-all"
                        >
                          {project.repository_url}
                        </a>
                      </div>

                      <div className="flex items-center gap-3 text-sm">
                        <Folder className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-500 w-20">工作空间:</span>
                        <span className="font-medium break-all">{project.workspace_path}</span>
                      </div>

                      <div className="flex items-center gap-3 text-sm">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-500 w-20">创建时间:</span>
                        <span className="font-medium">
                          {new Date(project.created_at).toLocaleString()}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-sm">
                        <Settings className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-500 w-20">更新时间:</span>
                        <span className="font-medium">
                          {new Date(project.updated_at).toLocaleString()}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-sm">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-500 w-20">项目ID:</span>
                        <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                          {project.project_id.slice(0, 8)}...
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 技术栈 */}
                  {project.technology_stack.length > 0 && (
                    <div>
                      <h3 className="font-medium text-gray-900 mb-3">技术栈</h3>
                      <div className="flex flex-wrap gap-2">
                        {project.technology_stack.map((tech) => (
                          <Badge key={tech} variant="secondary">
                            {tech}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 危险操作区域 */}
                  <div className="border-t pt-6 mt-8">
                    <h3 className="font-medium text-red-600 mb-3">危险操作</h3>
                    <Button
                      variant="outline"
                      onClick={handleDelete}
                      disabled={loading}
                      className="text-red-600 border-red-300 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      删除项目
                    </Button>
                  </div>
                </>
              )}
            </div>
          </Tabs>
        </div>
      </ScrollArea>
    </div>
  )
}
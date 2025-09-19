import { useState } from 'react'
import { Button } from '../../ui/Button'
import { Dialog } from '../../ui/dialog'
import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import { Textarea } from '../../ui/textarea'
import { Badge } from '../../ui/badge'
import { X, Plus, Folder } from 'lucide-react'
import { projectService, type Project, type CreateProjectRequest } from '../../../services/projectService'

interface ProjectCreationDialogProps {
  open: boolean
  onClose: () => void
  onProjectCreated: (project: Project) => void
}

/**
 * 项目创建对话框组件
 */
export function ProjectCreationDialog({ 
  open, 
  onClose, 
  onProjectCreated 
}: ProjectCreationDialogProps) {
  const [formData, setFormData] = useState<CreateProjectRequest>({
    name: '',
    description: '',
    repository_url: '',
    main_branch: 'main',
    workspace_path: '',
    technology_stack: []
  })
  
  const [newTech, setNewTech] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 重置表单
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      repository_url: '',
      main_branch: 'main',
      workspace_path: '',
      technology_stack: []
    })
    setNewTech('')
    setError(null)
  }

  // 关闭对话框
  const handleClose = () => {
    resetForm()
    onClose()
  }

  // 添加技术栈
  const addTechnology = () => {
    if (newTech.trim() && !formData.technology_stack?.includes(newTech.trim())) {
      setFormData(prev => ({
        ...prev,
        technology_stack: [...(prev.technology_stack || []), newTech.trim()]
      }))
      setNewTech('')
    }
  }

  // 移除技术栈
  const removeTechnology = (tech: string) => {
    setFormData(prev => ({
      ...prev,
      technology_stack: prev.technology_stack?.filter(t => t !== tech) || []
    }))
  }

  // 处理键盘事件
  const handleTechKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTechnology()
    }
  }

  // 选择工作空间目录
  const selectWorkspace = async () => {
    try {
      const { open } = await import('@tauri-apps/plugin-dialog')
      const selected = await open({
        directory: true,
        multiple: false,
        title: '选择项目工作空间目录'
      })
      
      if (selected) {
        setFormData(prev => ({ ...prev, workspace_path: selected }))
      }
    } catch (err) {
      console.error('选择目录失败:', err)
      setError(`选择目录失败: ${err}`)
    }
  }

  // 提交表单
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      setError('项目名称不能为空')
      return
    }
    
    if (!formData.repository_url.trim()) {
      setError('仓库地址不能为空')
      return
    }
    
    if (!formData.workspace_path.trim()) {
      setError('工作空间路径不能为空')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const project = await projectService.createProject({
        ...formData,
        description: formData.description || undefined,
        technology_stack: formData.technology_stack?.length ? formData.technology_stack : undefined
      })
      
      onProjectCreated(project)
      handleClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建项目失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
          {/* 头部 */}
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-lg font-semibold">创建新项目</h2>
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* 表单内容 */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* 错误提示 */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-md text-sm">
                {error}
              </div>
            )}

            {/* 项目名称 */}
            <div className="space-y-2">
              <Label htmlFor="name">项目名称 *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="输入项目名称"
                required
              />
            </div>

            {/* 项目描述 */}
            <div className="space-y-2">
              <Label htmlFor="description">项目描述</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="输入项目描述（可选）"
                rows={3}
              />
            </div>

            {/* 仓库地址 */}
            <div className="space-y-2">
              <Label htmlFor="repository_url">Git仓库地址 *</Label>
              <Input
                id="repository_url"
                value={formData.repository_url}
                onChange={(e) => setFormData(prev => ({ ...prev, repository_url: e.target.value }))}
                placeholder="https://github.com/username/repo.git"
                required
              />
            </div>

            {/* 主分支 */}
            <div className="space-y-2">
              <Label htmlFor="main_branch">主分支</Label>
              <Input
                id="main_branch"
                value={formData.main_branch}
                onChange={(e) => setFormData(prev => ({ ...prev, main_branch: e.target.value }))}
                placeholder="main"
              />
            </div>

            {/* 工作空间路径 */}
            <div className="space-y-2">
              <Label htmlFor="workspace_path">工作空间路径 *</Label>
              <div className="flex gap-2">
                <Input
                  id="workspace_path"
                  value={formData.workspace_path}
                  onChange={(e) => setFormData(prev => ({ ...prev, workspace_path: e.target.value }))}
                  placeholder="选择或输入工作空间目录路径"
                  required
                />
                <Button 
                  type="button"
                  variant="outline"
                  onClick={selectWorkspace}
                >
                  <Folder className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* 技术栈 */}
            <div className="space-y-2">
              <Label>技术栈</Label>
              <div className="flex gap-2">
                <Input
                  value={newTech}
                  onChange={(e) => setNewTech(e.target.value)}
                  onKeyPress={handleTechKeyPress}
                  placeholder="添加技术栈（如：React、Python等）"
                />
                <Button 
                  type="button"
                  variant="outline"
                  onClick={addTechnology}
                  disabled={!newTech.trim()}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              
              {/* 技术栈标签 */}
              {formData.technology_stack && formData.technology_stack.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.technology_stack.map((tech) => (
                    <Badge 
                      key={tech}
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      {tech}
                      <button
                        type="button"
                        onClick={() => removeTechnology(tech)}
                        className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* 提交按钮 */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="flex-1"
                disabled={loading}
              >
                取消
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={loading}
              >
                {loading ? '创建中...' : '创建项目'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Dialog>
  )
}
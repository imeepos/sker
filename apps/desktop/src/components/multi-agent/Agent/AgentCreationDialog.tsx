/**
 * AgentCreationDialog组件 - Agent创建和编辑对话框
 */

import React, { useState, useCallback, useEffect } from 'react'
import { 
  X, 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  Upload, 
  User, 
  Settings, 
  Zap, 
  GitBranch, 
  Eye,
  Plus,
  Trash2,
  Info
} from 'lucide-react'
import { cn } from '../../../lib/utils'
import { Card, CardContent, CardHeader, CardTitle, Badge } from '../../ui'
import type { Agent, AgentType } from '../../../types/multi-agent'

interface AgentCreationFormData {
  name: string
  description?: string
  agentType: AgentType
  capabilities: string[]
  maxConcurrentTasks: number
  timeoutMinutes: number
  gitConfig: {
    username: string
    email: string
    sshKey?: File | string
  }
}

interface AgentCreationDialogProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: AgentCreationFormData) => Promise<void>
  editingAgent?: Agent | null
  className?: string
}

// 步骤配置
const STEPS = [
  { 
    key: 'basic', 
    title: '基本信息', 
    icon: User,
    description: '设置Agent的基本信息和类型'
  },
  { 
    key: 'capabilities', 
    title: '能力配置', 
    icon: Zap,
    description: '配置Agent的技能和能力'
  },
  { 
    key: 'performance', 
    title: '性能设置', 
    icon: Settings,
    description: '配置Agent的性能参数'
  },
  { 
    key: 'git', 
    title: 'Git配置', 
    icon: GitBranch,
    description: '设置Git用户信息和SSH密钥'
  },
  { 
    key: 'preview', 
    title: '预览确认', 
    icon: Eye,
    description: '预览配置并确认创建'
  }
] as const

type StepKey = typeof STEPS[number]['key']

// Agent类型选项
const AGENT_TYPE_OPTIONS: Array<{
  value: AgentType
  label: string
  description: string
  icon: string
}> = [
  {
    value: 'developer',
    label: '开发者',
    description: '负责代码开发、功能实现和bug修复',
    icon: '💻'
  },
  {
    value: 'reviewer',
    label: '代码审查员',
    description: '负责代码审查、质量把控和最佳实践检查',
    icon: '🔍'
  },
  {
    value: 'tester',
    label: '测试员',
    description: '负责自动化测试、质量保证和bug发现',
    icon: '🧪'
  },
  {
    value: 'manager',
    label: '项目经理',
    description: '负责项目管理、任务分配和进度跟踪',
    icon: '📋'
  }
]

// 预定义技能
const PREDEFINED_CAPABILITIES = [
  // 编程语言
  'JavaScript', 'TypeScript', 'Python', 'Rust', 'Go', 'Java', 'C++', 'C#',
  // 前端技术
  'React', 'Vue.js', 'Angular', 'HTML/CSS', 'Webpack', 'Vite',
  // 后端技术
  'Node.js', 'Express', 'FastAPI', 'Django', 'Spring Boot',
  // 数据库
  'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'SQLite',
  // 工具和平台
  'Git', 'Docker', 'Kubernetes', 'AWS', 'Tauri', 'Electron',
  // 测试
  'Jest', 'Cypress', 'Selenium', 'Unit Testing', 'Integration Testing',
  // 其他
  'Code Review', 'Documentation', 'API Design', 'Security', 'Performance'
]

export const AgentCreationDialog: React.FC<AgentCreationDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingAgent,
  className
}) => {
  const [currentStep, setCurrentStep] = useState<StepKey>('basic')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<AgentCreationFormData>({
    name: '',
    description: '',
    agentType: 'developer',
    capabilities: [],
    maxConcurrentTasks: 3,
    timeoutMinutes: 30,
    gitConfig: {
      username: '',
      email: '',
      sshKey: undefined
    }
  })
  const [newCapability, setNewCapability] = useState('')
  const [errors, setErrors] = useState<Partial<Record<keyof AgentCreationFormData, string>>>({})

  // 初始化编辑数据
  useEffect(() => {
    if (editingAgent && isOpen) {
      setFormData({
        name: editingAgent.name,
        description: editingAgent.description || '',
        agentType: editingAgent.agentType,
        capabilities: [...editingAgent.capabilities],
        maxConcurrentTasks: editingAgent.maxConcurrentTasks || 3,
        timeoutMinutes: editingAgent.timeoutMinutes || 30,
        gitConfig: {
          username: editingAgent.gitConfig?.username || '',
          email: editingAgent.gitConfig?.email || '',
          sshKey: editingAgent.gitConfig?.sshKey || undefined
        }
      })
    } else if (isOpen) {
      // 重置表单
      setFormData({
        name: '',
        description: '',
        agentType: 'developer',
        capabilities: [],
        maxConcurrentTasks: 3,
        timeoutMinutes: 30,
        gitConfig: {
          username: '',
          email: '',
          sshKey: undefined
        }
      })
      setCurrentStep('basic')
      setErrors({})
    }
  }, [editingAgent, isOpen])

  // 验证当前步骤
  const validateStep = useCallback((step: StepKey): boolean => {
    const newErrors: Partial<Record<keyof AgentCreationFormData, string>> = {}

    switch (step) {
      case 'basic':
        if (!formData.name.trim()) {
          newErrors.name = 'Agent名称不能为空'
        } else if (formData.name.length < 2) {
          newErrors.name = 'Agent名称至少需要2个字符'
        }
        break
      
      case 'capabilities':
        if (formData.capabilities.length === 0) {
          newErrors.capabilities = '至少需要选择一个技能'
        }
        break
      
      case 'performance':
        if (formData.maxConcurrentTasks < 1) {
          newErrors.maxConcurrentTasks = '最大并发任务数至少为1'
        }
        if (formData.timeoutMinutes < 1) {
          newErrors.timeoutMinutes = '超时时间至少为1分钟'
        }
        break
      
      case 'git':
        if (!formData.gitConfig.username.trim()) {
          newErrors.gitConfig = 'Git用户名不能为空'
        }
        if (!formData.gitConfig.email.trim()) {
          newErrors.gitConfig = 'Git邮箱不能为空'
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.gitConfig.email)) {
          newErrors.gitConfig = '请输入有效的邮箱地址'
        }
        break
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [formData])

  // 下一步
  const handleNext = useCallback(() => {
    if (validateStep(currentStep)) {
      const currentIndex = STEPS.findIndex(step => step.key === currentStep)
      if (currentIndex < STEPS.length - 1) {
        setCurrentStep(STEPS[currentIndex + 1].key)
      }
    }
  }, [currentStep, validateStep])

  // 上一步
  const handlePrev = useCallback(() => {
    const currentIndex = STEPS.findIndex(step => step.key === currentStep)
    if (currentIndex > 0) {
      setCurrentStep(STEPS[currentIndex - 1].key)
    }
  }, [currentStep])

  // 添加技能
  const handleAddCapability = useCallback(() => {
    if (newCapability.trim() && !formData.capabilities.includes(newCapability.trim())) {
      setFormData(prev => ({
        ...prev,
        capabilities: [...prev.capabilities, newCapability.trim()]
      }))
      setNewCapability('')
    }
  }, [newCapability, formData.capabilities])

  // 移除技能
  const handleRemoveCapability = useCallback((capability: string) => {
    setFormData(prev => ({
      ...prev,
      capabilities: prev.capabilities.filter(cap => cap !== capability)
    }))
  }, [])

  // 选择预定义技能
  const handleSelectPredefinedCapability = useCallback((capability: string) => {
    if (!formData.capabilities.includes(capability)) {
      setFormData(prev => ({
        ...prev,
        capabilities: [...prev.capabilities, capability]
      }))
    }
  }, [formData.capabilities])

  // 文件上传处理
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setFormData(prev => ({
        ...prev,
        gitConfig: {
          ...prev.gitConfig,
          sshKey: file
        }
      }))
    }
  }, [])

  // 提交表单
  const handleSubmit = useCallback(async () => {
    if (!validateStep('git')) return

    setIsSubmitting(true)
    try {
      await onSubmit(formData)
      onClose()
    } catch (error) {
      console.error('Failed to create/update agent:', error)
    } finally {
      setIsSubmitting(false)
    }
  }, [formData, onSubmit, onClose, validateStep])

  if (!isOpen) return null

  const currentStepIndex = STEPS.findIndex(step => step.key === currentStep)
  const isFirstStep = currentStepIndex === 0
  const isLastStep = currentStepIndex === STEPS.length - 1

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={cn(
        "bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden",
        className
      )}>
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold">
              {editingAgent ? '编辑Agent' : '创建新Agent'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {STEPS[currentStepIndex].description}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 步骤指示器 */}
        <div className="px-6 py-4 bg-gray-50 border-b">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => {
              const Icon = step.icon
              const isActive = step.key === currentStep
              const isCompleted = index < currentStepIndex
              
              return (
                <div key={step.key} className="flex items-center">
                  <div className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors",
                    isActive 
                      ? "border-blue-500 bg-blue-500 text-white"
                      : isCompleted
                      ? "border-green-500 bg-green-500 text-white"
                      : "border-gray-300 bg-white text-gray-400"
                  )}>
                    {isCompleted ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Icon className="w-4 h-4" />
                    )}
                  </div>
                  <span className={cn(
                    "ml-2 text-sm font-medium",
                    isActive ? "text-blue-600" : isCompleted ? "text-green-600" : "text-gray-500"
                  )}>
                    {step.title}
                  </span>
                  {index < STEPS.length - 1 && (
                    <div className={cn(
                      "mx-4 h-0.5 w-12 transition-colors",
                      isCompleted ? "bg-green-500" : "bg-gray-300"
                    )} />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* 表单内容 */}
        <div className="flex-1 overflow-y-auto p-6">
          {currentStep === 'basic' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Agent名称 *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className={cn(
                    "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500",
                    errors.name ? "border-red-500" : "border-gray-300"
                  )}
                  placeholder="输入Agent名称"
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  描述
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="描述Agent的作用和特点"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  Agent类型 *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {AGENT_TYPE_OPTIONS.map(option => (
                    <div
                      key={option.value}
                      onClick={() => setFormData(prev => ({ ...prev, agentType: option.value }))}
                      className={cn(
                        "p-4 border-2 rounded-lg cursor-pointer transition-all",
                        formData.agentType === option.value
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{option.icon}</span>
                        <div>
                          <h3 className="font-medium">{option.label}</h3>
                          <p className="text-sm text-gray-600">{option.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {currentStep === 'capabilities' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  添加自定义技能
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCapability}
                    onChange={(e) => setNewCapability(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddCapability()}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="输入技能名称"
                  />
                  <button
                    onClick={handleAddCapability}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  选择预定义技能
                </label>
                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                  {PREDEFINED_CAPABILITIES.map(capability => (
                    <button
                      key={capability}
                      onClick={() => handleSelectPredefinedCapability(capability)}
                      disabled={formData.capabilities.includes(capability)}
                      className={cn(
                        "px-3 py-2 text-sm border rounded-md transition-colors",
                        formData.capabilities.includes(capability)
                          ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                          : "bg-white text-gray-700 border-gray-300 hover:bg-blue-50 hover:border-blue-300"
                      )}
                    >
                      {capability}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="text-sm font-medium text-gray-700">
                    已选择的技能 ({formData.capabilities.length})
                  </label>
                  {errors.capabilities && (
                    <p className="text-red-500 text-sm">{errors.capabilities}</p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.capabilities.map(capability => (
                    <Badge
                      key={capability}
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      {capability}
                      <button
                        onClick={() => handleRemoveCapability(capability)}
                        className="ml-1 hover:text-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}

          {currentStep === 'performance' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  最大并发任务数 *
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={formData.maxConcurrentTasks}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    maxConcurrentTasks: parseInt(e.target.value) || 1 
                  }))}
                  className={cn(
                    "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500",
                    errors.maxConcurrentTasks ? "border-red-500" : "border-gray-300"
                  )}
                />
                {errors.maxConcurrentTasks && (
                  <p className="text-red-500 text-sm mt-1">{errors.maxConcurrentTasks}</p>
                )}
                <p className="text-sm text-gray-600 mt-1">
                  Agent可以同时处理的最大任务数量
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  任务超时时间（分钟）*
                </label>
                <input
                  type="number"
                  min="1"
                  max="1440"
                  value={formData.timeoutMinutes}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    timeoutMinutes: parseInt(e.target.value) || 30 
                  }))}
                  className={cn(
                    "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500",
                    errors.timeoutMinutes ? "border-red-500" : "border-gray-300"
                  )}
                />
                {errors.timeoutMinutes && (
                  <p className="text-red-500 text-sm mt-1">{errors.timeoutMinutes}</p>
                )}
                <p className="text-sm text-gray-600 mt-1">
                  单个任务的最大执行时间，超时后将被终止
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900">性能建议</h4>
                    <ul className="text-sm text-blue-800 mt-2 space-y-1">
                      <li>• 开发者Agent建议并发任务数：2-3个</li>
                      <li>• 审查员Agent建议并发任务数：1-2个</li>
                      <li>• 简单任务超时时间：15-30分钟</li>
                      <li>• 复杂任务超时时间：60-120分钟</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 'git' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Git用户名 *
                </label>
                <input
                  type="text"
                  value={formData.gitConfig.username}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    gitConfig: { ...prev.gitConfig, username: e.target.value }
                  }))}
                  className={cn(
                    "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500",
                    errors.gitConfig ? "border-red-500" : "border-gray-300"
                  )}
                  placeholder="git用户名"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Git邮箱 *
                </label>
                <input
                  type="email"
                  value={formData.gitConfig.email}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    gitConfig: { ...prev.gitConfig, email: e.target.value }
                  }))}
                  className={cn(
                    "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500",
                    errors.gitConfig ? "border-red-500" : "border-gray-300"
                  )}
                  placeholder="git@example.com"
                />
                {errors.gitConfig && (
                  <p className="text-red-500 text-sm mt-1">{errors.gitConfig}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SSH私钥文件（可选）
                </label>
                <div className="flex items-center gap-4">
                  <label className="flex-1 flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50">
                    <Upload className="w-4 h-4" />
                    <span className="text-sm">
                      {formData.gitConfig.sshKey 
                        ? `已选择: ${formData.gitConfig.sshKey instanceof File ? formData.gitConfig.sshKey.name : '已配置'}`
                        : '选择SSH私钥文件'
                      }
                    </span>
                    <input
                      type="file"
                      accept=".pem,.key,*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                  {formData.gitConfig.sshKey && (
                    <button
                      onClick={() => setFormData(prev => ({
                        ...prev,
                        gitConfig: { ...prev.gitConfig, sshKey: undefined }
                      }))}
                      className="p-2 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  用于访问私有仓库，支持OpenSSH格式的私钥文件
                </p>
              </div>
            </div>
          )}

          {currentStep === 'preview' && (
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">配置预览</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">基本信息</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">名称:</span>
                        <span className="font-medium">{formData.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">类型:</span>
                        <span className="font-medium">
                          {AGENT_TYPE_OPTIONS.find(opt => opt.value === formData.agentType)?.label}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">描述:</span>
                        <span className="font-medium text-right max-w-40 truncate">
                          {formData.description || '无'}
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">性能配置</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">最大并发:</span>
                        <span className="font-medium">{formData.maxConcurrentTasks}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">超时时间:</span>
                        <span className="font-medium">{formData.timeoutMinutes}分钟</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">技能数量:</span>
                        <span className="font-medium">{formData.capabilities.length}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="mt-6">
                  <h4 className="font-medium mb-3">技能列表</h4>
                  <div className="flex flex-wrap gap-2">
                    {formData.capabilities.map(capability => (
                      <Badge key={capability} variant="secondary">
                        {capability}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="mt-6">
                  <h4 className="font-medium mb-3">Git配置</h4>
                  <div className="text-sm space-y-1">
                    <div>用户名: {formData.gitConfig.username}</div>
                    <div>邮箱: {formData.gitConfig.email}</div>
                    <div>SSH密钥: {formData.gitConfig.sshKey ? '已配置' : '未配置'}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 底部按钮 */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <button
            onClick={handlePrev}
            disabled={isFirstStep}
            className={cn(
              "flex items-center gap-2 px-4 py-2 text-sm rounded-md transition-colors",
              isFirstStep
                ? "text-gray-400 cursor-not-allowed"
                : "text-gray-700 hover:bg-gray-200"
            )}
          >
            <ArrowLeft className="w-4 h-4" />
            上一步
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            
            {isLastStep ? (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {editingAgent ? '更新中...' : '创建中...'}
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    {editingAgent ? '更新Agent' : '创建Agent'}
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                下一步
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
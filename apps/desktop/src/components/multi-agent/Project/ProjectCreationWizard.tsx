/**
 * ProjectCreationWizard组件 - 多步骤项目创建向导
 * 提供5步向导流程创建项目：基本信息→需求文档→技术栈→编码规范→质量门禁
 */

import React, { useState, useCallback, useMemo } from 'react'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '../../ui/dialog'
import { Button } from '../../ui/Button'
import { Input } from '../../ui/input'
import { Textarea } from '../../ui/textarea'
import type { 
  ProjectConfig, 
  RequirementDocument, 
  Project 
} from '../../../types/multi-agent'

interface ProjectCreationWizardProps {
  open: boolean
  onClose: () => void
  onComplete: (project: Project) => void
}

// 向导步骤定义
interface WizardStep {
  id: string
  title: string
  description: string
}

const wizardSteps: WizardStep[] = [
  {
    id: 'basic',
    title: '基本信息',
    description: '设置项目名称、描述和Git仓库信息'
  },
  {
    id: 'requirements', 
    title: '需求文档',
    description: '上传或输入项目需求文档'
  },
  {
    id: 'techstack',
    title: '技术栈',
    description: '选择项目使用的技术栈和框架'
  },
  {
    id: 'standards',
    title: '编码规范',
    description: '配置代码风格和编码规范'
  },
  {
    id: 'quality',
    title: '质量门禁',
    description: '设置代码质量标准和测试要求'
  }
]

// 表单数据类型
interface WizardFormData {
  // 基本信息
  name: string
  description: string
  gitRepository?: string
  mainBranch?: string

  // 需求文档
  requirements: RequirementDocument[]
  
  // 技术栈
  technologyStack: string[]
  
  // 编码规范
  codingStandards?: Record<string, any>
  
  // 质量门禁
  qualityGates?: {
    testCoverage: number
    codeQuality: number
    securityScan: boolean
  }
}

// 基本信息步骤组件
const BasicProjectInfoStep: React.FC<{
  data: Partial<WizardFormData>
  onChange: (data: Partial<WizardFormData>) => void
}> = ({ data, onChange }) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            项目名称 *
          </label>
          <Input
            id="name"
            value={data.name || ''}
            onChange={(e) => onChange({ ...data, name: e.target.value })}
            placeholder="请输入项目名称"
            required
          />
        </div>
        <div>
          <label htmlFor="gitRepo" className="block text-sm font-medium text-gray-700 mb-1">
            Git仓库URL
          </label>
          <Input
            id="gitRepo"
            value={data.gitRepository || ''}
            onChange={(e) => onChange({ ...data, gitRepository: e.target.value })}
            placeholder="https://github.com/..."
          />
        </div>
      </div>
      <div>
        <label htmlFor="mainBranch" className="block text-sm font-medium text-gray-700 mb-1">
          主分支
        </label>
        <Input
          id="mainBranch"
          value={data.mainBranch || 'main'}
          onChange={(e) => onChange({ ...data, mainBranch: e.target.value })}
          placeholder="main"
        />
      </div>
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          项目描述
        </label>
        <Textarea
          id="description"
          value={data.description || ''}
          onChange={(e) => onChange({ ...data, description: e.target.value })}
          placeholder="简要描述项目功能和目标"
          rows={3}
        />
      </div>
    </div>
  )
}

// 需求文档步骤组件
const RequirementUploadStep: React.FC<{
  data: Partial<WizardFormData>
  onChange: (data: Partial<WizardFormData>) => void
}> = ({ data, onChange }) => {
  const [requirementText, setRequirementText] = useState('')
  const [requirementTitle, setRequirementTitle] = useState('')

  const addRequirement = useCallback(() => {
    if (!requirementTitle.trim() || !requirementText.trim()) return

    const newRequirement: RequirementDocument = {
      title: requirementTitle,
      content: requirementText,
      documentType: 'user_story',
      version: '1.0',
      priority: 'medium',
      uploadedAt: new Date()
    }

    const requirements = [...(data.requirements || []), newRequirement]
    onChange({ ...data, requirements })
    setRequirementTitle('')
    setRequirementText('')
  }, [requirementTitle, requirementText, data, onChange])

  const removeRequirement = useCallback((index: number) => {
    const requirements = [...(data.requirements || [])]
    requirements.splice(index, 1)
    onChange({ ...data, requirements })
  }, [data, onChange])

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="reqTitle" className="block text-sm font-medium text-gray-700 mb-1">
          需求标题
        </label>
        <Input
          id="reqTitle"
          value={requirementTitle}
          onChange={(e) => setRequirementTitle(e.target.value)}
          placeholder="输入需求标题"
        />
      </div>
      <div>
        <label htmlFor="reqContent" className="block text-sm font-medium text-gray-700 mb-1">
          需求内容
        </label>
        <Textarea
          id="reqContent"
          value={requirementText}
          onChange={(e) => setRequirementText(e.target.value)}
          placeholder="详细描述项目需求..."
          rows={6}
        />
      </div>
      <Button 
        onClick={addRequirement}
        disabled={!requirementTitle.trim() || !requirementText.trim()}
        variant="outline"
      >
        添加需求
      </Button>

      {/* 已添加的需求列表 */}
      {data.requirements && data.requirements.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-medium text-gray-700 mb-2">已添加的需求</h4>
          <div className="space-y-2">
            {data.requirements.map((req, index) => (
              <div key={index} className="p-3 border rounded-lg bg-gray-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h5 className="font-medium text-sm">{req.title}</h5>
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                      {req.content}
                    </p>
                  </div>
                  <Button
                    onClick={() => removeRequirement(index)}
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-700"
                  >
                    删除
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// 技术栈选择步骤组件
const TechnologyStackStep: React.FC<{
  data: Partial<WizardFormData>
  onChange: (data: Partial<WizardFormData>) => void
}> = ({ data, onChange }) => {
  const [customTech, setCustomTech] = useState('')

  // 预定义的技术栈选项
  const techCategories = [
    {
      category: '前端技术',
      technologies: ['React', 'Vue.js', 'Angular', 'TypeScript', 'JavaScript', 'HTML5', 'CSS3', 'Tailwind CSS']
    },
    {
      category: '后端技术', 
      technologies: ['Node.js', 'Python', 'Java', 'C#', 'Go', 'Rust', 'PHP']
    },
    {
      category: '数据库',
      technologies: ['MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'SQLite', 'Elasticsearch']
    },
    {
      category: '开发工具',
      technologies: ['Docker', 'Kubernetes', 'Git', 'Jenkins', 'GitHub Actions', 'Webpack', 'Vite']
    }
  ]

  const toggleTechnology = useCallback((tech: string) => {
    const currentStack = data.technologyStack || []
    const newStack = currentStack.includes(tech)
      ? currentStack.filter(t => t !== tech)
      : [...currentStack, tech]
    
    onChange({ ...data, technologyStack: newStack })
  }, [data, onChange])

  const addCustomTechnology = useCallback(() => {
    if (!customTech.trim()) return
    
    const currentStack = data.technologyStack || []
    if (!currentStack.includes(customTech)) {
      onChange({ ...data, technologyStack: [...currentStack, customTech] })
    }
    setCustomTech('')
  }, [customTech, data, onChange])

  return (
    <div className="space-y-6">
      {techCategories.map(category => (
        <div key={category.category}>
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            {category.category}
          </h4>
          <div className="grid grid-cols-3 gap-2">
            {category.technologies.map(tech => (
              <button
                key={tech}
                type="button"
                onClick={() => toggleTechnology(tech)}
                className={`p-2 text-sm border rounded-lg transition-colors ${
                  data.technologyStack?.includes(tech)
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
              >
                {tech}
              </button>
            ))}
          </div>
        </div>
      ))}

      {/* 自定义技术栈 */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2">
          自定义技术
        </h4>
        <div className="flex gap-2">
          <Input
            value={customTech}
            onChange={(e) => setCustomTech(e.target.value)}
            placeholder="输入自定义技术名称"
            onKeyPress={(e) => e.key === 'Enter' && addCustomTechnology()}
          />
          <Button 
            onClick={addCustomTechnology}
            disabled={!customTech.trim()}
            variant="outline"
          >
            添加
          </Button>
        </div>
      </div>

      {/* 已选择的技术栈预览 */}
      {data.technologyStack && data.technologyStack.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            已选择的技术栈 ({data.technologyStack.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {data.technologyStack.map(tech => (
              <span 
                key={tech}
                className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-full border border-blue-200"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// 编码规范步骤组件
const CodingStandardsStep: React.FC<{
  data: Partial<WizardFormData>
  onChange: (data: Partial<WizardFormData>) => void
}> = ({ data, onChange }) => {
  const standards = data.codingStandards || {}

  const updateStandard = useCallback((key: string, value: any) => {
    onChange({ 
      ...data, 
      codingStandards: { ...standards, [key]: value }
    })
  }, [data, onChange, standards])

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          代码风格规范
        </label>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="radio"
              name="codeStyle"
              value="prettier"
              checked={standards.codeStyle === 'prettier'}
              onChange={(e) => updateStandard('codeStyle', e.target.value)}
              className="mr-2"
            />
            Prettier (推荐)
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="codeStyle"
              value="eslint"
              checked={standards.codeStyle === 'eslint'}
              onChange={(e) => updateStandard('codeStyle', e.target.value)}
              className="mr-2"
            />
            ESLint
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="codeStyle"
              value="custom"
              checked={standards.codeStyle === 'custom'}
              onChange={(e) => updateStandard('codeStyle', e.target.value)}
              className="mr-2"
            />
            自定义规范
          </label>
        </div>
      </div>

      <div>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={standards.useTypeScript || false}
            onChange={(e) => updateStandard('useTypeScript', e.target.checked)}
            className="mr-2"
          />
          启用 TypeScript 类型检查
        </label>
      </div>

      <div>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={standards.enforceCommitMessage || false}
            onChange={(e) => updateStandard('enforceCommitMessage', e.target.checked)}
            className="mr-2"
          />
          强制规范化 Git 提交消息
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          行长度限制
        </label>
        <Input
          type="number"
          value={standards.maxLineLength || 120}
          onChange={(e) => updateStandard('maxLineLength', parseInt(e.target.value))}
          min={80}
          max={200}
        />
      </div>
    </div>
  )
}

// 质量门禁步骤组件
const QualityGatesStep: React.FC<{
  data: Partial<WizardFormData>
  onChange: (data: Partial<WizardFormData>) => void
}> = ({ data, onChange }) => {
  const qualityGates = data.qualityGates || {
    testCoverage: 80,
    codeQuality: 85,
    securityScan: true
  }

  const updateQualityGate = useCallback((key: string, value: any) => {
    onChange({
      ...data,
      qualityGates: { ...qualityGates, [key]: value }
    })
  }, [data, onChange, qualityGates])

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          测试覆盖率要求 (%): {qualityGates.testCoverage}
        </label>
        <input
          type="range"
          min="0"
          max="100"
          value={qualityGates.testCoverage}
          onChange={(e) => updateQualityGate('testCoverage', parseInt(e.target.value))}
          className="w-full"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          代码质量分数要求: {qualityGates.codeQuality}
        </label>
        <input
          type="range"
          min="0"
          max="100"
          value={qualityGates.codeQuality}
          onChange={(e) => updateQualityGate('codeQuality', parseInt(e.target.value))}
          className="w-full"
        />
      </div>

      <div>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={qualityGates.securityScan}
            onChange={(e) => updateQualityGate('securityScan', e.target.checked)}
            className="mr-2"
          />
          启用安全扫描
        </label>
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="text-sm font-medium text-blue-800 mb-2">质量门禁摘要</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• 测试覆盖率必须达到 {qualityGates.testCoverage}%</li>
          <li>• 代码质量分数必须达到 {qualityGates.codeQuality}</li>
          <li>• {qualityGates.securityScan ? '启用' : '禁用'}安全扫描检查</li>
        </ul>
      </div>
    </div>
  )
}

export const ProjectCreationWizard: React.FC<ProjectCreationWizardProps> = ({
  open,
  onClose,
  onComplete
}) => {
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState<Partial<WizardFormData>>({
    requirements: [],
    technologyStack: [],
    mainBranch: 'main',
    qualityGates: {
      testCoverage: 80,
      codeQuality: 85,
      securityScan: true
    }
  })

  // 验证当前步骤
  const isStepValid = useMemo(() => {
    switch (currentStep) {
      case 0: // 基本信息
        return formData.name?.trim()
      case 1: // 需求文档
        return true // 可选步骤
      case 2: // 技术栈
        return formData.technologyStack && formData.technologyStack.length > 0
      case 3: // 编码规范
        return true // 可选步骤
      case 4: // 质量门禁
        return true // 有默认值
      default:
        return false
    }
  }, [currentStep, formData])

  // 下一步
  const nextStep = useCallback(() => {
    if (currentStep < wizardSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }, [currentStep])

  // 上一步
  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }, [currentStep])

  // 完成创建
  const handleComplete = useCallback(async () => {
    try {
      const projectConfig: ProjectConfig = {
        name: formData.name!,
        description: formData.description || '',
        gitRepository: formData.gitRepository,
        mainBranch: formData.mainBranch || 'main',
        technologyStack: formData.technologyStack || [],
        codingStandards: formData.codingStandards,
        qualityGates: formData.qualityGates
      }

      // 这里应该调用实际的创建项目API
      // const result = await createProject(projectConfig, formData.requirements)
      
      // 模拟创建成功
      const newProject: Project = {
        id: Date.now().toString(),
        name: projectConfig.name,
        description: projectConfig.description,
        status: 'planning',
        progress: 0,
        assignedAgents: [],
        totalTasks: 0,
        completedTasks: 0,
        activeTasks: 0,
        failedTasks: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        config: projectConfig,
        requirements: formData.requirements || [],
        technologyStack: projectConfig.technologyStack,
        repository: formData.gitRepository ? {
          url: formData.gitRepository,
          branch: formData.mainBranch || 'main'
        } : undefined
      }

      onComplete(newProject)
      onClose()
    } catch (error) {
      console.error('创建项目失败:', error)
    }
  }, [formData, onComplete, onClose])

  // 渲染当前步骤
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return <BasicProjectInfoStep data={formData} onChange={setFormData} />
      case 1:
        return <RequirementUploadStep data={formData} onChange={setFormData} />
      case 2:
        return <TechnologyStackStep data={formData} onChange={setFormData} />
      case 3:
        return <CodingStandardsStep data={formData} onChange={setFormData} />
      case 4:
        return <QualityGatesStep data={formData} onChange={setFormData} />
      default:
        return null
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>创建新项目</DialogTitle>
          <DialogDescription>
            通过向导创建多Agent协同开发项目
          </DialogDescription>
        </DialogHeader>

        {/* 步骤指示器 */}
        <div className="flex items-center justify-between mb-6">
          {wizardSteps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                ${index <= currentStep 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-500'
                }
              `}>
                {index + 1}
              </div>
              <div className="ml-2 hidden md:block">
                <p className="text-sm font-medium">{step.title}</p>
                <p className="text-xs text-gray-500">{step.description}</p>
              </div>
              {index < wizardSteps.length - 1 && (
                <div className={`
                  h-px w-12 mx-4
                  ${index < currentStep ? 'bg-blue-500' : 'bg-gray-200'}
                `} />
              )}
            </div>
          ))}
        </div>

        {/* 当前步骤内容 */}
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-2">
            {wizardSteps[currentStep].title}
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            {wizardSteps[currentStep].description}
          </p>
          {renderCurrentStep()}
        </div>

        {/* 按钮组 */}
        <div className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={prevStep}
            disabled={currentStep === 0}
          >
            上一步
          </Button>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              取消
            </Button>
            
            {currentStep === wizardSteps.length - 1 ? (
              <Button 
                onClick={handleComplete}
                disabled={!isStepValid}
              >
                创建项目
              </Button>
            ) : (
              <Button 
                onClick={nextStep}
                disabled={!isStepValid}
              >
                下一步
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

ProjectCreationWizard.displayName = 'ProjectCreationWizard'
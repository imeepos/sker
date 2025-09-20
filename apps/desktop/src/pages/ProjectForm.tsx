import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProject, useCreateProject, useUpdateProject } from '../shared/hooks/api';
import { Button } from '../shared/components/ui/Button';
import { Input } from '../shared/components/ui/Input';
import { FolderPicker } from '../shared/components/ui/folder-picker';
import { GitUrlInput } from '../shared/components/ui/git-url-input';
import { isValidGitUrl } from '../shared/utils/git';
import { 
  PROJECT_STATUS_OPTIONS, 
  TECHNOLOGY_STACK_OPTIONS,
  type ProjectFormData,
  type CreateProjectRequest,
  type UpdateProjectRequest
} from '../shared/types/project';

/**
 * 项目创建/编辑表单页面
 * 根据URL参数判断是创建还是编辑模式
 */
export function ProjectForm() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const isEditMode = !!projectId;

  // 获取项目数据（编辑模式）
  const { data: project, isLoading: isLoadingProject } = useProject(projectId);
  
  // API mutations
  const createProjectMutation = useCreateProject();
  const updateProjectMutation = useUpdateProject();

  // 表单状态
  const [formData, setFormData] = useState<ProjectFormData>({
    name: '',
    description: '',
    repository_url: '',
    main_branch: 'main',
    workspace_path: '',
    technology_stack: [],
    status: 'planning',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [techStackInput, setTechStackInput] = useState('');
  const [showTechStackSuggestions, setShowTechStackSuggestions] = useState(false);

  // 编辑模式下填充表单数据
  useEffect(() => {
    if (isEditMode && project) {
      setFormData({
        name: project.name,
        description: project.description || '',
        repository_url: project.repository_url,
        main_branch: project.main_branch,
        workspace_path: project.workspace_path,
        technology_stack: project.technology_stack,
        status: project.status,
      });
    }
  }, [isEditMode, project]);

  // 处理表单字段变化
  const handleFieldChange = (field: keyof ProjectFormData, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // 清除该字段的错误
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // 处理技术栈添加
  const handleAddTechStack = (tech: string) => {
    if (tech && !formData.technology_stack.includes(tech)) {
      handleFieldChange('technology_stack', [...formData.technology_stack, tech]);
    }
    setTechStackInput('');
    setShowTechStackSuggestions(false);
  };

  // 处理技术栈移除
  const handleRemoveTechStack = (tech: string) => {
    handleFieldChange(
      'technology_stack',
      formData.technology_stack.filter(t => t !== tech)
    );
  };

  // 表单验证
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = '项目名称不能为空';
    }

    if (!formData.repository_url.trim()) {
      newErrors.repository_url = '仓库地址不能为空';
    } else if (!isValidGitUrl(formData.repository_url)) {
      newErrors.repository_url = '请输入有效的Git仓库地址';
    }

    if (!formData.workspace_path.trim()) {
      newErrors.workspace_path = '工作空间路径不能为空';
    }

    if (!formData.main_branch.trim()) {
      newErrors.main_branch = '主分支不能为空';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 移除了 Git URL 示例，现在由 GitUrlInput 组件处理

  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      if (isEditMode && projectId) {
        // 更新项目
        const updateRequest: UpdateProjectRequest = {
          project_id: projectId,
          name: formData.name,
          description: formData.description || undefined,
          repository_url: formData.repository_url,
          main_branch: formData.main_branch,
          workspace_path: formData.workspace_path,
          technology_stack: formData.technology_stack,
          status: formData.status,
        };
        
        await updateProjectMutation.mutateAsync(updateRequest);
        navigate(`/projects/${projectId}`);
      } else {
        // 创建项目
        const createRequest: CreateProjectRequest = {
          name: formData.name,
          description: formData.description || undefined,
          repository_url: formData.repository_url,
          main_branch: formData.main_branch,
          workspace_path: formData.workspace_path,
          technology_stack: formData.technology_stack,
        };
        
        const newProject = await createProjectMutation.mutateAsync(createRequest);
        navigate(`/projects/${newProject.project_id}`);
      }
    } catch (error) {
      console.error('提交表单失败:', error);
    }
  };

  // 处理取消
  const handleCancel = () => {
    if (isEditMode && projectId) {
      navigate(`/projects/${projectId}`);
    } else {
      navigate('/projects');
    }
  };

  // 获取技术栈建议
  const getTechStackSuggestions = () => {
    if (!techStackInput) return [];
    return TECHNOLOGY_STACK_OPTIONS.filter(tech =>
      tech.toLowerCase().includes(techStackInput.toLowerCase()) &&
      !formData.technology_stack.includes(tech)
    ).slice(0, 5);
  };

  if (isEditMode && isLoadingProject) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面头部 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleCancel}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            返回
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isEditMode ? '编辑项目' : '创建项目'}
            </h1>
            <p className="mt-1 text-gray-600">
              {isEditMode ? '修改项目信息' : '创建一个新的开发项目'}
            </p>
          </div>
        </div>
      </div>

      {/* 表单 */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 基本信息 */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">基本信息</h3>
          </div>
          <div className="px-6 py-4 space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                项目名称 *
              </label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => handleFieldChange('name', e.target.value)}
                placeholder="输入项目名称"
                className={errors.name ? 'border-red-300' : ''}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                项目描述
              </label>
              <textarea
                id="description"
                rows={3}
                value={formData.description}
                onChange={(e) => handleFieldChange('description', e.target.value)}
                placeholder="简要描述项目的目标和功能"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {isEditMode && (
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                  项目状态
                </label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => handleFieldChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  {PROJECT_STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* 仓库信息 */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">仓库信息</h3>
          </div>
          <div className="px-6 py-4 space-y-4">
            <div>
              <label htmlFor="repository_url" className="block text-sm font-medium text-gray-700 mb-1">
                仓库地址 *
              </label>
              <GitUrlInput
                value={formData.repository_url}
                onChange={(url) => handleFieldChange('repository_url', url)}
                placeholder="输入 Git 仓库地址 (支持 HTTPS 和 SSH 格式)"
                error={errors.repository_url}
                showExamples={false}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="main_branch" className="block text-sm font-medium text-gray-700 mb-1">
                  主分支 *
                </label>
                <Input
                  id="main_branch"
                  type="text"
                  value={formData.main_branch}
                  onChange={(e) => handleFieldChange('main_branch', e.target.value)}
                  placeholder="main"
                  className={errors.main_branch ? 'border-red-300' : ''}
                />
                {errors.main_branch && (
                  <p className="mt-1 text-sm text-red-600">{errors.main_branch}</p>
                )}
              </div>

              <div>
                <label htmlFor="workspace_path" className="block text-sm font-medium text-gray-700 mb-1">
                  工作空间路径 *
                </label>
                <FolderPicker
                  value={formData.workspace_path}
                  onChange={(path) => handleFieldChange('workspace_path', path)}
                  placeholder="选择项目工作空间路径"
                  error={errors.workspace_path}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 技术栈 */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">技术栈</h3>
          </div>
          <div className="px-6 py-4 space-y-4">
            <div>
              <label htmlFor="tech_stack_input" className="block text-sm font-medium text-gray-700 mb-1">
                添加技术栈
              </label>
              <div className="relative">
                <Input
                  id="tech_stack_input"
                  type="text"
                  value={techStackInput}
                  onChange={(e) => {
                    setTechStackInput(e.target.value);
                    setShowTechStackSuggestions(true);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (techStackInput.trim()) {
                        handleAddTechStack(techStackInput.trim());
                      }
                    }
                  }}
                  placeholder="输入技术栈名称，按Enter添加"
                />
                
                {/* 技术栈建议下拉列表 */}
                {showTechStackSuggestions && techStackInput && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                    {getTechStackSuggestions().map((tech) => (
                      <button
                        key={tech}
                        type="button"
                        onClick={() => handleAddTechStack(tech)}
                        className="w-full px-3 py-2 text-left hover:bg-gray-100 focus:bg-gray-100"
                      >
                        {tech}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 已选择的技术栈 */}
            {formData.technology_stack.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  已选择的技术栈
                </label>
                <div className="flex flex-wrap gap-2">
                  {formData.technology_stack.map((tech) => (
                    <span
                      key={tech}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                    >
                      {tech}
                      <button
                        type="button"
                        onClick={() => handleRemoveTechStack(tech)}
                        className="ml-2 text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 提交按钮 */}
        <div className="flex items-center justify-end space-x-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
          >
            取消
          </Button>
          <Button
            type="submit"
            disabled={createProjectMutation.isPending || updateProjectMutation.isPending}
          >
            {createProjectMutation.isPending || updateProjectMutation.isPending
              ? (isEditMode ? '更新中...' : '创建中...')
              : (isEditMode ? '更新项目' : '创建项目')}
          </Button>
        </div>
      </form>
    </div>
  );
}
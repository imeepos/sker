import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProject, useUpdateProject, useDeleteProject } from '../shared/hooks/api';
import { Button } from '../shared/components/ui/Button';
import { PROJECT_STATUS_OPTIONS } from '../shared/types/project';
import type { Project } from '../shared/types/project';

/**
 * 项目详情页面
 * 显示项目的完整信息和操作选项
 */
export function ProjectDetail() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);

  const { data: project, isLoading, error } = useProject(projectId);
  const updateProjectMutation = useUpdateProject();
  const deleteProjectMutation = useDeleteProject();

  // 处理返回列表
  const handleBack = () => {
    navigate('/projects');
  };

  // 处理编辑项目
  const handleEdit = () => {
    navigate(`/projects/${projectId}/edit`);
  };

  // 处理状态更新
  const handleStatusUpdate = async (newStatus: string) => {
    if (!project) return;
    
    try {
      await updateProjectMutation.mutateAsync({
        project_id: project.project_id,
        status: newStatus,
      });
    } catch (error) {
      console.error('更新项目状态失败:', error);
    }
  };

  // 处理删除项目
  const handleDelete = async () => {
    if (!project) return;
    
    if (window.confirm('确定要删除这个项目吗？此操作不可撤销。')) {
      try {
        await deleteProjectMutation.mutateAsync(project.project_id);
        navigate('/projects');
      } catch (error) {
        console.error('删除项目失败:', error);
      }
    }
  };

  // 获取状态标签样式
  const getStatusBadge = (status: string) => {
    const statusOption = PROJECT_STATUS_OPTIONS.find(option => option.value === status);
    const colorClasses = {
      blue: 'bg-blue-100 text-blue-800',
      green: 'bg-green-100 text-green-800',
      yellow: 'bg-yellow-100 text-yellow-800',
      gray: 'bg-gray-100 text-gray-800',
      red: 'bg-red-100 text-red-800',
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        colorClasses[statusOption?.color as keyof typeof colorClasses] || colorClasses.gray
      }`}>
        {statusOption?.label || status}
      </span>
    );
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">加载项目详情失败</div>
        <p className="text-gray-600">{error?.message || '项目不存在'}</p>
        <Button onClick={handleBack} className="mt-4">
          返回项目列表
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面头部 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleBack}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            返回
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
            <p className="mt-1 text-gray-600">项目详情</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={handleEdit}
          >
            编辑项目
          </Button>
          <button
            onClick={handleDelete}
            disabled={deleteProjectMutation.isPending}
            className="px-4 py-2 text-sm font-medium text-red-700 bg-red-100 border border-red-300 rounded-md hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {deleteProjectMutation.isPending ? '删除中...' : '删除项目'}
          </button>
        </div>
      </div>

      {/* 项目基本信息 */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">基本信息</h3>
        </div>
        <div className="px-6 py-4 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                项目名称
              </label>
              <p className="text-sm text-gray-900">{project.name}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                项目状态
              </label>
              <div className="flex items-center space-x-3">
                {getStatusBadge(project.status)}
                <select
                  value={project.status}
                  onChange={(e) => handleStatusUpdate(e.target.value)}
                  disabled={updateProjectMutation.isPending}
                  className="text-xs border border-gray-300 rounded px-2 py-1"
                >
                  {PROJECT_STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-500 mb-1">
                项目描述
              </label>
              <p className="text-sm text-gray-900">
                {project.description || '暂无描述'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 仓库信息 */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">仓库信息</h3>
        </div>
        <div className="px-6 py-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              仓库地址
            </label>
            <div className="flex items-center space-x-2">
              <p className="text-sm text-gray-900 font-mono bg-gray-50 px-2 py-1 rounded">
                {project.repository_url}
              </p>
              <button
                onClick={() => navigator.clipboard.writeText(project.repository_url)}
                className="text-blue-600 hover:text-blue-800 text-xs"
              >
                复制
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                主分支
              </label>
              <p className="text-sm text-gray-900 font-mono bg-gray-50 px-2 py-1 rounded inline-block">
                {project.main_branch}
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                工作空间路径
              </label>
              <p className="text-sm text-gray-900 font-mono bg-gray-50 px-2 py-1 rounded">
                {project.workspace_path}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 技术栈 */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">技术栈</h3>
        </div>
        <div className="px-6 py-4">
          {project.technology_stack.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {project.technology_stack.map((tech) => (
                <span
                  key={tech}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                >
                  {tech}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">暂未设置技术栈</p>
          )}
        </div>
      </div>

      {/* 时间信息 */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">时间信息</h3>
        </div>
        <div className="px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                创建时间
              </label>
              <p className="text-sm text-gray-900">{formatDate(project.created_at)}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                最后更新
              </label>
              <p className="text-sm text-gray-900">{formatDate(project.updated_at)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 项目ID信息 */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">系统信息</h3>
        </div>
        <div className="px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                项目ID
              </label>
              <div className="flex items-center space-x-2">
                <p className="text-sm text-gray-900 font-mono bg-gray-50 px-2 py-1 rounded">
                  {project.project_id}
                </p>
                <button
                  onClick={() => navigator.clipboard.writeText(project.project_id)}
                  className="text-blue-600 hover:text-blue-800 text-xs"
                >
                  复制
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                用户ID
              </label>
              <p className="text-sm text-gray-900 font-mono bg-gray-50 px-2 py-1 rounded">
                {project.user_id}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
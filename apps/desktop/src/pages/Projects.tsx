import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjects, useProjectStats, useDeleteProject } from '../shared/hooks/api';
import { Button } from '../shared/components/ui/Button';
import { PROJECT_STATUS_OPTIONS } from '../shared/types/project';
import type { Project } from '../shared/types/project';

/**
 * 项目管理页面
 * 显示项目列表、统计信息和基本操作
 */
export function Projects() {
  const navigate = useNavigate();
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  
  const { data: projects = [], isLoading, error } = useProjects();
  const { data: stats } = useProjectStats();
  const deleteProjectMutation = useDeleteProject();

  // 处理创建项目
  const handleCreateProject = () => {
    navigate('/projects/create');
  };

  // 处理查看项目详情
  const handleViewProject = (projectId: string) => {
    navigate(`/projects/${projectId}`);
  };

  // 处理编辑项目
  const handleEditProject = (projectId: string) => {
    navigate(`/projects/${projectId}/edit`);
  };

  // 处理删除项目
  const handleDeleteProject = async (projectId: string) => {
    if (window.confirm('确定要删除这个项目吗？此操作不可撤销。')) {
      await deleteProjectMutation.mutateAsync(projectId);
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
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">加载项目列表失败</div>
        <p className="text-gray-600">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">项目管理</h1>
          <p className="mt-2 text-gray-600">
            管理你的开发项目和工作空间
          </p>
        </div>
        <Button onClick={handleCreateProject}>
          创建项目
        </Button>
      </div>

      {/* 统计卡片 */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 text-sm font-medium">总</span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">总项目数</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-green-600 text-sm font-medium">活</span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">进行中</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.active}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                  <span className="text-gray-600 text-sm font-medium">完</span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">已完成</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.completed}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <span className="text-yellow-600 text-sm font-medium">停</span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">暂停中</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.paused}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 项目列表 */}
      <div className="bg-white rounded-lg shadow">
        {projects.length === 0 ? (
          <div className="p-6">
            <div className="text-center py-12">
              <div className="w-12 h-12 bg-gray-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
                <span className="text-gray-400 text-xl">📋</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">暂无项目</h3>
              <p className="text-gray-500 mb-4">创建第一个项目开始协同开发</p>
              <Button onClick={handleCreateProject}>
                创建项目
              </Button>
            </div>
          </div>
        ) : (
          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    项目名称
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    描述
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    技术栈
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    状态
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    更新时间
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {projects.map((project) => (
                  <tr key={project.project_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {project.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {project.repository_url}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {project.description || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {project.technology_stack.slice(0, 3).map((tech) => (
                          <span
                            key={tech}
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {tech}
                          </span>
                        ))}
                        {project.technology_stack.length > 3 && (
                          <span className="text-xs text-gray-500">
                            +{project.technology_stack.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(project.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(project.updated_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleViewProject(project.project_id)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          查看
                        </button>
                        <button
                          onClick={() => handleEditProject(project.project_id)}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          编辑
                        </button>
                        <button
                          onClick={() => handleDeleteProject(project.project_id)}
                          className="text-red-600 hover:text-red-900"
                          disabled={deleteProjectMutation.isPending}
                        >
                          删除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
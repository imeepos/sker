import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, Play, Pause, Square } from 'lucide-react';
import { 
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  Label,
} from '../shared/components/ui';
import type { AgentStatus, UpdateAgentRequest } from '../shared/types/agent';
import { AgentCapability } from '../shared/types/agent';
import { AGENT_STATUS_LABELS, AGENT_CAPABILITY_LABELS } from '../shared/types/agent';
import {
  useAgent,
  useDeleteAgent,
  useUpdateAgentStatus,
  useUpdateAgent,
} from '../shared/hooks/api';
import { EditAgentDialog } from '../shared/components/agent';

/**
 * 智能体详情页面
 * 对应后端实体：Agent + AgentWorkHistory + AgentPerformanceMetrics
 */
export function AgentDetails() {
  const { agentId } = useParams<{ agentId: string }>();
  const navigate = useNavigate();
  const [showEditDialog, setShowEditDialog] = useState(false);
  
  // 使用React Query hooks
  const { data: agent, isLoading, error } = useAgent(agentId!);
  const deleteAgentMutation = useDeleteAgent();
  const updateStatusMutation = useUpdateAgentStatus();
  const updateAgentMutation = useUpdateAgent();

  // 更新智能体状态
  const handleUpdateStatus = async (status: string) => {
    if (!agent) return;
    try {
      await updateStatusMutation.mutateAsync({ agentId: agent.agent_id, status });
    } catch (error) {
      console.error('更新智能体状态失败:', error);
    }
  };

  // 删除智能体
  const handleDeleteAgent = async () => {
    if (!agent) return;
    try {
      await deleteAgentMutation.mutateAsync(agent.agent_id);
      navigate('/agents');
    } catch (error) {
      console.error('删除智能体失败:', error);
    }
  };

  // 更新智能体信息
  const handleUpdateAgent = async (data: UpdateAgentRequest) => {
    try {
      await updateAgentMutation.mutateAsync(data);
      setShowEditDialog(false);
    } catch (error) {
      console.error('更新智能体失败:', error);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('zh-CN');
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'working':
        return 'default';
      case 'idle':
        return 'secondary';
      case 'error':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  if (error || !agent) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">
          {error ? `加载失败: ${error.message}` : '智能体不存在'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面头部 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/agents')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回列表
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{agent.name}</h1>
            <p className="mt-1 text-gray-600">
              {agent.description || '暂无描述'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* 状态控制按钮 */}
          {agent.status === 'idle' && (
            <Button
              onClick={() => handleUpdateStatus('working')}
              disabled={updateStatusMutation.isPending}
            >
              <Play className="w-4 h-4 mr-2" />
              {updateStatusMutation.isPending ? '启动中...' : '启动'}
            </Button>
          )}
          
          {agent.status === 'working' && (
            <>
              <Button
                variant="outline"
                onClick={() => handleUpdateStatus('paused')}
                disabled={updateStatusMutation.isPending}
              >
                <Pause className="w-4 h-4 mr-2" />
                {updateStatusMutation.isPending ? '暂停中...' : '暂停'}
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleUpdateStatus('idle')}
                disabled={updateStatusMutation.isPending}
              >
                <Square className="w-4 h-4 mr-2" />
                {updateStatusMutation.isPending ? '停止中...' : '停止'}
              </Button>
            </>
          )}
          
          {agent.status === 'paused' && (
            <Button
              onClick={() => handleUpdateStatus('working')}
              disabled={updateStatusMutation.isPending}
            >
              <Play className="w-4 h-4 mr-2" />
              {updateStatusMutation.isPending ? '继续中...' : '继续'}
            </Button>
          )}

          <Button 
            variant="outline" 
            onClick={() => setShowEditDialog(true)}
          >
            <Edit className="w-4 h-4 mr-2" />
            编辑
          </Button>
          
          <Button
            variant="destructive"
            onClick={handleDeleteAgent}
            disabled={deleteAgentMutation.isPending}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {deleteAgentMutation.isPending ? '删除中...' : '删除'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧主要内容 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 基本信息 */}
          <Card>
            <CardHeader>
              <CardTitle>基本信息</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>智能体ID</Label>
                  <p className="text-sm text-muted-foreground">{agent.agent_id}</p>
                </div>
                <div className="space-y-2">
                  <Label>状态</Label>
                  <div>
                    <Badge variant={getStatusVariant(agent.status)}>
                      {AGENT_STATUS_LABELS[agent.status as AgentStatus]}
                    </Badge>
                  </div>
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>描述</Label>
                  <p className="text-sm text-muted-foreground">{agent.description || '无描述'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 能力 */}
          <Card>
            <CardHeader>
              <CardTitle>能力配置</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {agent.capabilities.map((capability) => (
                  <Badge key={capability} variant="secondary" className="text-sm">
                    {AGENT_CAPABILITY_LABELS[capability as AgentCapability] || capability}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 提示词模板 */}
          <Card>
            <CardHeader>
              <CardTitle>提示词模板</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-4 rounded-lg text-sm whitespace-pre-wrap overflow-auto">
                {agent.prompt_template}
              </pre>
            </CardContent>
          </Card>

          {/* 配置信息 */}
          {agent.config && Object.keys(agent.config).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>智能体配置</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted p-4 rounded-lg text-sm whitespace-pre-wrap overflow-auto max-h-64">
                  {JSON.stringify(agent.config, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}

          {/* Git 配置 */}
          {agent.git_config && Object.keys(agent.git_config).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Git 配置</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted p-4 rounded-lg text-sm whitespace-pre-wrap overflow-auto max-h-64">
                  {JSON.stringify(agent.git_config, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}

          {/* 技能档案 */}
          {agent.skill_profile && (
            <Card>
              <CardHeader>
                <CardTitle>技能档案</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted p-4 rounded-lg text-sm whitespace-pre-wrap overflow-auto max-h-64">
                  {JSON.stringify(agent.skill_profile, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}

          {/* 技能评估 */}
          {agent.skill_assessments && (
            <Card>
              <CardHeader>
                <CardTitle>技能评估</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted p-4 rounded-lg text-sm whitespace-pre-wrap overflow-auto max-h-64">
                  {JSON.stringify(agent.skill_assessments, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}

          {/* 性能趋势 */}
          {agent.performance_trend && (
            <Card>
              <CardHeader>
                <CardTitle>性能趋势</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted p-4 rounded-lg text-sm whitespace-pre-wrap overflow-auto max-h-64">
                  {JSON.stringify(agent.performance_trend, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}
        </div>

        {/* 右侧侧边栏 */}
        <div className="space-y-6">
          {/* 性能统计 */}
          <Card>
            <CardHeader>
              <CardTitle>性能统计</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">完成任务</span>
                  <span className="font-medium">{agent.total_tasks_completed}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">成功率</span>
                  <span className="font-medium">{(agent.success_rate * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">平均完成时间</span>
                  <span className="font-medium">{agent.average_completion_time}min</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 时间信息 */}
          <Card>
            <CardHeader>
              <CardTitle>时间信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>创建时间</Label>
                <p className="text-sm text-muted-foreground">{formatDate(agent.created_at)}</p>
              </div>
              <div className="space-y-2">
                <Label>更新时间</Label>
                <p className="text-sm text-muted-foreground">{formatDate(agent.updated_at)}</p>
              </div>
              <div className="space-y-2">
                <Label>最后活跃</Label>
                <p className="text-sm text-muted-foreground">{formatDate(agent.last_active_at)}</p>
              </div>
            </CardContent>
          </Card>

          {/* 快速操作 */}
          <Card>
            <CardHeader>
              <CardTitle>快速操作</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                查看工作历史
              </Button>
              <Button variant="outline" className="w-full justify-start">
                查看任务记录
              </Button>
              <Button variant="outline" className="w-full justify-start">
                导出配置
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 编辑智能体对话框 */}
      {agent && (
        <EditAgentDialog
          isOpen={showEditDialog}
          onClose={() => setShowEditDialog(false)}
          onSubmit={handleUpdateAgent}
          agent={agent}
          isSubmitting={updateAgentMutation.isPending}
        />
      )}
    </div>
  );
}
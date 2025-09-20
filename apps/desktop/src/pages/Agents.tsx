import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, MoreVertical, Play, Pause, Square } from 'lucide-react';
import { 
  Button,
  Input,
  Dialog,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Badge,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Textarea,
  Checkbox,
  Label,
} from '../shared/components/ui';
import type { Agent, AgentStatus, CreateAgentRequest } from '../shared/types/agent';
import { AgentCapability } from '../shared/types/agent';
import { AGENT_STATUS_LABELS, AGENT_CAPABILITY_LABELS } from '../shared/types/agent';
import {
  useAgents,
  useCreateAgent,
  useDeleteAgent,
  useUpdateAgentStatus,
} from '../shared/hooks/api';

/**
 * 智能体管理页面
 * 对应后端实体：Agent + AgentWorkHistory + AgentPerformanceMetrics
 */
export function Agents() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  
  // 使用React Query hooks
  const { data: agents = [], isLoading, error } = useAgents();
  const createAgentMutation = useCreateAgent();
  const deleteAgentMutation = useDeleteAgent();
  const updateStatusMutation = useUpdateAgentStatus();

  // 创建智能体
  const handleCreateAgent = async (data: CreateAgentRequest) => {
    try {
      await createAgentMutation.mutateAsync(data);
      setShowCreateDialog(false);
    } catch (error) {
      console.error('创建智能体失败:', error);
    }
  };

  // 更新智能体状态
  const handleUpdateStatus = async (agentId: string, status: string) => {
    try {
      await updateStatusMutation.mutateAsync({ agentId, status });
    } catch (error) {
      console.error('更新智能体状态失败:', error);
    }
  };

  // 删除智能体
  const handleDeleteAgent = async (agentId: string) => {
    try {
      await deleteAgentMutation.mutateAsync(agentId);
    } catch (error) {
      console.error('删除智能体失败:', error);
    }
  };

  // 过滤智能体
  const filteredAgents = agents.filter(agent => {
    const matchesSearch = agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         agent.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !selectedStatus || selectedStatus === 'all' || agent.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">加载失败: {error.message}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">智能体管理</h1>
          <p className="mt-2 text-gray-600">
            管理AI Agent、配置能力和监控性能
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          创建智能体
        </Button>
      </div>

      {/* 搜索和过滤 */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="搜索智能体..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="所有状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">所有状态</SelectItem>
            <SelectItem value="idle">空闲</SelectItem>
            <SelectItem value="working">工作中</SelectItem>
            <SelectItem value="paused">暂停</SelectItem>
            <SelectItem value="offline">离线</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 智能体列表 */}
      {filteredAgents.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <div className="w-12 h-12 bg-gray-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
                <span className="text-gray-400 text-xl">🤖</span>
              </div>
              <CardTitle className="mb-2">
                {agents.length === 0 ? '暂无智能体' : '未找到匹配的智能体'}
              </CardTitle>
              <CardDescription className="mb-4">
                {agents.length === 0 ? '配置第一个AI Agent开始协同工作' : '尝试调整搜索条件'}
              </CardDescription>
              {agents.length === 0 && (
                <Button onClick={() => setShowCreateDialog(true)}>
                  创建智能体
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAgents.map((agent) => (
            <AgentCard
              key={agent.agent_id}
              agent={agent}
              onUpdateStatus={handleUpdateStatus}
              onDelete={handleDeleteAgent}
              onViewDetails={(agent) => {
                navigate(`/agents/${agent.agent_id}`);
              }}
              isUpdating={updateStatusMutation.isPending}
              isDeleting={deleteAgentMutation.isPending}
            />
          ))}
        </div>
      )}

      {/* 创建智能体对话框 */}
      <CreateAgentDialog
        isOpen={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onSubmit={handleCreateAgent}
        isSubmitting={createAgentMutation.isPending}
      />

    </div>
  );
}

// 智能体卡片组件
interface AgentCardProps {
  agent: Agent;
  onUpdateStatus: (agentId: string, status: string) => void;
  onDelete: (agentId: string) => void;
  onViewDetails: (agent: Agent) => void;
  isUpdating?: boolean;
  isDeleting?: boolean;
}

function AgentCard({ agent, onUpdateStatus, onDelete, onViewDetails, isUpdating, isDeleting }: AgentCardProps) {
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

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{agent.name}</CardTitle>
            <CardDescription className="line-clamp-2 mt-1">
              {agent.description}
            </CardDescription>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onViewDetails(agent)}>
                查看详情
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onDelete(agent.agent_id)}
                disabled={isDeleting}
                className="text-red-600"
              >
                {isDeleting ? '删除中...' : '删除'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 状态和统计 */}
        <div className="flex items-center justify-between">
          <Badge variant={getStatusVariant(agent.status)}>
            {AGENT_STATUS_LABELS[agent.status as AgentStatus] || agent.status}
          </Badge>
          
          <div className="text-sm text-muted-foreground">
            成功率: {(agent.success_rate * 100).toFixed(1)}%
          </div>
        </div>

        {/* 能力标签 */}
        <div className="flex flex-wrap gap-2">
          {agent.capabilities.slice(0, 3).map((capability) => (
            <Badge 
              key={capability} 
              variant="secondary" 
              className="text-xs"
            >
              {AGENT_CAPABILITY_LABELS[capability as AgentCapability] || capability}
            </Badge>
          ))}
          {agent.capabilities.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{agent.capabilities.length - 3}
            </Badge>
          )}
        </div>
      </CardContent>

      <CardFooter className="pt-0">
        {/* 操作按钮 */}
        <div className="flex items-center space-x-2 w-full">
          {agent.status === 'idle' && (
            <Button
              size="sm"
              onClick={() => onUpdateStatus(agent.agent_id, 'working')}
              disabled={isUpdating}
              className="flex-1"
            >
              <Play className="w-3 h-3 mr-1" />
              {isUpdating ? '启动中...' : '启动'}
            </Button>
          )}
          
          {agent.status === 'working' && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onUpdateStatus(agent.agent_id, 'paused')}
                disabled={isUpdating}
                className="flex-1"
              >
                <Pause className="w-3 h-3 mr-1" />
                {isUpdating ? '暂停中...' : '暂停'}
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => onUpdateStatus(agent.agent_id, 'idle')}
                disabled={isUpdating}
                className="flex-1"
              >
                <Square className="w-3 h-3 mr-1" />
                {isUpdating ? '停止中...' : '停止'}
              </Button>
            </>
          )}
          
          {agent.status === 'paused' && (
            <Button
              size="sm"
              onClick={() => onUpdateStatus(agent.agent_id, 'working')}
              disabled={isUpdating}
              className="flex-1"
            >
              <Play className="w-3 h-3 mr-1" />
              {isUpdating ? '继续中...' : '继续'}
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}

// 创建智能体对话框
interface CreateAgentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateAgentRequest) => void;
  isSubmitting?: boolean;
}

function CreateAgentDialog({ isOpen, onClose, onSubmit, isSubmitting }: CreateAgentDialogProps) {
  const [formData, setFormData] = useState<CreateAgentRequest>({
    name: '',
    description: '',
    prompt_template: '',
    capabilities: [],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({
      name: '',
      description: '',
      prompt_template: '',
      capabilities: [],
    });
  };

  const handleCapabilityToggle = (capability: string) => {
    setFormData(prev => ({
      ...prev,
      capabilities: prev.capabilities.includes(capability)
        ? prev.capabilities.filter(c => c !== capability)
        : [...prev.capabilities, capability]
    }));
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="创建智能体"
      className="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="agent-name">名称</Label>
          <Input
            id="agent-name"
            required
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="输入智能体名称"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="agent-description">描述</Label>
          <Textarea
            id="agent-description"
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="输入智能体描述"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="agent-prompt">提示词模板</Label>
          <Textarea
            id="agent-prompt"
            rows={4}
            required
            value={formData.prompt_template}
            onChange={(e) => setFormData(prev => ({ ...prev, prompt_template: e.target.value }))}
            placeholder="输入智能体的提示词模板"
          />
        </div>

        <div className="space-y-3">
          <Label>能力</Label>
          <div className="grid grid-cols-2 gap-3">
            {Object.values(AgentCapability).map((capability) => (
              <div key={capability} className="flex items-center space-x-2">
                <Checkbox
                  id={`capability-${capability}`}
                  checked={formData.capabilities.includes(capability)}
                  onCheckedChange={() => handleCapabilityToggle(capability)}
                />
                <Label 
                  htmlFor={`capability-${capability}`}
                  className="text-sm font-normal cursor-pointer"
                >
                  {AGENT_CAPABILITY_LABELS[capability]}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            取消
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? '创建中...' : '创建'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}


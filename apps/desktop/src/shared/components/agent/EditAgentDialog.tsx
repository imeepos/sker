import { useState, useEffect } from 'react';
import { 
  Button,
  Dialog,
  Input,
  Label,
  Textarea,
  Checkbox,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../ui';
import type { Agent, UpdateAgentRequest } from '../../types/agent';
import { AgentCapability, AGENT_CAPABILITY_LABELS } from '../../types/agent';

interface EditAgentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: UpdateAgentRequest) => void;
  agent: Agent;
  isSubmitting?: boolean;
}

/**
 * 编辑智能体对话框组件
 */
export function EditAgentDialog({ 
  isOpen, 
  onClose, 
  onSubmit, 
  agent, 
  isSubmitting = false 
}: EditAgentDialogProps) {
  const [formData, setFormData] = useState<UpdateAgentRequest>({
    agent_id: agent.agent_id,
    name: agent.name,
    description: agent.description || '',
    prompt_template: agent.prompt_template,
    capabilities: [...agent.capabilities],
  });

  const [configJson, setConfigJson] = useState<string>('');
  const [gitConfigJson, setGitConfigJson] = useState<string>('');
  const [jsonErrors, setJsonErrors] = useState<{
    config?: string;
    gitConfig?: string;
  }>({});

  // 当 agent 变化时重置表单数据
  useEffect(() => {
    setFormData({
      agent_id: agent.agent_id,
      name: agent.name,
      description: agent.description || '',
      prompt_template: agent.prompt_template,
      capabilities: [...agent.capabilities],
    });

    // 格式化 JSON 配置
    try {
      setConfigJson(agent.config ? JSON.stringify(agent.config, null, 2) : '{}');
    } catch (error) {
      setConfigJson('{}');
    }

    try {
      setGitConfigJson(agent.git_config ? JSON.stringify(agent.git_config, null, 2) : '{}');
    } catch (error) {
      setGitConfigJson('{}');
    }

    setJsonErrors({});
  }, [agent]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 验证并解析 JSON 配置
    let config = {};
    let gitConfig = {};
    const errors: { config?: string; gitConfig?: string } = {};

    try {
      config = configJson.trim() ? JSON.parse(configJson) : {};
    } catch (error) {
      errors.config = '配置格式不正确，请检查 JSON 语法';
    }

    try {
      gitConfig = gitConfigJson.trim() ? JSON.parse(gitConfigJson) : {};
    } catch (error) {
      errors.gitConfig = 'Git 配置格式不正确，请检查 JSON 语法';
    }

    if (errors.config || errors.gitConfig) {
      setJsonErrors(errors);
      return;
    }

    // 提交数据
    const submitData: UpdateAgentRequest = {
      ...formData,
      config,
      git_config: gitConfig,
    };

    onSubmit(submitData);
  };

  const handleCapabilityToggle = (capability: string) => {
    setFormData(prev => ({
      ...prev,
      capabilities: prev.capabilities?.includes(capability)
        ? prev.capabilities.filter(c => c !== capability)
        : [...(prev.capabilities || []), capability]
    }));
  };

  const handleReset = () => {
    setFormData({
      agent_id: agent.agent_id,
      name: agent.name,
      description: agent.description || '',
      prompt_template: agent.prompt_template,
      capabilities: [...agent.capabilities],
    });

    setConfigJson(agent.config ? JSON.stringify(agent.config, null, 2) : '{}');
    setGitConfigJson(agent.git_config ? JSON.stringify(agent.git_config, null, 2) : '{}');
    setJsonErrors({});
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`编辑智能体 - ${agent.name}`}
      className="max-w-4xl max-h-[90vh] overflow-y-auto"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">基本信息</TabsTrigger>
            <TabsTrigger value="prompt">提示词模板</TabsTrigger>
            <TabsTrigger value="config">配置</TabsTrigger>
          </TabsList>

          {/* 基本信息 */}
          <TabsContent value="basic" className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="agent-name">名称 *</Label>
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

            <div className="space-y-3">
              <Label>能力 *</Label>
              <div className="grid grid-cols-2 gap-3">
                {Object.values(AgentCapability).map((capability) => (
                  <div key={capability} className="flex items-center space-x-2">
                    <Checkbox
                      id={`capability-${capability}`}
                      checked={formData.capabilities?.includes(capability) || false}
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
              {(!formData.capabilities || formData.capabilities.length === 0) && (
                <p className="text-sm text-red-500">请至少选择一个能力</p>
              )}
            </div>
          </TabsContent>

          {/* 提示词模板 */}
          <TabsContent value="prompt" className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="agent-prompt">提示词模板 *</Label>
              <Textarea
                id="agent-prompt"
                rows={12}
                required
                value={formData.prompt_template}
                onChange={(e) => setFormData(prev => ({ ...prev, prompt_template: e.target.value }))}
                placeholder="输入智能体的提示词模板"
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                提示词模板将决定智能体的行为和回答风格
              </p>
            </div>
          </TabsContent>

          {/* 配置 */}
          <TabsContent value="config" className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="agent-config">智能体配置 (JSON)</Label>
              <Textarea
                id="agent-config"
                rows={8}
                value={configJson}
                onChange={(e) => {
                  setConfigJson(e.target.value);
                  // 清除之前的错误
                  if (jsonErrors.config) {
                    setJsonErrors(prev => ({ ...prev, config: undefined }));
                  }
                }}
                placeholder="输入智能体配置 (JSON 格式)"
                className="font-mono text-sm"
              />
              {jsonErrors.config && (
                <p className="text-sm text-red-500">{jsonErrors.config}</p>
              )}
              <p className="text-xs text-muted-foreground">
                配置智能体的行为参数，如工作偏好、输出格式等
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="agent-git-config">Git 配置 (JSON)</Label>
              <Textarea
                id="agent-git-config"
                rows={6}
                value={gitConfigJson}
                onChange={(e) => {
                  setGitConfigJson(e.target.value);
                  // 清除之前的错误
                  if (jsonErrors.gitConfig) {
                    setJsonErrors(prev => ({ ...prev, gitConfig: undefined }));
                  }
                }}
                placeholder="输入 Git 配置 (JSON 格式)"
                className="font-mono text-sm"
              />
              {jsonErrors.gitConfig && (
                <p className="text-sm text-red-500">{jsonErrors.gitConfig}</p>
              )}
              <p className="text-xs text-muted-foreground">
                配置智能体的 Git 操作行为，如提交信息格式、分支策略等
              </p>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-between pt-4 border-t">
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleReset}
            disabled={isSubmitting}
          >
            重置
          </Button>
          
          <div className="flex space-x-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose} 
              disabled={isSubmitting}
            >
              取消
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || !formData.capabilities?.length}
            >
              {isSubmitting ? '保存中...' : '保存'}
            </Button>
          </div>
        </div>
      </form>
    </Dialog>
  );
}
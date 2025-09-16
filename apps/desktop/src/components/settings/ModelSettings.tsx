import { Label } from '../ui/label'
import { Button } from '../ui/Button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Slider } from '../ui/slider'
import { useSettingsStore } from '../../stores/settings'
import { useChatStore } from '../../stores/chat'

export function ModelSettings() {
  const {
    settings,
    updateSettings,
    form,
    setFormDirty,
  } = useSettingsStore()

  const { models } = useChatStore()

  const handleModelChange = (value: string) => {
    setFormDirty(true)
    // 直接更新设置，而不是等待保存按钮
    updateSettings({
      section: 'model',
      settings: { currentModel: value }
    })
  }

  const handleTemperatureChange = (value: number[]) => {
    setFormDirty(true)
    updateSettings({
      section: 'model',
      settings: { temperature: value[0] }
    })
  }

  const handleMaxTokensChange = (value: number[]) => {
    setFormDirty(true)
    updateSettings({
      section: 'model',
      settings: { maxTokens: value[0] }
    })
  }

  const handleTopPChange = (value: number[]) => {
    setFormDirty(true)
    updateSettings({
      section: 'model',
      settings: { topP: value[0] }
    })
  }

  const handlePresencePenaltyChange = (value: number[]) => {
    setFormDirty(true)
    updateSettings({
      section: 'model',
      settings: { presencePenalty: value[0] }
    })
  }

  const handleFrequencyPenaltyChange = (value: number[]) => {
    setFormDirty(true)
    updateSettings({
      section: 'model',
      settings: { frequencyPenalty: value[0] }
    })
  }

  const resetToDefaults = async () => {
    try {
      await updateSettings({
        section: 'model',
        settings: {
          currentModel: 'gpt-4',
          temperature: 0.7,
          maxTokens: 4096,
          topP: 1,
          presencePenalty: 0,
          frequencyPenalty: 0,
        }
      })
    } catch (error) {
      console.error('重置模型设置失败:', error)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-2">AI 模型设置</h3>
        <p className="text-sm text-muted-foreground">
          配置 AI 模型参数，影响对话的质量和风格
        </p>
      </div>

      {/* 模型选择 */}
      <div className="space-y-2">
        <Label htmlFor="model">当前模型</Label>
        <Select
          value={settings.model.currentModel ?? 'gpt-4'}
          onValueChange={handleModelChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="选择AI模型" />
          </SelectTrigger>
          <SelectContent>
            {models.map((model) => (
              <SelectItem key={model.id} value={model.id}>
                <div className="flex flex-col">
                  <span className="font-medium">{model.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {model.description}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          不同的模型有不同的能力和特点，选择最适合您需求的模型
        </p>
      </div>

      {/* 温度设置 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="temperature">创造性 (Temperature)</Label>
          <span className="text-sm text-muted-foreground">
            {(settings.model.temperature ?? 0.7).toFixed(2)}
          </span>
        </div>
        <Slider
          value={[settings.model.temperature ?? 0.7]}
          onValueChange={handleTemperatureChange}
          min={0}
          max={2}
          step={0.1}
          className="w-full"
        />
        <p className="text-xs text-muted-foreground">
          较低的值使回答更加专注和确定性，较高的值使回答更加创造性和随机
        </p>
      </div>

      {/* 最大令牌数 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="maxTokens">最大令牌数</Label>
          <span className="text-sm text-muted-foreground">
            {settings.model.maxTokens ?? 4096}
          </span>
        </div>
        <Slider
          value={[settings.model.maxTokens ?? 4096]}
          onValueChange={handleMaxTokensChange}
          min={256}
          max={8192}
          step={256}
          className="w-full"
        />
        <p className="text-xs text-muted-foreground">
          控制每次回答的最大长度，更高的值允许更长的回答
        </p>
      </div>

      {/* Top-p 核心采样 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="topP">核心采样 (Top-p)</Label>
          <span className="text-sm text-muted-foreground">
            {(settings.model.topP ?? 1).toFixed(2)}
          </span>
        </div>
        <Slider
          value={[settings.model.topP ?? 1]}
          onValueChange={handleTopPChange}
          min={0}
          max={1}
          step={0.05}
          className="w-full"
        />
        <p className="text-xs text-muted-foreground">
          控制词汇选择的多样性，1.0 表示考虑所有可能的词汇
        </p>
      </div>

      {/* 存在惩罚 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="presencePenalty">存在惩罚</Label>
          <span className="text-sm text-muted-foreground">
            {(settings.model.presencePenalty ?? 0).toFixed(2)}
          </span>
        </div>
        <Slider
          value={[settings.model.presencePenalty ?? 0]}
          onValueChange={handlePresencePenaltyChange}
          min={-2}
          max={2}
          step={0.1}
          className="w-full"
        />
        <p className="text-xs text-muted-foreground">
          控制模型讨论新话题的倾向，正值鼓励谈论新话题
        </p>
      </div>

      {/* 频率惩罚 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="frequencyPenalty">频率惩罚</Label>
          <span className="text-sm text-muted-foreground">
            {(settings.model.frequencyPenalty ?? 0).toFixed(2)}
          </span>
        </div>
        <Slider
          value={[settings.model.frequencyPenalty ?? 0]}
          onValueChange={handleFrequencyPenaltyChange}
          min={-2}
          max={2}
          step={0.1}
          className="w-full"
        />
        <p className="text-xs text-muted-foreground">
          控制重复单词的惩罚程度，正值减少重复
        </p>
      </div>

      {/* 操作按钮 */}
      <div className="flex gap-2 pt-4 border-t">
        <Button
          variant="outline"
          onClick={resetToDefaults}
          disabled={form.isLoading}
        >
          恢复默认设置
        </Button>
        
        <div className="flex-1" />
        
        {form.error && (
          <span className="text-sm text-destructive self-center">
            {form.error}
          </span>
        )}
        
        {form.isLoading && (
          <span className="text-sm text-muted-foreground self-center">
            正在保存...
          </span>
        )}
      </div>
    </div>
  )
}
import { Label } from '../ui/label'
import { Button } from '../ui/Button'
import { Switch } from '../ui/switch'
import { Slider } from '../ui/slider'
import { useSettingsStore } from '../../stores/settings'

export function ConversationSettings() {
  const {
    settings,
    updateSettings,
    form,
    setFormDirty,
  } = useSettingsStore()

  const handleMaxHistoryChange = (value: number[]) => {
    setFormDirty(true)
    updateSettings({
      section: 'conversation',
      settings: { maxHistoryMessages: value[0] }
    })
  }

  const handleAutoSaveChange = (checked: boolean) => {
    setFormDirty(true)
    updateSettings({
      section: 'conversation',
      settings: { autoSave: checked }
    })
  }

  const handleShowTimestampChange = (checked: boolean) => {
    setFormDirty(true)
    updateSettings({
      section: 'conversation',
      settings: { showTimestamp: checked }
    })
  }

  const handleEnableMarkdownChange = (checked: boolean) => {
    setFormDirty(true)
    updateSettings({
      section: 'conversation',
      settings: { enableMarkdown: checked }
    })
  }

  const handleEnableCodeHighlightChange = (checked: boolean) => {
    setFormDirty(true)
    updateSettings({
      section: 'conversation',
      settings: { enableCodeHighlight: checked }
    })
  }

  const handleStreamResponseChange = (checked: boolean) => {
    setFormDirty(true)
    updateSettings({
      section: 'conversation',
      settings: { streamResponse: checked }
    })
  }

  const resetToDefaults = async () => {
    try {
      await updateSettings({
        section: 'conversation',
        settings: {
          maxHistoryMessages: 50,
          autoSave: true,
          showTimestamp: true,
          enableMarkdown: true,
          enableCodeHighlight: true,
          streamResponse: true,
        }
      })
    } catch (error) {
      console.error('重置对话设置失败:', error)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-2">对话设置</h3>
        <p className="text-sm text-muted-foreground">
          配置对话行为和显示选项
        </p>
      </div>

      {/* 历史消息数量 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>历史消息数量</Label>
          <span className="text-sm text-muted-foreground">
            {settings.conversation.maxHistoryMessages} 条
          </span>
        </div>
        <Slider
          value={[settings.conversation.maxHistoryMessages]}
          onValueChange={handleMaxHistoryChange}
          min={10}
          max={200}
          step={10}
          className="w-full"
        />
        <p className="text-xs text-muted-foreground">
          控制发送给AI的历史消息数量，更多的历史消息可以提供更好的上下文，但会消耗更多token
        </p>
      </div>

      {/* 自动保存 */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Label>自动保存对话</Label>
          <p className="text-xs text-muted-foreground">
            自动保存对话内容到本地数据库
          </p>
        </div>
        <Switch
          checked={settings.conversation.autoSave}
          onCheckedChange={handleAutoSaveChange}
        />
      </div>

      {/* 显示时间戳 */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Label>显示消息时间</Label>
          <p className="text-xs text-muted-foreground">
            在消息旁边显示发送时间
          </p>
        </div>
        <Switch
          checked={settings.conversation.showTimestamp}
          onCheckedChange={handleShowTimestampChange}
        />
      </div>

      {/* Markdown 渲染 */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Label>Markdown 格式化</Label>
          <p className="text-xs text-muted-foreground">
            启用 Markdown 格式渲染，支持**粗体**、*斜体*等
          </p>
        </div>
        <Switch
          checked={settings.conversation.enableMarkdown}
          onCheckedChange={handleEnableMarkdownChange}
        />
      </div>

      {/* 代码高亮 */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Label>代码语法高亮</Label>
          <p className="text-xs text-muted-foreground">
            为代码块启用语法高亮显示
          </p>
        </div>
        <Switch
          checked={settings.conversation.enableCodeHighlight}
          onCheckedChange={handleEnableCodeHighlightChange}
        />
      </div>

      {/* 流式响应 */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Label>流式响应</Label>
          <p className="text-xs text-muted-foreground">
            启用实时显示AI响应，而不是等待完整回答
          </p>
        </div>
        <Switch
          checked={settings.conversation.streamResponse}
          onCheckedChange={handleStreamResponseChange}
        />
      </div>

      {/* 预览区域 */}
      <div className="space-y-2">
        <Label>效果预览</Label>
        <div className="p-4 border rounded-lg bg-background space-y-3">
          {/* 时间戳预览 */}
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs">U</div>
            <div className="flex-1">
              <div className="bg-muted/50 rounded-lg p-3 text-sm">
                这是一个示例用户消息
                {settings.conversation.showTimestamp && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {new Date().toLocaleTimeString('zh-CN', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* AI响应预览 */}
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs">AI</div>
            <div className="flex-1">
              <div className="bg-primary/5 rounded-lg p-3 text-sm space-y-2">
                {settings.conversation.enableMarkdown ? (
                  <div>
                    这是一个 <strong>示例AI响应</strong>，支持 <em>格式化文本</em>
                  </div>
                ) : (
                  <div>
                    这是一个 **示例AI响应**，支持 *格式化文本*
                  </div>
                )}
                
                {settings.conversation.enableCodeHighlight ? (
                  <div className="bg-muted/80 rounded p-2 font-mono text-xs">
                    <div className="text-blue-600">function</div> hello() {"{"}
                    <div className="ml-2 text-green-600">console.log</div>(<div className="text-orange-600">"Hello!"</div>);
                    {"}"}
                  </div>
                ) : (
                  <div className="bg-muted/80 rounded p-2 font-mono text-xs">
                    function hello() {"{"}<br/>
                    {"  "}console.log("Hello!");<br/>
                    {"}"}
                  </div>
                )}
                
                {settings.conversation.showTimestamp && (
                  <div className="text-xs text-muted-foreground">
                    {new Date().toLocaleTimeString('zh-CN', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
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
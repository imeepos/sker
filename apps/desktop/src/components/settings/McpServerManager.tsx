import { useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/Button'
import { Badge } from '../ui/badge'
import { Switch } from '../ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { useSettingsStore } from '../../stores/settings'
import { McpServerConfig } from '../../types/settings'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Server
} from 'lucide-react'

export function McpServerManager() {
  const { settings, setFormDirty, setFormError } = useSettingsStore()
  const [mcpServers, setMcpServers] = useState<McpServerConfig[]>(settings.system.mcpServers)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingServer, setEditingServer] = useState<McpServerConfig | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  // 获取MCP服务器列表
  const loadMcpServers = async () => {
    try {
      const servers = await invoke<McpServerConfig[]>('get_mcp_servers')
      setMcpServers(servers)
    } catch (error) {
      console.error('加载MCP服务器列表失败:', error)
      setFormError(`加载MCP服务器列表失败: ${error}`)
    }
  }

  // 切换MCP服务器启用状态
  const toggleMcpServer = async (serverName: string, enabled: boolean) => {
    try {
      await invoke('toggle_mcp_server', { name: serverName, enabled })
      await loadMcpServers()
      setFormDirty(true)
    } catch (error) {
      console.error('切换MCP服务器状态失败:', error)
      setFormError(`切换MCP服务器状态失败: ${error}`)
    }
  }

  // 删除MCP服务器
  const deleteMcpServer = async (serverName: string) => {
    if (!confirm(`确定要删除MCP服务器 "${serverName}" 吗？`)) {
      return
    }
    
    try {
      await invoke('delete_mcp_server', { name: serverName })
      await loadMcpServers()
      setFormDirty(true)
    } catch (error) {
      console.error('删除MCP服务器失败:', error)
      setFormError(`删除MCP服务器失败: ${error}`)
    }
  }

  // 打开编辑对话框
  const openEditDialog = (server: McpServerConfig) => {
    setEditingServer(server)
    setIsEditDialogOpen(true)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              MCP 服务器管理
            </CardTitle>
            <CardDescription>
              配置和管理模型上下文协议（MCP）服务器，用于扩展AI模型的工具能力
            </CardDescription>
          </div>
          <Button 
            onClick={() => setIsAddDialogOpen(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            添加服务器
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {mcpServers.length === 0 ? (
          <div className="text-center py-8">
            <Server className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">暂无MCP服务器</h3>
            <p className="text-muted-foreground mb-4">
              添加MCP服务器来扩展AI模型的工具能力，如文件系统访问、API调用等。
            </p>
            <Button 
              onClick={() => setIsAddDialogOpen(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              添加第一个服务器
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {mcpServers.map((server) => (
              <div
                key={server.name}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-medium">{server.name}</h4>
                    <Badge variant={server.enabled ? "default" : "secondary"}>
                      {server.enabled ? "已启用" : "已禁用"}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div>命令: <code className="text-xs bg-muted px-1 py-0.5 rounded">{server.command}</code></div>
                    {server.args.length > 0 && (
                      <div>参数: <code className="text-xs bg-muted px-1 py-0.5 rounded">{server.args.join(' ')}</code></div>
                    )}
                    {server.env && Object.keys(server.env).length > 0 && (
                      <div>环境变量: {Object.keys(server.env).length} 个</div>
                    )}
                    {server.startupTimeoutMs && (
                      <div>启动超时: {server.startupTimeoutMs}ms</div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={server.enabled}
                    onCheckedChange={(enabled) => toggleMcpServer(server.name, enabled)}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEditDialog(server)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteMcpServer(server.name)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 添加对话框 */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <McpServerDialog
            onClose={() => setIsAddDialogOpen(false)}
            onSave={loadMcpServers}
          />
        </Dialog>

        {/* 编辑对话框 */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          {editingServer && (
            <McpServerDialog
              server={editingServer}
              onClose={() => {
                setIsEditDialogOpen(false)
                setEditingServer(null)
              }}
              onSave={loadMcpServers}
            />
          )}
        </Dialog>
      </CardContent>
    </Card>
  )
}

// MCP服务器配置对话框组件
interface McpServerDialogProps {
  server?: McpServerConfig
  onClose: () => void
  onSave: () => void
}

function McpServerDialog({ server, onClose, onSave }: McpServerDialogProps) {
  const [formData, setFormData] = useState<McpServerConfig>(
    server || {
      name: '',
      command: '',
      args: [],
      env: {},
      startupTimeoutMs: 5000,
      enabled: true,
    }
  )
  const [argsText, setArgsText] = useState(server?.args.join(' ') || '')
  const [envText, setEnvText] = useState(
    server?.env ? Object.entries(server.env).map(([k, v]) => `${k}=${v}`).join('\n') : ''
  )
  const [isSaving, setIsSaving] = useState(false)

  const isEdit = !!server

  const handleSave = async () => {
    try {
      setIsSaving(true)

      // 解析参数
      const args = argsText.trim() ? argsText.trim().split(/\s+/) : []
      
      // 解析环境变量
      const env: Record<string, string> = {}
      if (envText.trim()) {
        envText.split('\n').forEach(line => {
          const [key, ...valueParts] = line.split('=')
          if (key && valueParts.length > 0) {
            env[key.trim()] = valueParts.join('=').trim()
          }
        })
      }

      const serverConfig: McpServerConfig = {
        ...formData,
        args,
        env: Object.keys(env).length > 0 ? env : undefined,
      }

      if (isEdit) {
        await invoke('update_mcp_server', { 
          name: server.name, 
          config: serverConfig 
        })
      } else {
        await invoke('add_mcp_server', { config: serverConfig })
      }

      onSave()
      onClose()
    } catch (error) {
      console.error('保存MCP服务器失败:', error)
      alert(`保存MCP服务器失败: ${error}`)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>
          {isEdit ? '编辑MCP服务器' : '添加MCP服务器'}
        </DialogTitle>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="name">服务器名称 *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="例如：filesystem、weather-api"
            disabled={isEdit}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="command">命令 *</Label>
          <Input
            id="command"
            value={formData.command}
            onChange={(e) => setFormData({ ...formData, command: e.target.value })}
            placeholder="例如：npx、python、./my-mcp-server"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="args">命令参数</Label>
          <Input
            id="args"
            value={argsText}
            onChange={(e) => setArgsText(e.target.value)}
            placeholder="例如：@modelcontextprotocol/server-filesystem /path/to/folder"
          />
          <p className="text-xs text-muted-foreground">
            用空格分隔多个参数
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="env">环境变量</Label>
          <textarea
            id="env"
            className="w-full min-h-[80px] px-3 py-2 border rounded-md text-sm"
            value={envText}
            onChange={(e) => setEnvText(e.target.value)}
            placeholder="每行一个，格式：KEY=value&#10;例如：&#10;PATH=/usr/local/bin&#10;NODE_ENV=production"
          />
          <p className="text-xs text-muted-foreground">
            每行一个环境变量，格式：KEY=value
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="timeout">启动超时时间 (ms)</Label>
          <Input
            id="timeout"
            type="number"
            value={formData.startupTimeoutMs || ''}
            onChange={(e) => setFormData({ 
              ...formData, 
              startupTimeoutMs: e.target.value ? parseInt(e.target.value) : undefined 
            })}
            placeholder="5000"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            checked={formData.enabled}
            onCheckedChange={(enabled) => setFormData({ ...formData, enabled })}
          />
          <Label>启用服务器</Label>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button variant="outline" onClick={onClose}>
          取消
        </Button>
        <Button 
          onClick={handleSave}
          disabled={!formData.name || !formData.command || isSaving}
        >
          {isSaving ? '保存中...' : (isEdit ? '更新' : '添加')}
        </Button>
      </div>
    </DialogContent>
  )
}
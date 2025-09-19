import { useParams } from 'react-router-dom'
import { AgentList } from '../components/multi-agent/Agent/AgentList'
import { AgentDetails } from '../components/multi-agent/Agent/AgentDetails'
import { useMultiAgentStore } from '../stores/multiAgent'

interface AgentsPageProps {
  /** 创建Agent回调 */
  onCreateAgent?: () => void
  /** 编辑Agent回调 */
  onEditAgent?: (agent: any) => void
  /** 删除Agent回调 */
  onDeleteAgent?: (agentId: string) => void
}

/**
 * Agent页面组件 - 处理Agent相关的路由
 */
export function AgentsPage({
  onCreateAgent,
  onEditAgent,
  onDeleteAgent
}: AgentsPageProps) {
  const { agentId } = useParams<{ agentId: string }>()
  const { agents } = useMultiAgentStore()

  // 获取当前选中的Agent信息
  const selectedAgent = agentId 
    ? agents.find(a => a.id === agentId)
    : null

  // 处理Agent选择
  const handleAgentSelect = (_id: string) => {
    // 路由导航会在父组件中处理
  }

  if (!agentId) {
    return (
      <AgentList
        agents={agents}
        selectedAgentId={null}
        onAgentSelect={handleAgentSelect}
        onCreateAgent={onCreateAgent}
        searchPlaceholder="搜索Agent..."
      />
    )
  }

  if (!selectedAgent) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <h3 className="font-medium mb-2">Agent不存在</h3>
          <p className="text-sm">请选择一个有效的Agent</p>
        </div>
      </div>
    )
  }

  return (
    <AgentDetails
      agent={selectedAgent}
      onEdit={() => onEditAgent?.(selectedAgent)}
      onDelete={() => onDeleteAgent?.(selectedAgent.id)}
    />
  )
}
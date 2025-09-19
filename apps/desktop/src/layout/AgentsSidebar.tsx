import { useNavigate, useParams } from 'react-router-dom'
import { AgentList } from '../components/multi-agent/Agent/AgentList'
import { useMultiAgentStore } from '../stores/multiAgent'

interface AgentsSidebarProps {
  /** 创建Agent回调 */
  onCreateAgent?: () => void
}

/**
 * Agent侧边栏组件 - 在侧边栏显示Agent列表
 */
export function AgentsSidebar({
  onCreateAgent
}: AgentsSidebarProps) {
  const navigate = useNavigate()
  const { agentId } = useParams<{ agentId: string }>()
  const { agents } = useMultiAgentStore()

  // 处理Agent选择
  const handleAgentSelect = (id: string) => {
    navigate(`/agents/${id}`)
  }

  return (
    <AgentList
      agents={agents}
      selectedAgentId={agentId || null}
      onAgentSelect={handleAgentSelect}
      onCreateAgent={onCreateAgent}
      searchPlaceholder="搜索Agent..."
    />
  )
}
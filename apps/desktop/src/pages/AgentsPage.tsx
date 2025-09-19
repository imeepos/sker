import { AgentsLayout } from '../layout/layouts'
import { AgentsPage as AgentsPageComponent } from '../layout/AgentsPage'

/**
 * Agent管理页面 - 使用AgentsLayout布局
 */
export function AgentsPage() {
  return (
    <AgentsLayout
      onCreateAgent={() => {
        console.log('创建Agent功能待实现')
      }}
    >
      <AgentsPageComponent
        onCreateAgent={() => {
          console.log('创建Agent功能待实现')
        }}
        onEditAgent={(agent) => {
          console.log('编辑Agent功能待实现', agent)
        }}
        onDeleteAgent={(agentId) => {
          console.log('删除Agent功能待实现', agentId)
        }}
      />
    </AgentsLayout>
  )
}
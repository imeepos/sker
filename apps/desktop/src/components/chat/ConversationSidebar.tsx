import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/Button'
import { ScrollArea } from '../ui/scroll-area'
import { Separator } from '../ui/separator'
import { useChatStore } from '../../stores/chat'
import { cn, truncateText, formatTime } from '../../lib/utils'
import { Plus, MessageSquare, Trash2 } from 'lucide-react'

interface ConversationSidebarProps {
  className?: string
}

export function ConversationSidebar({ className }: ConversationSidebarProps) {
  const {
    conversations,
    activeConversationId,
    setActiveConversation,
    createConversation,
    deleteConversation
  } = useChatStore()

  const handleCreateConversation = async () => {
    console.log('用户点击新建对话按钮')
    try {
      console.log('调用createConversation...')
      const conversationId = await createConversation()
      console.log('对话创建成功，ID:', conversationId)
      
      // 使用setTimeout确保状态已经更新
      setTimeout(() => {
        console.log('延迟检查 - 当前对话列表:', conversations.length)
        console.log('延迟检查 - 当前活跃对话ID:', activeConversationId)
      }, 100)
    } catch (error) {
      console.error('创建对话失败:', error)
    }
  }

  const handleDeleteConversation = (id: string, event: React.MouseEvent) => {
    event.stopPropagation()
    if (confirm('确定要删除这个对话吗？')) {
      deleteConversation(id)
    }
  }

  return (
    <Card className={cn("flex flex-col h-full", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">对话历史</CardTitle>
          <Button 
            size="sm" 
            onClick={handleCreateConversation}
            className="h-7 px-2"
          >
            <Plus className="w-3 h-3 mr-1" />
            新建
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-0 flex-1 overflow-hidden">
        <ScrollArea className="h-full px-3">
          <div className="space-y-1 pb-3">
            {conversations.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">还没有对话历史</p>
              </div>
            ) : (
              conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={cn(
                    "group relative rounded-lg p-3 cursor-pointer transition-colors",
                    "hover:bg-accent hover:text-accent-foreground",
                    activeConversationId === conversation.id && 
                    "bg-accent text-accent-foreground"
                  )}
                  onClick={() => {
                    console.log('用户点击对话:', conversation.id)
                    setActiveConversation(conversation.id)
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm leading-tight mb-1">
                        {truncateText(conversation.title, 30)}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {conversation.messages.length} 条消息
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatTime(conversation.updatedAt)}
                      </p>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 shrink-0"
                      onClick={(e) => handleDeleteConversation(conversation.id, e)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>

                  {/* 预览最后一条消息 */}
                  {conversation.messages.length > 0 && (
                    <>
                      <Separator className="my-2" />
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {truncateText(
                          conversation.messages[conversation.messages.length - 1].content,
                          50
                        )}
                      </p>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
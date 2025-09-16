interface ChatStatusBarProps {
  loading?: boolean
  attachmentCount?: number
  canSend?: boolean
  message?: string
}

export function ChatStatusBar({ 
  loading = false, 
  attachmentCount = 0, 
  canSend = false,
  message = ''
}: ChatStatusBarProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border">
      <div className="container mx-auto px-4 py-2">
        <div className="flex justify-between items-center text-xs text-muted-foreground">
          <span>
            {loading ? "正在生成回复..." : (
              <>
                按 Enter 发送，Shift + Enter 换行
                {attachmentCount > 0 && ` • ${attachmentCount} 个附件`}
              </>
            )}
          </span>
          
          {canSend && (
            <span className="text-primary">
              {attachmentCount > 0 && !message.trim() ? "发送附件" : "按 Enter 发送"}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
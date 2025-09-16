import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import { useCallback } from 'react'

// 简化的聊天Hook - 直接使用Tauri命令，借鉴CLI实现
export function useChat() {
  
  const sendMessage = useCallback(async (content: string, conversationId?: string) => {
    try {
      await invoke('send_message', {
        request: {
          conversation_id: conversationId,
          content,
        }
      })
    } catch (error) {
      console.error('发送消息失败:', error)
      throw error
    }
  }, [])

  const createConversation = useCallback(async () => {
    try {
      const conversationId = await invoke<string>('create_conversation')
      return conversationId
    } catch (error) {
      console.error('创建对话失败:', error)
      throw error
    }
  }, [])

  const listenToConversation = useCallback(async (conversationId: string, callback: (data: any) => void) => {
    try {
      const unlisten = await listen(`conversation_events_${conversationId}`, (event) => {
        callback(event.payload)
      })
      return unlisten
    } catch (error) {
      console.error('监听对话事件失败:', error)
      throw error
    }
  }, [])

  return {
    sendMessage,
    createConversation,
    listenToConversation,
  }
}
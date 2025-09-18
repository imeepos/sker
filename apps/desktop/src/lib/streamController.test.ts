/**
 * 流控制器测试
 */

import { StreamMessageController, DEFAULT_STREAM_CONFIG } from './streamController'

// 简单的测试函数
export function testStreamController() {
  console.log('=== 流控制器测试开始 ===')
  
  const controller = new StreamMessageController(DEFAULT_STREAM_CONFIG)
  const updates: Array<{conversationId: string, messageId: string, content: string}> = []
  
  // 设置回调以捕获更新
  controller.setOnContentUpdate((conversationId, messageId, content) => {
    updates.push({ conversationId, messageId, content })
    console.log(`更新: ${conversationId}/${messageId} -> ${content}`)
  })
  
  const conversationId = 'test-conv'
  const messageId = 'test-msg'
  
  // 测试1: 基本增量消息
  console.log('\n--- 测试1: 基本增量消息 ---')
  controller.beginStream(conversationId, messageId)
  
  controller.pushDelta(conversationId, messageId, '你好')
  controller.pushDelta(conversationId, messageId, '，')
  controller.pushDelta(conversationId, messageId, '世界！')
  
  // 手动触发提交
  controller.finalizeStream(conversationId, messageId)
  
  // 测试2: 最终消息覆盖
  console.log('\n--- 测试2: 最终消息覆盖 ---')
  const messageId2 = 'test-msg-2'
  controller.applyFinalMessage(conversationId, messageId2, '这是完整的最终消息')
  
  // 测试3: 语义感知提交
  console.log('\n--- 测试3: 语义感知提交 ---')
  const messageId3 = 'test-msg-3'
  controller.beginStream(conversationId, messageId3)
  
  controller.pushDelta(conversationId, messageId3, '这是第一句话。')
  controller.pushDelta(conversationId, messageId3, '这是第二句话！')
  controller.pushDelta(conversationId, messageId3, '这是第三句话？')
  
  controller.finalizeStream(conversationId, messageId3)
  
  // 输出测试结果
  console.log('\n=== 测试结果 ===')
  console.log('捕获的更新数量:', updates.length)
  updates.forEach((update, index) => {
    console.log(`${index + 1}. ${update.conversationId}/${update.messageId}: "${update.content}"`)
  })
  
  // 获取流状态信息
  const streamInfo = controller.getStreamInfo(conversationId)
  console.log('\n流状态信息:', streamInfo)
  
  console.log('\n=== 流控制器测试完成 ===')
  
  return {
    updateCount: updates.length,
    updates,
    streamInfo
  }
}

// 在浏览器环境中运行测试
if (typeof window !== 'undefined') {
  // 将测试函数暴露到全局，方便在控制台调用
  (window as any).testStreamController = testStreamController
}
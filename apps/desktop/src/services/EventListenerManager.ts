// 全局事件监听器管理器 - 解决热重载导致的重复监听器问题
import { listen } from '@tauri-apps/api/event'

/**
 * 全局事件监听器管理器
 * 确保在整个应用生命周期内只有一个监听器实例，防止热重载导致的重复监听器
 */
class EventListenerManager {
  private static instance: EventListenerManager | null = null
  private listeners = new Map<string, () => void>()
  private handlers = new Map<string, Function>()

  private constructor() {
    console.log('创建事件监听器管理器实例')
  }

  static getInstance(): EventListenerManager {
    if (!EventListenerManager.instance) {
      EventListenerManager.instance = new EventListenerManager()
    }
    return EventListenerManager.instance
  }

  /**
   * 添加事件监听器（如果已存在会先清理旧的）
   */
  async addListener(eventName: string, handler: Function): Promise<void> {
    console.log('添加事件监听器:', eventName)
    
    // 如果已存在，先清理旧的监听器
    await this.removeListener(eventName)
    
    // 注册新监听器
    const unlisten = await listen(eventName, handler as any)
    this.listeners.set(eventName, unlisten)
    this.handlers.set(eventName, handler)
    
    console.log('监听器添加成功:', eventName, '当前监听器数量:', this.listeners.size)
  }

  /**
   * 移除指定事件监听器
   */
  async removeListener(eventName: string): Promise<void> {
    const unlisten = this.listeners.get(eventName)
    if (unlisten) {
      console.log('移除事件监听器:', eventName)
      unlisten()
      this.listeners.delete(eventName)
      this.handlers.delete(eventName)
    }
  }

  /**
   * 获取当前监听器数量
   */
  getListenerCount(): number {
    return this.listeners.size
  }

  /**
   * 获取所有监听器的事件名称
   */
  getListenerNames(): string[] {
    return Array.from(this.listeners.keys())
  }

  /**
   * 清理所有监听器
   */
  async cleanup(): Promise<void> {
    console.log('清理所有事件监听器，数量:', this.listeners.size)
    
    for (const [eventName] of this.listeners) {
      await this.removeListener(eventName)
    }
    
    console.log('所有监听器清理完成')
  }

  /**
   * 强制重置 - 用于彻底清理旧版本的监听器
   */
  static forceReset(): void {
    console.log('强制重置事件监听器管理器')
    if (EventListenerManager.instance) {
      EventListenerManager.instance.cleanup()
    }
    EventListenerManager.instance = null
    
    // 强制垃圾回收建议（虽然不能保证立即执行）
    if ((window as any).gc) {
      (window as any).gc()
    }
  }

  /**
   * 重置管理器实例（用于热重载）
   */
  static reset(): void {
    if (EventListenerManager.instance) {
      EventListenerManager.instance.cleanup()
      EventListenerManager.instance = null
      console.log('事件监听器管理器已重置')
    }
  }
}

// 全局实例
export const eventListenerManager = EventListenerManager.getInstance()

// Vite HMR集成 - 热重载时清理资源
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    console.log('Vite HMR: 清理事件监听器管理器')
    EventListenerManager.reset()
  })
  
  import.meta.hot.accept(() => {
    console.log('Vite HMR: 事件监听器管理器模块已更新')
  })
}

export default EventListenerManager
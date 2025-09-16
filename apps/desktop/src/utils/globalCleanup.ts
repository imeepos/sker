// 全局清理工具 - 彻底解决热重载遗留的监听器问题
import EventListenerManager from '../services/EventListenerManager'

/**
 * 全局清理工具
 * 用于在应用启动时清理所有可能遗留的监听器
 */
class GlobalCleanupManager {
  private static hasInitialized = false

  /**
   * 初始化全局清理 - 只执行一次
   */
  static initialize(): void {
    if (this.hasInitialized) {
      console.log('全局清理已初始化，跳过')
      return
    }

    console.log('开始全局清理初始化...')
    
    // 强制重置事件监听器管理器
    EventListenerManager.forceReset()
    
    // 清理可能的全局变量污染
    this.cleanupGlobalState()
    
    // 设置页面卸载时的清理
    this.setupUnloadCleanup()
    
    this.hasInitialized = true
    console.log('全局清理初始化完成')
  }

  /**
   * 清理全局状态
   */
  private static cleanupGlobalState(): void {
    // 清理可能存在的全局变量
    if ((window as any).__MCP_LISTENERS__) {
      console.log('清理全局MCP监听器变量')
      delete (window as any).__MCP_LISTENERS__
    }

    if ((window as any).__TAURI_LISTENERS__) {
      console.log('清理全局Tauri监听器变量')
      delete (window as any).__TAURI_LISTENERS__
    }
  }

  /**
   * 设置页面卸载时的清理
   */
  private static setupUnloadCleanup(): void {
    window.addEventListener('beforeunload', () => {
      console.log('页面卸载，执行清理...')
      EventListenerManager.forceReset()
    })

    // 监听页面隐藏事件（用于热重载场景）
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        console.log('页面隐藏，预备清理...')
        // 不立即清理，因为可能只是切换标签页
      }
    })
  }

  /**
   * 手动触发清理（用于调试）
   */
  static manualCleanup(): void {
    console.log('手动触发全局清理')
    EventListenerManager.forceReset()
  }
}

// 立即初始化
GlobalCleanupManager.initialize()

// 暴露到全局对象用于调试
if (typeof window !== 'undefined') {
  (window as any).__CLEANUP_MANAGER__ = GlobalCleanupManager
}

export default GlobalCleanupManager
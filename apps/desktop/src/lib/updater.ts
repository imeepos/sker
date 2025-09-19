// 更新器功能模块
import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import { ask, message } from '@tauri-apps/plugin-dialog';

/**
 * 检查并处理应用程序更新
 */
export async function checkForAppUpdates(): Promise<void> {
  try {
    const update = await check();
    
    if (update?.available) {
      const yes = await ask(
        `发现新版本 ${update.version}！\n\n更新内容：\n${update.body}\n\n是否立即更新？`,
        { 
          title: '应用更新',
          kind: 'info'
        }
      );
      
      if (yes) {
        console.log('开始下载更新...');
        await update.downloadAndInstall();
        
        console.log('更新安装完成，正在重启...');
        await relaunch();
      }
    } else {
      await message('当前已是最新版本', { title: '检查更新' });
    }
  } catch (error) {
    console.error('检查更新失败:', error);
    await message('检查更新失败，请稍后重试', { title: '错误' });
  }
}

/**
 * 带重试机制的更新检查
 */
export async function checkForAppUpdatesWithRetry(maxRetries = 3): Promise<void> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await checkForAppUpdates();
      return;
    } catch (error) {
      console.error(`更新检查失败 (尝试 ${i + 1}/${maxRetries}):`, error);
      
      if (i === maxRetries - 1) {
        // 最后一次尝试失败，显示错误信息
        await message('更新检查失败，请检查网络连接后重试', { title: '错误' });
      } else {
        // 等待后重试
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }
}

/**
 * 静默检查更新（不显示"已是最新版本"消息）
 */
export async function checkForAppUpdatesQuiet(): Promise<boolean> {
  try {
    const update = await check();
    
    if (update?.available) {
      const yes = await ask(
        `发现新版本 ${update.version}！\n\n更新内容：\n${update.body}\n\n是否立即更新？`,
        { 
          title: '应用更新',
          kind: 'info'
        }
      );
      
      if (yes) {
        console.log('开始下载更新...');
        await update.downloadAndInstall();
        
        console.log('更新安装完成，正在重启...');
        await relaunch();
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error('静默更新检查失败:', error);
    return false;
  }
}
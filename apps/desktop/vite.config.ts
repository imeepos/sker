import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// @ts-expect-error process is a nodejs global
const host = process.env.TAURI_DEV_HOST;

// https://vite.dev/config/
export default defineConfig(async () => ({
  plugins: [react()],

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent Vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // 3. tell Vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },
  
  // 性能优化配置
  build: {
    // 代码分割优化
    rollupOptions: {
      output: {
        manualChunks: {
          // React 相关库单独打包
          'react-vendor': ['react', 'react-dom'],
          // Radix UI 组件库单独打包
          'radix-vendor': [
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-slot',
            '@radix-ui/react-dialog',
            '@radix-ui/react-scroll-area',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-accordion',
            '@radix-ui/react-avatar',
            '@radix-ui/react-collapsible',
            '@radix-ui/react-separator'
          ],
          // Tauri API 单独打包
          'tauri-vendor': [
            '@tauri-apps/api',
            '@tauri-apps/plugin-dialog',
            '@tauri-apps/plugin-opener',
            '@tauri-apps/plugin-process',
            '@tauri-apps/plugin-updater'
          ],
          // 状态管理库单独打包
          'store-vendor': ['zustand'],
          // 工具库单独打包
          'utils-vendor': ['clsx', 'class-variance-authority', 'lucide-react', 'tailwind-merge'],
          // Markdown 相关库单独打包
          'markdown-vendor': ['react-markdown', 'react-syntax-highlighter']
        }
      }
    },
    // 增加chunk大小警告阈值到1MB
    chunkSizeWarningLimit: 1000,
    // 启用sourcemap用于调试
    sourcemap: false,
    // 压缩配置，使用esbuild更快
    minify: 'esbuild'
  },
  
  // 路径别名配置
  resolve: {
    alias: {
      '@': '/src',
    }
  }
}));

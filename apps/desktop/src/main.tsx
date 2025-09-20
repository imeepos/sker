import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './app';
import './index.css';

/**
 * 应用程序入口点
 * 基于v3方案设计，包含完整的路由和菜单配置
 * 
 * 架构特点：
 * - 九大功能模块菜单，严格对应后端实体
 * - React Router v6 路由管理
 * - 响应式布局设计
 * - 基于shadcn/ui的组件体系
 */
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

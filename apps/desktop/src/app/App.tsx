import { RouterProvider } from 'react-router-dom';
import { Providers } from './providers';
import { router } from './router';

/**
 * 应用程序根组件
 * 提供路由和全局Provider配置
 */
function App() {
  return (
    <Providers>
      <div className="App">
        <RouterProvider router={router} />
      </div>
    </Providers>
  );
}

export default App;
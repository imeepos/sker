/**
 * 系统设置页面
 * 对应后端实体：AppSettings + McpServerConfig + User
 */
export function Settings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">系统设置</h1>
        <p className="mt-2 text-gray-600">
          应用配置、MCP服务器和个人偏好设置
        </p>
      </div>

      {/* 设置导航 */}
      <div className="bg-white rounded-lg shadow">
        <div className="divide-y divide-gray-200">
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900">应用设置</h3>
            <p className="mt-1 text-sm text-gray-500">配置应用程序的基本设置</p>
            <div className="mt-4">
              <button className="text-blue-600 hover:text-blue-500 text-sm font-medium">
                配置 →
              </button>
            </div>
          </div>

          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900">MCP服务器</h3>
            <p className="mt-1 text-sm text-gray-500">管理模型上下文协议服务器</p>
            <div className="mt-4">
              <button className="text-blue-600 hover:text-blue-500 text-sm font-medium">
                管理 →
              </button>
            </div>
          </div>

          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900">API配置</h3>
            <p className="mt-1 text-sm text-gray-500">配置外部API连接和认证</p>
            <div className="mt-4">
              <button className="text-blue-600 hover:text-blue-500 text-sm font-medium">
                配置 →
              </button>
            </div>
          </div>

          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900">用户偏好</h3>
            <p className="mt-1 text-sm text-gray-500">个性化界面和行为设置</p>
            <div className="mt-4">
              <button className="text-blue-600 hover:text-blue-500 text-sm font-medium">
                设置 →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
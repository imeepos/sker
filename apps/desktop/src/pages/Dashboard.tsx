/**
 * 工作台页面
 * 提供系统概览和快速操作入口
 */
export function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">工作台</h1>
        <p className="mt-2 text-gray-600">
          欢迎使用多智能体协同开发系统
        </p>
      </div>

      {/* 快速统计 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 font-semibold">P</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">活跃项目</p>
              <p className="text-2xl font-semibold text-gray-900">0</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-green-600 font-semibold">A</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">运行中的Agent</p>
              <p className="text-2xl font-semibold text-gray-900">0</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                <span className="text-yellow-600 font-semibold">T</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">进行中的任务</p>
              <p className="text-2xl font-semibold text-gray-900">0</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                <span className="text-red-600 font-semibold">C</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">待处理冲突</p>
              <p className="text-2xl font-semibold text-gray-900">0</p>
            </div>
          </div>
        </div>
      </div>

      {/* 快速操作 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">快速操作</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-left">
            <h3 className="font-medium text-gray-900">创建新项目</h3>
            <p className="text-sm text-gray-500 mt-1">开始一个新的开发项目</p>
          </button>
          <button className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-left">
            <h3 className="font-medium text-gray-900">配置新Agent</h3>
            <p className="text-sm text-gray-500 mt-1">添加AI智能体助手</p>
          </button>
          <button className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-left">
            <h3 className="font-medium text-gray-900">开始对话</h3>
            <p className="text-sm text-gray-500 mt-1">与Agent协同工作</p>
          </button>
        </div>
      </div>
    </div>
  );
}
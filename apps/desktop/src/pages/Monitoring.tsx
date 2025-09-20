/**
 * 监控中心页面
 * 对应后端实体：DomainEvent + EventPublishLog
 */
export function Monitoring() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">监控中心</h1>
          <p className="mt-2 text-gray-600">
            系统事件、性能监控和日志分析
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            系统正常
          </span>
        </div>
      </div>

      {/* 实时统计 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 font-semibold">E</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">今日事件</p>
              <p className="text-2xl font-semibold text-gray-900">0</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-green-600 font-semibold">S</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">成功率</p>
              <p className="text-2xl font-semibold text-gray-900">100%</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                <span className="text-yellow-600 font-semibold">L</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">日志条目</p>
              <p className="text-2xl font-semibold text-gray-900">0</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <div className="text-center py-12">
            <div className="w-12 h-12 bg-gray-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
              <span className="text-gray-400 text-xl">📊</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">暂无监控数据</h3>
            <p className="text-gray-500 mb-4">开始使用系统后将显示监控信息</p>
          </div>
        </div>
      </div>
    </div>
  );
}
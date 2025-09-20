/**
 * 智能体管理页面
 * 对应后端实体：Agent + AgentWorkHistory + AgentPerformanceMetrics
 */
export function Agents() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">智能体管理</h1>
          <p className="mt-2 text-gray-600">
            管理AI Agent、配置能力和监控性能
          </p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          创建Agent
        </button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <div className="text-center py-12">
            <div className="w-12 h-12 bg-gray-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
              <span className="text-gray-400 text-xl">🤖</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">暂无智能体</h3>
            <p className="text-gray-500 mb-4">配置第一个AI Agent开始协同工作</p>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
              创建Agent
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
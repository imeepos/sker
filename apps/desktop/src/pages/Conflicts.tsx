/**
 * 冲突处理页面
 * 对应后端实体：Conflict + HumanDecision
 */
export function Conflicts() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">冲突处理</h1>
          <p className="mt-2 text-gray-600">
            冲突检测、分析和人工决策
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            无待处理冲突
          </span>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <div className="text-center py-12">
            <div className="w-12 h-12 bg-gray-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
              <span className="text-gray-400 text-xl">⚡</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">暂无冲突</h3>
            <p className="text-gray-500 mb-4">系统运行正常，无需人工干预</p>
          </div>
        </div>
      </div>
    </div>
  );
}
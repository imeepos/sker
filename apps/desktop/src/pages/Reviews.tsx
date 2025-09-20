/**
 * 代码审查页面
 * 对应后端实体：CodeReview
 */
export function Reviews() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">代码审查</h1>
          <p className="mt-2 text-gray-600">
            代码质量审查和反馈管理
          </p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          发起审查
        </button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <div className="text-center py-12">
            <div className="w-12 h-12 bg-gray-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
              <span className="text-gray-400 text-xl">🔍</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">暂无代码审查</h3>
            <p className="text-gray-500 mb-4">发起第一次代码审查确保质量</p>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
              发起审查
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
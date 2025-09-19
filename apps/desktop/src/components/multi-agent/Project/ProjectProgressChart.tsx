/**
 * ProjectProgressChart组件 - 项目进度趋势图表
 * 展示时间轴进度、里程碑标记和预期vs实际进度对比
 */

import React, { memo, useMemo, useState } from 'react'

interface ProjectProgressChartProps {
  projectId: string
  className?: string
}

// 进度数据点
interface ProgressDataPoint {
  date: Date
  actualProgress: number
  plannedProgress: number
  completedTasks: number
  totalTasks: number
  milestone?: string
}

// 里程碑数据
interface Milestone {
  id: string
  name: string
  date: Date
  status: 'pending' | 'completed' | 'overdue'
  progress: number
}

// 模拟数据生成函数
const generateMockProgressData = (_projectId: string): ProgressDataPoint[] => {
  const startDate = new Date('2024-01-01')
  const endDate = new Date('2024-06-30')
  const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  const dataPoints: ProgressDataPoint[] = []
  
  let actualProgress = 0
  let completedTasks = 0
  const totalTasks = 50

  for (let i = 0; i <= days; i += 7) { // 每周一个数据点
    const currentDate = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000)
    const plannedProgress = (i / days) * 100
    
    // 模拟实际进度（有一些波动）
    const progressIncrement = Math.random() * 3 + 1
    actualProgress = Math.min(actualProgress + progressIncrement, 100)
    
    // 模拟完成的任务数
    completedTasks = Math.floor((actualProgress / 100) * totalTasks)
    
    // 添加一些里程碑
    let milestone: string | undefined
    if (i === Math.floor(days * 0.25)) milestone = '需求分析完成'
    if (i === Math.floor(days * 0.5)) milestone = '设计阶段完成'
    if (i === Math.floor(days * 0.75)) milestone = '开发阶段完成'
    if (i === days) milestone = '项目交付'
    
    dataPoints.push({
      date: currentDate,
      actualProgress: Math.min(actualProgress, 100),
      plannedProgress: Math.min(plannedProgress, 100),
      completedTasks,
      totalTasks,
      milestone
    })
  }
  
  return dataPoints
}

// 生成里程碑数据
const generateMockMilestones = (): Milestone[] => [
  {
    id: '1',
    name: '项目启动',
    date: new Date('2024-01-01'),
    status: 'completed',
    progress: 100
  },
  {
    id: '2', 
    name: '需求分析完成',
    date: new Date('2024-02-15'),
    status: 'completed',
    progress: 100
  },
  {
    id: '3',
    name: '设计阶段完成', 
    date: new Date('2024-03-30'),
    status: 'completed',
    progress: 85
  },
  {
    id: '4',
    name: '开发阶段完成',
    date: new Date('2024-05-15'),
    status: 'pending',
    progress: 65
  },
  {
    id: '5',
    name: '测试完成',
    date: new Date('2024-06-15'),
    status: 'pending', 
    progress: 0
  },
  {
    id: '6',
    name: '项目交付',
    date: new Date('2024-06-30'),
    status: 'pending',
    progress: 0
  }
]

// SVG图表组件
const ProgressChartSVG: React.FC<{
  data: ProgressDataPoint[]
  milestones: Milestone[]
  width: number
  height: number
  showPlanned: boolean
}> = ({ data, milestones, width, height, showPlanned }) => {
  const margin = { top: 20, right: 30, bottom: 40, left: 40 }
  const chartWidth = width - margin.left - margin.right
  const chartHeight = height - margin.top - margin.bottom

  // 计算坐标转换函数
  const minDate = data[0]?.date.getTime() || 0
  const maxDate = data[data.length - 1]?.date.getTime() || 0
  const dateRange = maxDate - minDate

  const xScale = (date: Date) => 
    margin.left + (chartWidth * (date.getTime() - minDate)) / dateRange

  const yScale = (progress: number) => 
    margin.top + chartHeight - (chartHeight * progress) / 100

  // 生成路径数据
  const generatePath = (points: Array<{date: Date, progress: number}>) => {
    if (points.length === 0) return ''
    
    const pathData = points.map((point, index) => {
      const x = xScale(point.date)
      const y = yScale(point.progress)
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`
    }).join(' ')
    
    return pathData
  }

  const actualPath = generatePath(data.map(d => ({ date: d.date, progress: d.actualProgress })))
  const plannedPath = generatePath(data.map(d => ({ date: d.date, progress: d.plannedProgress })))

  return (
    <svg width={width} height={height} className="border rounded">
      {/* 背景网格 */}
      <defs>
        <pattern id="grid" width="40" height="20" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 20" fill="none" stroke="#f3f4f6" strokeWidth="1"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />
      
      {/* Y轴刻度线和标签 */}
      {[0, 25, 50, 75, 100].map(tick => (
        <g key={tick}>
          <line
            x1={margin.left}
            y1={yScale(tick)}
            x2={width - margin.right}
            y2={yScale(tick)}
            stroke="#e5e7eb"
            strokeWidth="1"
            strokeDasharray={tick === 0 || tick === 100 ? "none" : "3,3"}
          />
          <text
            x={margin.left - 10}
            y={yScale(tick) + 4}
            textAnchor="end"
            className="text-xs fill-gray-500"
          >
            {tick}%
          </text>
        </g>
      ))}

      {/* X轴 */}
      <line
        x1={margin.left}
        y1={height - margin.bottom}
        x2={width - margin.right}
        y2={height - margin.bottom}
        stroke="#6b7280"
        strokeWidth="2"
      />

      {/* Y轴 */}
      <line
        x1={margin.left}
        y1={margin.top}
        x2={margin.left}
        y2={height - margin.bottom}
        stroke="#6b7280"
        strokeWidth="2"
      />

      {/* 计划进度线 */}
      {showPlanned && plannedPath && (
        <path
          d={plannedPath}
          fill="none"
          stroke="#9ca3af"
          strokeWidth="2"
          strokeDasharray="5,5"
        />
      )}

      {/* 实际进度线 */}
      {actualPath && (
        <>
          {/* 渐变定义 */}
          <defs>
            <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8"/>
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.8"/>
            </linearGradient>
          </defs>
          <path
            d={actualPath}
            fill="none"
            stroke="url(#progressGradient)"
            strokeWidth="3"
          />
        </>
      )}

      {/* 数据点 */}
      {data.map((point, index) => (
        <g key={index}>
          <circle
            cx={xScale(point.date)}
            cy={yScale(point.actualProgress)}
            r="4"
            fill="#3b82f6"
            stroke="white"
            strokeWidth="2"
          />
          {/* 悬浮提示触发区域 */}
          <circle
            cx={xScale(point.date)}
            cy={yScale(point.actualProgress)}
            r="8"
            fill="transparent"
            className="cursor-pointer"
          >
            <title>
              {point.date.toLocaleDateString()}: {Math.round(point.actualProgress)}%
              ({point.completedTasks}/{point.totalTasks} 任务)
            </title>
          </circle>
        </g>
      ))}

      {/* 里程碑标记 */}
      {milestones.map((milestone) => {
        const x = xScale(milestone.date)
        const y = margin.top + 10
        
        return (
          <g key={milestone.id}>
            {/* 里程碑竖线 */}
            <line
              x1={x}
              y1={y}
              x2={x}
              y2={height - margin.bottom}
              stroke={milestone.status === 'completed' ? '#10b981' : milestone.status === 'overdue' ? '#ef4444' : '#f59e0b'}
              strokeWidth="2"
              strokeDasharray="2,2"
            />
            {/* 里程碑图标 */}
            <circle
              cx={x}
              cy={y}
              r="6"
              fill={milestone.status === 'completed' ? '#10b981' : milestone.status === 'overdue' ? '#ef4444' : '#f59e0b'}
            />
            {/* 里程碑标签 */}
            <text
              x={x}
              y={y - 10}
              textAnchor="middle"
              className="text-xs font-medium"
              fill={milestone.status === 'completed' ? '#059669' : milestone.status === 'overdue' ? '#dc2626' : '#d97706'}
            >
              {milestone.name}
            </text>
          </g>
        )
      })}

      {/* X轴日期标签 */}
      {data.filter((_, index) => index % Math.ceil(data.length / 6) === 0).map((point, index) => (
        <text
          key={index}
          x={xScale(point.date)}
          y={height - margin.bottom + 20}
          textAnchor="middle"
          className="text-xs fill-gray-600"
        >
          {point.date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
        </text>
      ))}
    </svg>
  )
}

// 里程碑列表组件
const MilestoneList: React.FC<{ milestones: Milestone[] }> = ({ milestones }) => {
  const getStatusIcon = (status: Milestone['status']) => {
    switch (status) {
      case 'completed': return '✅'
      case 'overdue': return '🔴'
      default: return '⏳'
    }
  }

  const getStatusColor = (status: Milestone['status']) => {
    switch (status) {
      case 'completed': return 'text-green-600'
      case 'overdue': return 'text-red-600' 
      default: return 'text-yellow-600'
    }
  }

  return (
    <div className="space-y-2">
      {milestones.map(milestone => (
        <div key={milestone.id} className="flex items-center justify-between p-3 bg-white border rounded-lg">
          <div className="flex items-center space-x-3">
            <span className="text-lg">{getStatusIcon(milestone.status)}</span>
            <div>
              <h4 className="font-medium text-gray-900">{milestone.name}</h4>
              <p className="text-sm text-gray-500">
                {milestone.date.toLocaleDateString()}
              </p>
            </div>
          </div>
          
          <div className="text-right">
            <p className={`text-sm font-medium ${getStatusColor(milestone.status)}`}>
              {milestone.progress}%
            </p>
            <p className="text-xs text-gray-500">
              {milestone.status === 'completed' ? '已完成' : 
               milestone.status === 'overdue' ? '已延期' : '进行中'}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

export const ProjectProgressChart: React.FC<ProjectProgressChartProps> = memo(({
  projectId,
  className = ''
}) => {
  const [timeRange, setTimeRange] = useState<'1m' | '3m' | '6m' | 'all'>('3m')
  const [showPlanned, setShowPlanned] = useState(true)
  const [activeTab, setActiveTab] = useState<'chart' | 'milestones'>('chart')

  // 获取进度数据
  const progressData = useMemo(() => {
    const allData = generateMockProgressData(projectId)
    const now = new Date()
    
    switch (timeRange) {
      case '1m':
        return allData.filter(d => d.date >= new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000))
      case '3m':
        return allData.filter(d => d.date >= new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000))
      case '6m':
        return allData.filter(d => d.date >= new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000))
      default:
        return allData
    }
  }, [projectId, timeRange])

  const milestones = useMemo(() => generateMockMilestones(), [])

  // 计算统计信息
  const stats = useMemo(() => {
    if (progressData.length === 0) return null
    
    const latest = progressData[progressData.length - 1]
    const earliest = progressData[0]
    const progressChange = latest.actualProgress - earliest.actualProgress
    const isAheadOfSchedule = latest.actualProgress > latest.plannedProgress
    
    return {
      currentProgress: latest.actualProgress,
      progressChange,
      completedTasks: latest.completedTasks,
      totalTasks: latest.totalTasks,
      isAheadOfSchedule,
      scheduleVariance: latest.actualProgress - latest.plannedProgress
    }
  }, [progressData])

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 头部控制 */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">项目进度趋势</h3>
          <p className="text-sm text-gray-600 mt-1">
            跟踪项目进度变化和里程碑完成情况
          </p>
        </div>

        <div className="flex items-center space-x-4">
          {/* 标签切换 */}
          <div className="flex border border-gray-200 rounded-lg">
            <button
              onClick={() => setActiveTab('chart')}
              className={`px-3 py-1 text-sm rounded-l-lg ${
                activeTab === 'chart'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              进度图表
            </button>
            <button
              onClick={() => setActiveTab('milestones')}
              className={`px-3 py-1 text-sm rounded-r-lg border-l ${
                activeTab === 'milestones'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              里程碑
            </button>
          </div>

          {/* 时间范围选择 */}
          {activeTab === 'chart' && (
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as typeof timeRange)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="1m">最近1个月</option>
              <option value="3m">最近3个月</option>
              <option value="6m">最近6个月</option>
              <option value="all">全部时间</option>
            </select>
          )}
        </div>
      </div>

      {/* 统计卡片 */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">当前进度</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">
                  {Math.round(stats.currentProgress)}%
                </p>
              </div>
              <div className="text-2xl text-blue-600">📊</div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">进度变化</p>
                <p className={`text-2xl font-bold mt-1 ${
                  stats.progressChange >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stats.progressChange >= 0 ? '+' : ''}{Math.round(stats.progressChange)}%
                </p>
              </div>
              <div className="text-2xl">
                {stats.progressChange >= 0 ? '📈' : '📉'}
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">完成任务</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {stats.completedTasks}/{stats.totalTasks}
                </p>
              </div>
              <div className="text-2xl text-green-600">✅</div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">进度状态</p>
                <p className={`text-sm font-medium mt-1 ${
                  stats.isAheadOfSchedule ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stats.isAheadOfSchedule ? '超前' : '滞后'} {Math.abs(Math.round(stats.scheduleVariance))}%
                </p>
              </div>
              <div className="text-2xl">
                {stats.isAheadOfSchedule ? '🚀' : '⚠️'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 主要内容区域 */}
      <div className="bg-white rounded-lg border p-6">
        {activeTab === 'chart' ? (
          <div>
            {/* 图表控制 */}
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-gray-900">进度趋势图</h4>
              <div className="flex items-center space-x-4">
                <label className="flex items-center text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={showPlanned}
                    onChange={(e) => setShowPlanned(e.target.checked)}
                    className="mr-2"
                  />
                  显示计划进度
                </label>
                
                {/* 图例 */}
                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center">
                    <div className="w-4 h-0.5 bg-gradient-to-r from-blue-500 to-green-500 mr-2" />
                    <span>实际进度</span>
                  </div>
                  {showPlanned && (
                    <div className="flex items-center">
                      <div className="w-4 h-0.5 border-t-2 border-dashed border-gray-400 mr-2" />
                      <span>计划进度</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 进度图表 */}
            <div className="overflow-x-auto">
              <ProgressChartSVG
                data={progressData}
                milestones={milestones}
                width={800}
                height={400}
                showPlanned={showPlanned}
              />
            </div>
          </div>
        ) : (
          <div>
            <h4 className="font-medium text-gray-900 mb-4">项目里程碑</h4>
            <MilestoneList milestones={milestones} />
          </div>
        )}
      </div>
    </div>
  )
})

ProjectProgressChart.displayName = 'ProjectProgressChart'
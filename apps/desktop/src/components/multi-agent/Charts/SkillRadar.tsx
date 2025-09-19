/**
 * SkillRadar组件 - Agent技能可视化雷达图
 */

import React, { useMemo, useRef, useEffect } from 'react'
import { cn } from '../../../lib/utils'

interface SkillRadarProps {
  capabilities: string[]
  agentName?: string
  size?: number
  className?: string
  showLabels?: boolean
  compareWith?: string[] // 用于对比的另一组技能
}

// 技能分类和权重配置
const SKILL_CATEGORIES = {
  // 编程语言
  'Programming Languages': {
    skills: ['JavaScript', 'TypeScript', 'Python', 'Rust', 'Go', 'Java', 'C++', 'C#'],
    color: '#3B82F6', // blue
    weight: 1.2
  },
  // 前端技术
  'Frontend': {
    skills: ['React', 'Vue.js', 'Angular', 'HTML/CSS', 'Webpack', 'Vite', 'Tailwind'],
    color: '#10B981', // green
    weight: 1.0
  },
  // 后端技术
  'Backend': {
    skills: ['Node.js', 'Express', 'FastAPI', 'Django', 'Spring Boot', 'API Design'],
    color: '#F59E0B', // yellow
    weight: 1.1
  },
  // 数据库
  'Database': {
    skills: ['PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'SQLite'],
    color: '#8B5CF6', // purple
    weight: 0.9
  },
  // 工具和平台
  'Tools & Platforms': {
    skills: ['Git', 'Docker', 'Kubernetes', 'AWS', 'Tauri', 'Electron'],
    color: '#EF4444', // red
    weight: 0.8
  },
  // 测试
  'Testing': {
    skills: ['Jest', 'Cypress', 'Selenium', 'Unit Testing', 'Integration Testing'],
    color: '#06B6D4', // cyan
    weight: 1.0
  },
  // 软技能
  'Soft Skills': {
    skills: ['Code Review', 'Documentation', 'Security', 'Performance', 'Debugging'],
    color: '#84CC16', // lime
    weight: 0.7
  }
}

// 将技能分类到对应的类别
const categorizeSkills = (capabilities: string[]) => {
  const categorized: Record<string, { skills: string[], score: number }> = {}
  
  Object.entries(SKILL_CATEGORIES).forEach(([category, config]) => {
    const matchingSkills = capabilities.filter(skill => 
      config.skills.some(categorySkill => 
        categorySkill.toLowerCase().includes(skill.toLowerCase()) ||
        skill.toLowerCase().includes(categorySkill.toLowerCase())
      )
    )
    
    // 计算分数：匹配的技能数量 / 该类别总技能数量 * 权重
    const score = (matchingSkills.length / config.skills.length) * config.weight * 100
    
    categorized[category] = {
      skills: matchingSkills,
      score: Math.min(score, 100) // 限制在100以内
    }
  })
  
  return categorized
}

export const SkillRadar: React.FC<SkillRadarProps> = ({
  capabilities,
  agentName,
  size = 300,
  className,
  showLabels = true,
  compareWith
}) => {
  const svgRef = useRef<SVGSVGElement>(null)
  
  const categorizedSkills = useMemo(() => categorizeSkills(capabilities), [capabilities])
  const compareSkills = useMemo(() => 
    compareWith ? categorizeSkills(compareWith) : null, 
    [compareWith]
  )
  
  // 雷达图数据
  const radarData = useMemo(() => {
    return Object.entries(SKILL_CATEGORIES).map(([category, config]) => ({
      category,
      score: categorizedSkills[category]?.score || 0,
      compareScore: compareSkills?.[category]?.score || 0,
      color: config.color,
      skills: categorizedSkills[category]?.skills || []
    }))
  }, [categorizedSkills, compareSkills])
  
  // 绘制雷达图
  useEffect(() => {
    if (!svgRef.current) return
    
    const svg = svgRef.current
    const centerX = size / 2
    const centerY = size / 2
    const radius = size / 2 - 40
    const categories = radarData.length
    
    // 清空之前的内容
    svg.innerHTML = ''
    
    // 创建渐变定义
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs')
    
    // 为每个类别创建渐变
    radarData.forEach((data, index) => {
      const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'radialGradient')
      gradient.id = `gradient-${index}`
      gradient.innerHTML = `
        <stop offset="0%" stop-color="${data.color}" stop-opacity="0.6"/>
        <stop offset="100%" stop-color="${data.color}" stop-opacity="0.1"/>
      `
      defs.appendChild(gradient)
    })
    
    svg.appendChild(defs)
    
    // 绘制网格圆圈
    for (let i = 1; i <= 5; i++) {
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
      circle.setAttribute('cx', centerX.toString())
      circle.setAttribute('cy', centerY.toString())
      circle.setAttribute('r', (radius * i / 5).toString())
      circle.setAttribute('fill', 'none')
      circle.setAttribute('stroke', '#E5E7EB')
      circle.setAttribute('stroke-width', '1')
      svg.appendChild(circle)
    }
    
    // 绘制分割线
    for (let i = 0; i < categories; i++) {
      const angle = (i * 2 * Math.PI) / categories - Math.PI / 2
      const x = centerX + Math.cos(angle) * radius
      const y = centerY + Math.sin(angle) * radius
      
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line')
      line.setAttribute('x1', centerX.toString())
      line.setAttribute('y1', centerY.toString())
      line.setAttribute('x2', x.toString())
      line.setAttribute('y2', y.toString())
      line.setAttribute('stroke', '#E5E7EB')
      line.setAttribute('stroke-width', '1')
      svg.appendChild(line)
    }
    
    // 绘制对比数据（如果有）
    if (compareWith && compareSkills) {
      const comparePoints = radarData.map((data, index) => {
        const angle = (index * 2 * Math.PI) / categories - Math.PI / 2
        const distance = (data.compareScore / 100) * radius
        return {
          x: centerX + Math.cos(angle) * distance,
          y: centerY + Math.sin(angle) * distance
        }
      })
      
      // 绘制对比区域
      const comparePath = document.createElementNS('http://www.w3.org/2000/svg', 'path')
      const comparePathData = comparePoints.reduce((acc, point, index) => {
        return acc + (index === 0 ? `M ${point.x} ${point.y}` : ` L ${point.x} ${point.y}`)
      }, '') + ' Z'
      
      comparePath.setAttribute('d', comparePathData)
      comparePath.setAttribute('fill', '#9CA3AF')
      comparePath.setAttribute('fill-opacity', '0.2')
      comparePath.setAttribute('stroke', '#9CA3AF')
      comparePath.setAttribute('stroke-width', '2')
      comparePath.setAttribute('stroke-dasharray', '5,5')
      svg.appendChild(comparePath)
    }
    
    // 计算数据点位置
    const dataPoints = radarData.map((data, index) => {
      const angle = (index * 2 * Math.PI) / categories - Math.PI / 2
      const distance = (data.score / 100) * radius
      return {
        x: centerX + Math.cos(angle) * distance,
        y: centerY + Math.sin(angle) * distance,
        angle,
        data
      }
    })
    
    // 绘制数据区域
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    const pathData = dataPoints.reduce((acc, point, index) => {
      return acc + (index === 0 ? `M ${point.x} ${point.y}` : ` L ${point.x} ${point.y}`)
    }, '') + ' Z'
    
    path.setAttribute('d', pathData)
    path.setAttribute('fill', 'url(#gradient-0)')
    path.setAttribute('stroke', '#3B82F6')
    path.setAttribute('stroke-width', '2')
    svg.appendChild(path)
    
    // 绘制数据点
    dataPoints.forEach((point, index) => {
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
      circle.setAttribute('cx', point.x.toString())
      circle.setAttribute('cy', point.y.toString())
      circle.setAttribute('r', '4')
      circle.setAttribute('fill', point.data.color)
      circle.setAttribute('stroke', '#FFFFFF')
      circle.setAttribute('stroke-width', '2')
      
      // 添加悬停效果
      circle.addEventListener('mouseenter', () => {
        circle.setAttribute('r', '6')
        
        // 显示tooltip
        const tooltip = document.createElementNS('http://www.w3.org/2000/svg', 'g')
        tooltip.id = `tooltip-${index}`
        
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
        rect.setAttribute('x', (point.x + 10).toString())
        rect.setAttribute('y', (point.y - 30).toString())
        rect.setAttribute('width', '120')
        rect.setAttribute('height', '50')
        rect.setAttribute('fill', 'rgba(0,0,0,0.8)')
        rect.setAttribute('rx', '4')
        
        const text1 = document.createElementNS('http://www.w3.org/2000/svg', 'text')
        text1.setAttribute('x', (point.x + 15).toString())
        text1.setAttribute('y', (point.y - 15).toString())
        text1.setAttribute('fill', 'white')
        text1.setAttribute('font-size', '12')
        text1.setAttribute('font-weight', 'bold')
        text1.textContent = point.data.category
        
        const text2 = document.createElementNS('http://www.w3.org/2000/svg', 'text')
        text2.setAttribute('x', (point.x + 15).toString())
        text2.setAttribute('y', (point.y - 2).toString())
        text2.setAttribute('fill', 'white')
        text2.setAttribute('font-size', '11')
        text2.textContent = `分数: ${point.data.score.toFixed(1)}`
        
        tooltip.appendChild(rect)
        tooltip.appendChild(text1)
        tooltip.appendChild(text2)
        svg.appendChild(tooltip)
      })
      
      circle.addEventListener('mouseleave', () => {
        circle.setAttribute('r', '4')
        const tooltip = svg.querySelector(`#tooltip-${index}`)
        if (tooltip) {
          svg.removeChild(tooltip)
        }
      })
      
      svg.appendChild(circle)
    })
    
    // 绘制标签
    if (showLabels) {
      dataPoints.forEach((point, index) => {
        const labelDistance = radius + 20
        const labelX = centerX + Math.cos(point.angle) * labelDistance
        const labelY = centerY + Math.sin(point.angle) * labelDistance
        
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text')
        text.setAttribute('x', labelX.toString())
        text.setAttribute('y', labelY.toString())
        text.setAttribute('text-anchor', labelX > centerX ? 'start' : 'end')
        text.setAttribute('dominant-baseline', 'middle')
        text.setAttribute('font-size', '11')
        text.setAttribute('font-weight', '500')
        text.setAttribute('fill', '#374151')
        text.textContent = point.data.category
        
        svg.appendChild(text)
      })
    }
    
  }, [radarData, size, showLabels, compareWith, compareSkills])
  
  // 计算总体评分
  const totalScore = useMemo(() => {
    const scores = radarData.map(d => d.score)
    return scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0
  }, [radarData])
  
  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div className="relative">
        <svg
          ref={svgRef}
          width={size}
          height={size}
          className="drop-shadow-sm"
        />
        
        {/* 中心分数显示 */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center bg-white bg-opacity-90 rounded-full px-3 py-2 shadow-sm">
            <div className="text-lg font-bold text-blue-600">
              {totalScore.toFixed(1)}
            </div>
            <div className="text-xs text-gray-500">
              综合分数
            </div>
          </div>
        </div>
      </div>
      
      {/* 技能详情 */}
      <div className="mt-4 w-full">
        <div className="grid grid-cols-1 gap-2">
          {radarData
            .filter(data => data.skills.length > 0)
            .map((data, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: data.color }}
                  />
                  <span className="font-medium">{data.category}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">{data.score.toFixed(1)}</span>
                  <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-300"
                      style={{ 
                        backgroundColor: data.color,
                        width: `${data.score}%`
                      }}
                    />
                  </div>
                </div>
              </div>
            ))
          }
        </div>
        
        {/* 技能标签 */}
        <div className="mt-4">
          <div className="text-xs text-gray-500 mb-2">匹配的技能:</div>
          <div className="flex flex-wrap gap-1">
            {capabilities.map((skill, index) => (
              <span 
                key={index}
                className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
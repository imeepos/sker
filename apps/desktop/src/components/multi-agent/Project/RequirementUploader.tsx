/**
 * RequirementUploader组件 - 需求文档上传和处理组件
 * 支持拖拽上传、多种文档格式、文件预览和内容提取
 */

import React, { useCallback, useState, useRef } from 'react'
import { Button } from '../../ui/Button'
import { Input } from '../../ui/input'
import type { RequirementDocument, DocumentType } from '../../../types/multi-agent'

interface RequirementUploaderProps {
  onUpload: (documents: RequirementDocument[]) => Promise<void>
  maxFiles?: number
  supportedFormats?: string[]
  maxFileSize?: number // MB
  className?: string
}

interface FileWithPreview extends File {
  preview?: string
  extractedContent?: string
  processing?: boolean
  error?: string
}

interface UploadProgress {
  [key: string]: {
    progress: number
    status: 'uploading' | 'processing' | 'completed' | 'failed'
    message?: string
  }
}

export const RequirementUploader: React.FC<RequirementUploaderProps> = ({
  onUpload,
  maxFiles = 10,
  supportedFormats = ['.md', '.docx', '.pdf', '.txt'],
  maxFileSize = 10,
  className = ''
}) => {
  const [fileList, setFileList] = useState<FileWithPreview[]>([])
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({})
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 处理拖拽事件
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    
    const droppedFiles = Array.from(e.dataTransfer.files)
    handleFiles(droppedFiles)
  }, [])

  // 处理文件选择
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files)
      handleFiles(selectedFiles)
    }
  }, [])

  // 验证和处理文件
  const handleFiles = useCallback((files: File[]) => {
    const validFiles: FileWithPreview[] = []

    files.forEach(file => {
      // 检查文件格式
      const isValidFormat = supportedFormats.some(format => 
        file.name.toLowerCase().endsWith(format)
      )
      
      if (!isValidFormat) {
        console.warn(`不支持的文件格式: ${file.name}`)
        return
      }

      // 检查文件大小
      const fileSizeMB = file.size / 1024 / 1024
      if (fileSizeMB > maxFileSize) {
        console.warn(`文件过大: ${file.name} (${fileSizeMB.toFixed(2)}MB)`)
        return
      }

      validFiles.push(file as FileWithPreview)
    })

    // 检查文件数量限制
    const totalFiles = fileList.length + validFiles.length
    if (totalFiles > maxFiles) {
      console.warn(`文件数量超过限制 (${maxFiles}个)`)
      const allowedCount = maxFiles - fileList.length
      setFileList(prev => [...prev, ...validFiles.slice(0, allowedCount)])
    } else {
      setFileList(prev => [...prev, ...validFiles])
    }

    // 为新文件提取内容
    validFiles.forEach(file => {
      extractFileContent(file)
    })
  }, [fileList.length, maxFiles, maxFileSize, supportedFormats])

  // 文档内容提取
  const extractFileContent = useCallback(async (file: FileWithPreview) => {
    const fileKey = `${file.name}-${file.size}`
    
    setUploadProgress(prev => ({
      ...prev,
      [fileKey]: { progress: 0, status: 'processing', message: '正在提取内容...' }
    }))

    try {
      let content = ''
      
      if (file.name.endsWith('.md') || file.name.endsWith('.txt')) {
        // 直接读取文本文件
        content = await file.text()
      } else if (file.name.endsWith('.docx') || file.name.endsWith('.pdf')) {
        // 对于复杂格式，这里应该调用后端API进行处理
        // 目前使用模拟处理
        content = await simulateComplexFileExtraction(file)
      }

      // 更新文件对象
      setFileList(prev => prev.map(f => 
        f.name === file.name && f.size === file.size 
          ? { ...f, extractedContent: content, processing: false }
          : f
      ))

      setUploadProgress(prev => ({
        ...prev,
        [fileKey]: { progress: 100, status: 'completed', message: '内容提取完成' }
      }))

    } catch (error) {
      console.error('文件内容提取失败:', error)
      
      setFileList(prev => prev.map(f => 
        f.name === file.name && f.size === file.size 
          ? { ...f, error: '内容提取失败', processing: false }
          : f
      ))

      setUploadProgress(prev => ({
        ...prev,
        [fileKey]: { progress: 0, status: 'failed', message: '内容提取失败' }
      }))
    }
  }, [])

  // 模拟复杂文件格式的内容提取
  const simulateComplexFileExtraction = async (file: File): Promise<string> => {
    // 模拟处理时间
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // 根据文件类型返回模拟内容
    if (file.name.endsWith('.docx')) {
      return `这是从 Word 文档 "${file.name}" 提取的示例内容。

# 项目需求文档

## 1. 项目概述
本项目旨在开发一个多Agent协同开发系统...

## 2. 功能需求
- 用户管理系统
- Agent配置和管理
- 任务分配和监控
- 代码审查和质量控制

## 3. 技术要求
- 前端：React + TypeScript
- 后端：Node.js + Express
- 数据库：PostgreSQL
`
    } else if (file.name.endsWith('.pdf')) {
      return `这是从 PDF 文档 "${file.name}" 提取的示例内容。

项目需求规范书
==================

版本: 1.0
日期: 2024-01-01

1. 引言
   本文档描述了多Agent协同开发系统的详细需求...

2. 系统架构
   系统采用微服务架构，包含以下主要组件：
   - 用户服务
   - Agent管理服务
   - 任务调度服务
   - 代码管理服务

3. 接口规范
   系统提供RESTful API接口...
`
    }
    
    return '无法提取文件内容'
  }

  // 删除文件
  const removeFile = useCallback((index: number) => {
    const file = fileList[index]
    const fileKey = `${file.name}-${file.size}`
    
    setFileList(prev => prev.filter((_, i) => i !== index))
    setUploadProgress(prev => {
      const newProgress = { ...prev }
      delete newProgress[fileKey]
      return newProgress
    })
  }, [fileList])

  // 上传处理
  const handleUpload = useCallback(async () => {
    if (fileList.length === 0) return

    setUploading(true)

    try {
      const documents: RequirementDocument[] = fileList
        .filter(file => file.extractedContent && !file.error)
        .map((file, index) => ({
          id: `doc-${Date.now()}-${index}`,
          title: file.name.replace(/\.[^/.]+$/, ''), // 移除文件扩展名
          content: file.extractedContent!,
          documentType: getDocumentType(file.name),
          version: '1.0',
          priority: 'medium',
          uploadedAt: new Date(),
          processedAt: new Date()
        }))

      await onUpload(documents)
      
      // 清理状态
      setFileList([])
      setUploadProgress({})
      
      // 清空文件输入
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

    } catch (error) {
      console.error('文档上传失败:', error)
    } finally {
      setUploading(false)
    }
  }, [fileList, onUpload])

  // 根据文件名推断文档类型
  const getDocumentType = useCallback((filename: string): DocumentType => {
    const name = filename.toLowerCase()
    if (name.includes('user') || name.includes('story')) return 'user_story'
    if (name.includes('api') || name.includes('interface')) return 'api_spec'
    if (name.includes('test')) return 'test_plan'
    if (name.includes('arch') || name.includes('design')) return 'architecture_doc'
    return 'user_story' // 默认类型
  }, [])

  // 获取文件图标
  const getFileIcon = (filename: string) => {
    if (filename.endsWith('.md')) return '📝'
    if (filename.endsWith('.docx')) return '📄'
    if (filename.endsWith('.pdf')) return '📕'
    if (filename.endsWith('.txt')) return '📋'
    return '📎'
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 拖拽上传区域 */}
      <div
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${dragOver 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
          }
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="space-y-2">
          <div className="text-4xl mb-4">📁</div>
          <p className="text-lg font-medium text-gray-700">
            拖拽文件到此处或点击选择文件
          </p>
          <p className="text-sm text-gray-500">
            支持格式：{supportedFormats.join(', ')}
          </p>
          <p className="text-sm text-gray-500">
            最大文件大小：{maxFileSize}MB，最多{maxFiles}个文件
          </p>
        </div>
      </div>

      {/* 隐藏的文件输入 */}
      <Input
        ref={fileInputRef}
        type="file"
        multiple
        accept={supportedFormats.join(',')}
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* 文件列表 */}
      {fileList.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-700">已选择的文件 ({fileList.length})</h4>
          
          {fileList.map((file, index) => {
            const fileKey = `${file.name}-${file.size}`
            const progress = uploadProgress[fileKey]
            
            return (
              <div key={index} className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <span className="text-2xl">{getFileIcon(file.name)}</span>
                    <div className="flex-1 min-w-0">
                      <h5 className="font-medium text-sm truncate">{file.name}</h5>
                      <p className="text-xs text-gray-500">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                      
                      {/* 处理状态 */}
                      {progress && (
                        <div className="mt-2">
                          <div className="flex justify-between text-xs mb-1">
                            <span>{progress.message}</span>
                            <span>{progress.progress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1">
                            <div
                              className={`h-1 rounded-full transition-all ${
                                progress.status === 'failed' ? 'bg-red-500' :
                                progress.status === 'completed' ? 'bg-green-500' : 'bg-blue-500'
                              }`}
                              style={{ width: `${progress.progress}%` }}
                            />
                          </div>
                        </div>
                      )}
                      
                      {/* 错误信息 */}
                      {file.error && (
                        <p className="text-xs text-red-500 mt-1">{file.error}</p>
                      )}
                      
                      {/* 提取的内容预览 */}
                      {file.extractedContent && !file.error && (
                        <div className="mt-2">
                          <p className="text-xs text-gray-600 mb-1">内容预览:</p>
                          <div className="bg-white p-2 rounded text-xs max-h-20 overflow-y-auto border">
                            {file.extractedContent.substring(0, 200)}
                            {file.extractedContent.length > 200 && '...'}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                    className="text-red-500 hover:text-red-700 ml-2"
                  >
                    删除
                  </Button>
                </div>
              </div>
            )
          })}
          
          {/* 上传按钮 */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button 
              variant="outline"
              onClick={() => {
                setFileList([])
                setUploadProgress({})
                if (fileInputRef.current) fileInputRef.current.value = ''
              }}
              disabled={uploading}
            >
              清空列表
            </Button>
            <Button 
              onClick={handleUpload}
              disabled={uploading || fileList.length === 0 || fileList.every(f => f.error)}
            >
              {uploading ? '上传中...' : `上传 ${fileList.filter(f => !f.error).length} 个文档`}
            </Button>
          </div>
        </div>
      )}

      {/* 上传提示 */}
      {fileList.length === 0 && (
        <div className="text-center text-gray-500 text-sm">
          <p>还没有选择任何文件</p>
          <p>支持的格式包括 Markdown、Word文档、PDF 和文本文件</p>
        </div>
      )}
    </div>
  )
}

RequirementUploader.displayName = 'RequirementUploader'
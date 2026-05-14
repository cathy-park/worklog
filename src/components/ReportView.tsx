'use client'

import React, { useState } from 'react'
import { Copy, Check, FileText, Share2, Sparkles, Loader2, RotateCcw, X } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Task } from '@/lib/supabase'
import { useTasks } from '@/context/TaskContext'
import styles from './ReportView.module.css'

interface ReportViewProps {
  tasks: Task[]
  date?: string
}

export default function ReportView({ tasks, date }: ReportViewProps) {
  const { aiDetailsMap, updateAiDetails, getTodayLocal } = useTasks()
  const [copied, setCopied] = useState(false)
  const [isRefining, setIsRefining] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingDetail, setEditingDetail] = useState<{ taskId: string, index: number, value: string } | null>(null)
  
  const currentDate = date || getTodayLocal()
  const aiDetails = aiDetailsMap[currentDate] || null
  
  const completedTasks = tasks.filter(t => t.status === 'completed')
  
  const todayLabel = new Date(currentDate.replace(/-/g, '/')).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  })

  const generateReportText = () => {
    if (completedTasks.length === 0) return '완료된 업무가 없습니다.'
    
    let report = `[${todayLabel} 업무일지]\n\n`
    completedTasks.forEach(task => {
      const projectPart = task.project_name ? `${task.project_name} ` : ''
      report += `* ${projectPart}${task.title}\n`
      if (aiDetails && aiDetails[task.id]) {
        aiDetails[task.id].forEach(detail => {
          report += `  - ${detail}\n`
        })
      }
    })
    report += `\n총 ${completedTasks.length}건 완료`
    return report
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(generateReportText())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleRefine = async () => {
    if (completedTasks.length === 0) return
    
    setIsRefining(true)
    setError(null)
    try {
      const response = await fetch('/api/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks: completedTasks })
      })
      
      const data = await response.json()
      if (data.error) {
        setError(data.error)
      } else if (data.result) {
        updateAiDetails(currentDate, data.result)
      }
    } catch (error) {
      console.error('Refine error:', error)
      setError('AI 서버와 통신 중 오류가 발생했습니다.')
    } finally {
      setIsRefining(false)
    }
  }

  const handleSaveDetail = () => {
    if (!editingDetail || !aiDetails) return
    const { taskId, index, value } = editingDetail
    const newDetails = { ...aiDetails }
    newDetails[taskId] = [...newDetails[taskId]]
    newDetails[taskId][index] = value
    updateAiDetails(currentDate, newDetails)
    setEditingDetail(null)
  }

  const handleDeleteDetail = (taskId: string, index: number) => {
    if (!aiDetails) return
    const newDetails = { ...aiDetails }
    newDetails[taskId] = newDetails[taskId].filter((_, i) => i !== index)
    if (newDetails[taskId].length === 0) {
      delete newDetails[taskId]
    }
    updateAiDetails(currentDate, Object.keys(newDetails).length > 0 ? newDetails : null)
  }

  const handleReset = () => {
    updateAiDetails(currentDate, null)
  }

  return (
    <div className={`${styles.container} glass`}>
      <div className={styles.header}>
        <div className={styles.titleWrapper}>
          <FileText className={styles.icon} size={20} />
          <h2 className={styles.title}>자동 생성 업무일지</h2>
        </div>
        <div className={styles.headerActions}>
          {completedTasks.length > 0 && (
            <button 
              className={`${styles.refineBtn} ${isRefining ? styles.loading : ''}`} 
              onClick={handleRefine}
              disabled={isRefining}
            >
              {isRefining ? <Loader2 className={styles.spin} size={16} /> : <Sparkles size={16} />}
              <span>AI 정제</span>
            </button>
          )}
          <button className={styles.copyBtn} onClick={handleCopy}>
            {copied ? <Check size={18} /> : <Copy size={18} />}
            <span>{copied ? '복사됨' : '복사하기'}</span>
          </button>
        </div>
      </div>

      <div className={styles.content}>
        {completedTasks.length > 0 ? (
          <div className={styles.reportArea}>
            {aiDetails && (
              <div className={styles.aiBadge}>
                <Sparkles size={12} />
                <span>AI가 정제한 세부 업무가 추가되었습니다 (클릭하여 편집 가능)</span>
                <button className={styles.resetBtn} onClick={handleReset}>
                  <RotateCcw size={12} />
                  초기화
                </button>
              </div>
            )}
            {error && (
              <div className={styles.errorBadge}>
                <span>⚠️ {error}</span>
                <button className={styles.resetBtn} onClick={() => setError(null)}>
                  닫기
                </button>
              </div>
            )}
            <p className={styles.dateHeader}>[{todayLabel} 업무일지]</p>
            <ul className={styles.taskList}>
              {completedTasks.map(task => (
                <li key={task.id} className={styles.reportItem}>
                  <span className={styles.bullet}>•</span>
                  <div className={styles.itemWrapper}>
                    <div className={styles.itemContent}>
                      {task.project_name && (
                        <span 
                          className={styles.reportProject}
                          style={{ 
                            color: task.project_color,
                            backgroundColor: `${task.project_color}15`,
                            borderColor: `${task.project_color}33`
                          }}
                        >
                          {task.project_name}
                        </span>
                      )}
                      <div className={styles.itemText}>
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{task.title}</ReactMarkdown>
                      </div>
                    </div>
                    {aiDetails && aiDetails[task.id] && (
                      <ul className={styles.aiDetailsList}>
                        {aiDetails[task.id].map((detail, idx) => (
                          <li key={idx} className={styles.aiDetailItem}>
                            {editingDetail?.taskId === task.id && editingDetail?.index === idx ? (
                              <div className={styles.editWrapper}>
                                <input 
                                  autoFocus
                                  className={styles.editInput}
                                  value={editingDetail.value}
                                  onChange={(e) => setEditingDetail({ ...editingDetail, value: e.target.value })}
                                  onBlur={handleSaveDetail}
                                  onKeyDown={(e) => e.key === 'Enter' && handleSaveDetail()}
                                />
                                <Check size={12} className={styles.editCheck} onClick={handleSaveDetail} />
                              </div>
                            ) : (
                              <div className={styles.detailWrapper}>
                                <div 
                                  className={styles.detailText} 
                                  onClick={() => setEditingDetail({ taskId: task.id, index: idx, value: detail })}
                                >
                                  {/* Using a more robust ReactMarkdown configuration */}
                                  <ReactMarkdown 
                                    remarkPlugins={[remarkGfm]}
                                    components={{
                                      p: ({node, ...props}) => <span {...props} />
                                    }}
                                  >
                                    {detail}
                                  </ReactMarkdown>
                                </div>
                                <button className={styles.deleteDetailBtn} onClick={() => handleDeleteDetail(task.id, idx)}>
                                  <X size={12} />
                                </button>
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </li>
              ))}
            </ul>
            <p className={styles.summary}>총 {completedTasks.length}건 완료</p>
          </div>
        ) : (
          <div className={styles.empty}>
            <p>오늘 완료한 업무가 여기에 자동으로 요약됩니다.</p>
            <p className={styles.subEmpty}>업무를 완료 상태로 체크해보세요!</p>
          </div>
        )}
      </div>

      {completedTasks.length > 0 && (
        <div className={styles.footer}>
          <button className={styles.shareBtn}>
            <Share2 size={16} />
            Slack으로 전송 (준비중)
          </button>
        </div>
      )}
    </div>
  )
}

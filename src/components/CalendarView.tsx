'use client'

import React, { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar as CalendarIcon, Clipboard, Check, Layout, Plus, X } from 'lucide-react'
import { Task, Project } from '@/lib/supabase'
import { useTasks } from '@/context/TaskContext'
import styles from './CalendarView.module.css'

interface CalendarViewProps {
  tasks: Task[]
  projects: Project[]
  onDateSelect: (date: string) => void
  onViewChange: (view: 'dashboard' | 'calendar' | 'stats') => void
  currentDate: Date
  onMonthChange: (date: Date) => void
}

export default function CalendarView({ 
  tasks, 
  projects, 
  onDateSelect, 
  onViewChange,
  currentDate,
  onMonthChange
}: CalendarViewProps) {
  // Use a local selected date state but initialize it from today's local date
  const getTodayLocal = () => {
    const now = new Date()
    const y = now.getFullYear()
    const m = String(now.getMonth() + 1).padStart(2, '0')
    const d = String(now.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }

  // We keep a local selected date for UI immediate response, but we should also sync it if currentDate changes to "today"
  const [localSelectedDate, setLocalSelectedDate] = useState<string>(getTodayLocal())
  const [copied, setCopied] = useState(false)
  
  const { addTask, projects: contextProjects } = useTasks()
  const [isAddingTask, setIsAddingTask] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [selectedProjectId, setSelectedProjectId] = useState(contextProjects[0]?.id || '')

  // Ensure projectId is valid
  React.useEffect(() => {
    if (contextProjects.length > 0) {
      const isValid = contextProjects.some(p => String(p.id) === String(selectedProjectId))
      if (!isValid) {
        setSelectedProjectId(contextProjects[0].id)
      }
    }
  }, [contextProjects, selectedProjectId])

  const handleAddTaskSubmit = () => {
    if (!newTaskTitle.trim() || !selectedProjectId || !localSelectedDate) return
    // Temporarily save original selected date if different? 
    // addTask uses the global selectedDate, which is already synced when clicking on calendar days.
    addTask(newTaskTitle, selectedProjectId)
    setNewTaskTitle('')
    setIsAddingTask(false)
  }

  // Calendar Logic
  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate()
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay()

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  // Sync localSelectedDate when currentDate is exactly today (from handleGoToday)
  const todayStr = getTodayLocal()
  React.useEffect(() => {
    const currentStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`
    if (currentStr === todayStr) {
      setLocalSelectedDate(todayStr)
    }
  }, [currentDate, todayStr])

  const calendarDays = useMemo(() => {
    const totalDays = daysInMonth(year, month)
    const startDay = firstDayOfMonth(year, month)
    const days = []

    for (let i = 0; i < startDay; i++) {
      days.push(null)
    }

    for (let i = 1; i <= totalDays; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`
      days.push(dateStr)
    }

    return days
  }, [year, month])

  const tasksByDate = useMemo(() => {
    const grouped: Record<string, Task[]> = {}
    tasks.forEach(task => {
      const date = task.created_at.split('T')[0]
      if (!grouped[date]) grouped[date] = []
      grouped[date].push(task)
    })
    return grouped
  }, [tasks])

  const selectedTasks = localSelectedDate ? tasksByDate[localSelectedDate] || [] : []
  const selectedCompletedTasks = selectedTasks.filter(t => t.status === 'completed')

  const handleCopyReport = () => {
    if (!localSelectedDate) return
    const dateObj = new Date(localSelectedDate.replace(/-/g, '/'))
    const dateText = dateObj.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })
    
    let report = `[${dateText} 업무일지]\n\n`
    if (selectedCompletedTasks.length === 0) {
      report += '완료된 업무가 없습니다.'
    } else {
      selectedCompletedTasks.forEach(task => {
        report += `* ${task.project_name ? `${task.project_name} ` : ''}${task.title}\n`
      })
      report += `\n총 ${selectedCompletedTasks.length}건 완료`
    }

    navigator.clipboard.writeText(report)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleGoToDashboard = () => {
    if (localSelectedDate) {
      onDateSelect(localSelectedDate)
      onViewChange('dashboard')
    }
  }

  const handleDateClick = (date: string) => {
    setLocalSelectedDate(date)
    onDateSelect(date)
  }

  return (
    <div className={styles.container}>
      <div className={styles.calendarSection}>
        <div className={`${styles.card} glass`}>
          <div className={styles.grid}>
            {['일', '월', '화', '수', '목', '금', '토'].map(d => (
              <div key={d} className={styles.weekday}>{d}</div>
            ))}
            {calendarDays.map((date, idx) => {
              if (!date) return <div key={`empty-${idx}`} className={styles.emptyDay} />
              
              const dayTasks = tasksByDate[date] || []
              const completedCount = dayTasks.filter(t => t.status === 'completed').length
              const isSelected = localSelectedDate === date
              const isToday = date === todayStr
              
              const dayProjectColors = Array.from(new Set(dayTasks.map(t => t.project_color).filter(Boolean)))

              return (
                <motion.div
                  key={date}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`${styles.day} ${isSelected ? styles.selected : ''} ${isToday ? styles.isToday : ''}`}
                  onClick={() => handleDateClick(date)}
                >
                  <span className={styles.dayNum}>{parseInt(date.split('-')[2])}</span>
                  <div className={styles.dayContent}>
                    {completedCount > 0 && (
                      <div 
                        className={styles.intensity} 
                        style={{ opacity: Math.min(0.2 + completedCount * 0.15, 1) }}
                      />
                    )}
                    <div className={styles.dots}>
                      {dayProjectColors.slice(0, 3).map((color, i) => (
                        <span key={i} className={styles.dot} style={{ backgroundColor: color }} />
                      ))}
                      {dayProjectColors.length > 3 && <span className={styles.moreDot}>+</span>}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>

      <div className={styles.sidePanel}>
        <AnimatePresence mode="wait">
          <motion.div 
            key={localSelectedDate}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className={`${styles.detailCard} glass`}
          >
            {localSelectedDate ? (
              <>
                <div className={styles.detailHeader}>
                  <div className={styles.detailTitle}>
                    <h3>{localSelectedDate.split('-')[1]}월 {localSelectedDate.split('-')[2]}일 업무</h3>
                    <p className={styles.detailSub}>{selectedCompletedTasks.length}건 완료 / 총 {selectedTasks.length}건</p>
                  </div>
                  <div className={styles.headerActions}>
                    <button 
                      className={styles.copyBtn}
                      onClick={() => setIsAddingTask(!isAddingTask)}
                      title="업무 추가"
                    >
                      {isAddingTask ? <X size={16} /> : <Plus size={16} />}
                    </button>
                    <button 
                      className={`${styles.copyBtn} ${copied ? styles.copied : ''}`}
                      onClick={handleCopyReport}
                      title="클립보드 복사"
                    >
                      {copied ? <Check size={16} /> : <Clipboard size={16} />}
                    </button>
                  </div>
                </div>

                <div className={styles.detailList}>
                  {isAddingTask && (
                    <div className={styles.addTaskForm}>
                      <input 
                        autoFocus
                        type="text"
                        placeholder="새 업무 제목..."
                        value={newTaskTitle}
                        onChange={e => setNewTaskTitle(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleAddTaskSubmit()}
                        className={styles.addTaskInput}
                      />
                      <select 
                        value={selectedProjectId}
                        onChange={e => setSelectedProjectId(e.target.value)}
                        className={styles.addTaskSelect}
                      >
                        {contextProjects.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                      <button className={styles.addTaskSubmitBtn} onClick={handleAddTaskSubmit}>추가</button>
                    </div>
                  )}

                  {selectedTasks.length > 0 ? (
                    selectedTasks.map(task => (
                      <div key={task.id} className={styles.taskItem} style={{ opacity: task.status === 'completed' ? 1 : 0.7 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                          <span className={styles.projBadge} style={{ backgroundColor: task.project_color + '22', color: task.project_color }}>
                            {task.project_name}
                          </span>
                          {task.status === 'todo' && <span style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>(진행 중)</span>}
                        </div>
                        <span className={styles.taskTitle} style={{ textDecoration: task.status === 'completed' ? 'none' : 'none' }}>
                          {task.title}
                        </span>
                      </div>
                    ))
                  ) : (
                    !isAddingTask && (
                      <div className={styles.noTasks}>
                        <CalendarIcon size={32} />
                        <p>등록된 업무가 없습니다.</p>
                      </div>
                    )
                  )}
                </div>
              </>
            ) : (
              <div className={styles.noSelection}>
                <p>날짜를 선택하여 상세 업무를 확인하세요.</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

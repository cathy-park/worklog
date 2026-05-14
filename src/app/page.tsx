'use client'

import React, { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, ListTodo, ChevronLeft, ChevronRight } from 'lucide-react'
import TaskInput from '@/components/TaskInput'
import TaskCard from '@/components/TaskCard'
import ReportView from '@/components/ReportView'
import { useTasks } from '@/context/TaskContext'
import styles from './page.module.css'

export default function Home() {
  const { 
    tasks, projects, userName, selectedDate, isLoading,
    setUserName, setSelectedDate,
    addTask, toggleTask, deleteTask, updateTask, addProject, deleteProject, updateProject,
    getTodayLocal
  } = useTasks()

  const [isEditingName, setIsEditingName] = useState(false)
  const [tempName, setTempName] = useState('')
  const dateInputRef = useRef<HTMLInputElement>(null)

  const handleNameSave = () => {
    const newName = tempName.trim() || userName
    setUserName(newName)
    setIsEditingName(false)
  }

  const startEditingName = () => {
    setTempName(userName)
    setIsEditingName(true)
  }

  const handleDateClick = () => {
    const input = dateInputRef.current
    if (input) {
      if ('showPicker' in input) {
        (input as any).showPicker()
      } else {
        (input as any).click()
      }
    }
  }

  const handlePrevDay = () => {
    const d = new Date(selectedDate)
    d.setDate(d.getDate() - 1)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    setSelectedDate(`${y}-${m}-${day}`)
  }

  const handleNextDay = () => {
    const d = new Date(selectedDate)
    d.setDate(d.getDate() + 1)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    setSelectedDate(`${y}-${m}-${day}`)
  }

  const filteredTasks = tasks.filter(task => {
    const taskDate = task.created_at.split('T')[0]
    return taskDate === selectedDate
  })

  const activeTasks = filteredTasks.filter(t => t.status !== 'completed')
  const completedTasks = filteredTasks.filter(t => t.status === 'completed')

  return (
    <motion.div key="dashboard" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
      <header className={styles.header}>
        {isEditingName ? (
          <div className={styles.nameEditWrapper}>
            <input autoFocus className={styles.nameInput} value={tempName} onChange={(e) => setTempName(e.target.value)} onBlur={handleNameSave} onKeyDown={(e) => e.key === 'Enter' && handleNameSave()} />
            <button className={styles.saveBtn} onClick={handleNameSave}>저장</button>
          </div>
        ) : (
          <h2 className={styles.greeting} onClick={startEditingName} style={{cursor: 'pointer'}}>
            안녕하세요! <span className={styles.userName}>{userName}</span>님 오늘도 파이팅하세요! 🔥
          </h2>
        )}
        <div className={styles.dateNav}>
          <button className={styles.dateNavBtn} onClick={handlePrevDay}><ChevronLeft size={18} /></button>
          <div className={styles.datePickerWrapper} onClick={handleDateClick}>
            <Calendar size={14} className={styles.dateIcon} />
            <input ref={dateInputRef} type="date" className={styles.dateInput} value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
            <span className={styles.dateDisplay}>
              {new Date(selectedDate.replace(/-/g, '/')).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })}
            </span>
          </div>
          <button className={styles.dateNavBtn} onClick={handleNextDay}><ChevronRight size={18} /></button>
          <button className={styles.resetBtnSmall} onClick={() => setSelectedDate(getTodayLocal())}>오늘</button>
        </div>
      </header>

      <div className={`${styles.contentGrid} ${isLoading ? styles.loading : ''}`}>
        {isLoading && (
          <div className={styles.loadingOverlay}>
            <div className={styles.loadingSpinner}></div>
            <p>데이터를 불러오는 중입니다...</p>
          </div>
        )}
        <div className={styles.taskSection}>
          <TaskInput 
            onAdd={addTask} 
            projects={projects} 
            onAddProject={addProject} 
            onDeleteProject={deleteProject} 
            onUpdateProject={updateProject}
          />
          <div className={styles.listContainer}>
            <div className={styles.sectionHeader}>
              <ListTodo size={18} />
              <h3>진행 중인 업무</h3>
              <span className={styles.badge}>{activeTasks.length}</span>
            </div>
            <div className={styles.list}>
              <AnimatePresence mode='popLayout'>
                {activeTasks.length > 0 ? (
                  activeTasks.map(task => <TaskCard key={task.id} task={task} onToggle={toggleTask} onDelete={deleteTask} onEdit={updateTask} />)
                ) : (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={styles.emptyText}>
                    {selectedDate === new Date().toISOString().split('T')[0] ? '모든 업무를 완료했습니다!' : '이 날짜에 등록된 업무가 없습니다.'}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
            {completedTasks.length > 0 && (
              <>
                <div className={`${styles.sectionHeader} ${styles.completedHeader}`}>
                  <h3>완료된 업무</h3>
                  <span className={styles.badge}>{completedTasks.length}</span>
                </div>
                <div className={styles.list}>
                  <AnimatePresence mode='popLayout'>
                    {completedTasks.map(task => <TaskCard key={task.id} task={task} onToggle={toggleTask} onDelete={deleteTask} onEdit={updateTask} />)}
                  </AnimatePresence>
                </div>
              </>
            )}
          </div>
        </div>
        <aside className={styles.reportSection}>
          <ReportView tasks={filteredTasks} date={selectedDate} />
        </aside>
      </div>
    </motion.div>
  )
}

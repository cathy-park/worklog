'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import CalendarView from '@/components/CalendarView'
import { useTasks } from '@/context/TaskContext'
import styles from '@/app/page.module.css'

export default function CalendarPage() {
  const { 
    tasks, projects, userName, setSelectedDate, getTodayLocal
  } = useTasks()

  const [calendarViewDate, setCalendarViewDate] = useState(new Date())

  const handlePrevMonth = () => {
    const d = new Date(calendarViewDate)
    d.setMonth(d.getMonth() - 1)
    setCalendarViewDate(d)
  }

  const handleNextMonth = () => {
    const d = new Date(calendarViewDate)
    d.setMonth(d.getMonth() + 1)
    setCalendarViewDate(d)
  }

  const handleGoToday = () => {
    const today = new Date()
    setCalendarViewDate(today)
    setSelectedDate(getTodayLocal())
  }

  return (
    <motion.div key="calendar" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <h2 className={styles.greeting}>업무 캘린더</h2>
          <p className={styles.subText}>월간 업무 현황을 한눈에 확인하고 관리하세요.</p>
        </div>
        <div className={styles.viewNav} style={{ width: 'fit-content' }}>
          <button className={styles.dateNavBtn} onClick={handlePrevMonth}><ChevronLeft size={18} /></button>
          <span className={styles.currentViewLabel}>
            {calendarViewDate.getFullYear()}년 {calendarViewDate.getMonth() + 1}월
          </span>
          <button className={styles.dateNavBtn} onClick={handleNextMonth}><ChevronRight size={18} /></button>
          <button className={styles.resetBtnSmall} onClick={handleGoToday}>오늘</button>
        </div>
      </header>
      <CalendarView 
        tasks={tasks} 
        projects={projects} 
        onDateSelect={setSelectedDate} 
        onViewChange={() => {}} // Not used anymore as we use Link
        currentDate={calendarViewDate}
        onMonthChange={setCalendarViewDate}
      />
    </motion.div>
  )
}

'use client'

import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import StatsView from '@/components/StatsView'
import { useTasks } from '@/context/TaskContext'
import styles from '@/app/page.module.css'
import statsStyles from '@/components/StatsView.module.css'

export default function StatsPage() {
  const { tasks, projects } = useTasks()
  const [weekOffset, setWeekOffset] = useState(0)

  const currentWeekRange = useMemo(() => {
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    const sun = new Date(now)
    sun.setDate(now.getDate() - now.getDay() + (weekOffset * 7))

    const days = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(sun)
      d.setDate(sun.getDate() + i)
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      days.push(`${y}-${m}-${day}`)
    }
    
    return {
      start: days[0],
      end: days[6]
    }
  }, [weekOffset])

  return (
    <motion.div key="stats" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <h2 className={styles.greeting}>성과 분석 통계</h2>
          <p className={styles.subText}>데이터로 보는 나의 생산성 리포트입니다.</p>
        </div>
        <div className={statsStyles.weekPicker} style={{ width: 'fit-content' }}>
          <button className={statsStyles.navBtn} onClick={() => setWeekOffset(v => v - 1)}><ChevronLeft size={20} /></button>
          <div className={statsStyles.weekDisplay}>
            <Calendar size={16} />
            <span>
              {new Date(currentWeekRange.start.replace(/-/g, '/')).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })} - 
              {new Date(currentWeekRange.end.replace(/-/g, '/')).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}
            </span>
          </div>
          <button className={statsStyles.navBtn} onClick={() => setWeekOffset(v => v + 1)} disabled={weekOffset === 0}><ChevronRight size={20} /></button>
          {weekOffset !== 0 && (
            <button className={statsStyles.resetBtn} onClick={() => setWeekOffset(0)}>이번 주</button>
          )}
        </div>
      </header>
      <StatsView tasks={tasks} projects={projects} weekOffset={weekOffset} />
    </motion.div>
  )
}

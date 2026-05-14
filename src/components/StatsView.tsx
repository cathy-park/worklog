'use client'

import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts'
import { TrendingUp, Target, Award, Briefcase, ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { Task, Project } from '@/lib/supabase'
import styles from './StatsView.module.css'

interface StatsViewProps {
  tasks: Task[]
  projects: Project[]
  weekOffset: number
}

const CustomTick = (props: any) => {
  const { x, y, payload } = props
  let color = '#94a3b8' // Default
  if (payload.value === '일' || payload.value === '토') color = '#3b82f6'
  
  return (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={0} dy={16} textAnchor="middle" fill={color} fontSize={12}>
        {payload.value}
      </text>
    </g>
  )
}

export default function StatsView({ tasks, projects, weekOffset }: StatsViewProps) {

  // 1. Calculate the target week (Sunday to Saturday)
  const currentWeekRange = useMemo(() => {
    // Use local time to determine the start of the week
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    
    // Find Sunday of the current week
    const sun = new Date(now)
    sun.setDate(now.getDate() - now.getDay() + (weekOffset * 7))

    const days = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(sun)
      d.setDate(sun.getDate() + i)
      // Store as YYYY-MM-DD local string
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      days.push(`${y}-${m}-${day}`)
    }
    
    return {
      days,
      start: days[0],
      end: days[6]
    }
  }, [weekOffset])

  // 2. Weekly Activity Data for the selected week
  const weeklyData = useMemo(() => {
    return currentWeekRange.days.map(date => {
      const dayTasks = tasks.filter(t => t.created_at.startsWith(date))
      const localDate = new Date(date.replace(/-/g, '/')) 
      return {
        name: localDate.toLocaleDateString('ko-KR', { weekday: 'short' }),
        completed: dayTasks.filter(t => t.status === 'completed').length,
        total: dayTasks.length,
        date: date
      }
    })
  }, [tasks, currentWeekRange])

  // 3. Project Distribution Data (Filtered by the selected week)
  const projectData = useMemo(() => {
    const weekTasks = tasks.filter(t => 
      t.created_at.split('T')[0] >= currentWeekRange.start && 
      t.created_at.split('T')[0] <= currentWeekRange.end
    )

    const data = projects.map(p => {
      const count = weekTasks.filter(t => t.project_id === p.id && t.status === 'completed').length
      return {
        name: p.name,
        value: count,
        color: p.color
      }
    }).filter(d => d.value > 0)
    
    return data.length > 0 ? data : [{ name: '데이터 없음', value: 1, color: '#33333333' }]
  }, [tasks, projects, currentWeekRange])

  // 4. Stats Summary for the selected week
  const stats = useMemo(() => {
    const weekTasks = tasks.filter(t => 
      t.created_at.split('T')[0] >= currentWeekRange.start && 
      t.created_at.split('T')[0] <= currentWeekRange.end
    )
    const completed = weekTasks.filter(t => t.status === 'completed').length
    const total = weekTasks.length
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0
    
    const projCounts: Record<string, number> = {}
    weekTasks.forEach(t => {
      if (t.status === 'completed') {
        projCounts[t.project_name || '기타'] = (projCounts[t.project_name || '기타'] || 0) + 1
      }
    })
    const topProj = Object.entries(projCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '-'

    return { completed, total, rate, topProj }
  }, [tasks, currentWeekRange])

  return (
    <div className={styles.container}>
      <div className={styles.mainGrid}>
        <div className={styles.metrics}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`${styles.metricCard} glass`}>
            <div className={styles.metricIcon} style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}><TrendingUp size={24} /></div>
            <div className={styles.metricInfo}>
              <span className={styles.label}>주간 완료 업무</span>
              <span className={styles.value}>{stats.completed}건</span>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className={`${styles.metricCard} glass`}>
            <div className={styles.metricIcon} style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}><Target size={24} /></div>
            <div className={styles.metricInfo}>
              <span className={styles.label}>주간 완료율</span>
              <span className={styles.value}>{stats.rate}%</span>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className={`${styles.metricCard} glass`}>
            <div className={styles.metricIcon} style={{ background: 'rgba(236, 72, 153, 0.1)', color: '#ec4899' }}><Briefcase size={24} /></div>
            <div className={styles.metricInfo}>
              <span className={styles.label}>주요 프로젝트</span>
              <span className={styles.value}>{stats.topProj}</span>
            </div>
          </motion.div>
        </div>

        <div className={styles.chartsGrid}>
          <div className={`${styles.chartCard} glass`}>
            <h3>주간 활동 트렌드</h3>
            <div className={styles.chartWrapper}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={weeklyData}>
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0.2}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tick={<CustomTick />} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}건`} />
                  <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} itemStyle={{ color: '#fff' }} />
                  <Bar dataKey="completed" fill="#3b82f6" radius={[4, 4, 0, 0]} animationDuration={1000}>
                    {weeklyData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill="url(#barGradient)" 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className={`${styles.chartCard} glass`}>
            <h3>프로젝트별 업무 비중</h3>
            <div className={styles.chartWrapper}>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={projectData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" animationDuration={1000}>
                    {projectData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className={styles.legend}>
                {projectData.map((p, i) => (
                  <div key={i} className={styles.legendItem}>
                    <span className={styles.legendDot} style={{ background: p.color }} />
                    <span className={styles.legendName}>{p.name}</span>
                    <span className={styles.legendValue}>{p.value}건</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className={`${styles.insightCard} glass`}>
          <div className={styles.insightHeader}><Award size={20} className={styles.insightIcon} /><h3>AI 스마트 인사이트</h3></div>
          <div className={styles.insightContent}>
            {stats.completed > 0 ? (
              <p>
                이번 주 사용자님은 <strong>{stats.topProj}</strong> 분야에서 탁월한 성과를 보여주셨습니다! 
                특히 주간 완료율 <strong>{stats.rate}%</strong>는 매우 높은 수치이며, 계획하신 일을 차근차근 잘 실행하고 계시다는 증거입니다. 
                남은 기간도 지금의 페이스를 유지하며 즐겁게 업무를 마무리하시길 바랍니다. ✨
              </p>
            ) : (
              <p>선택한 주간에 완료된 업무가 없습니다. 업무를 추가하고 나만의 생산성 지도를 그려보세요!</p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

'use client'

import React from 'react'
import { useTasks } from '@/context/TaskContext'
import Sidebar from './Sidebar'
import styles from '@/app/page.module.css'

export default function ContentWrapper({ children }: { children: React.ReactNode }) {
  const { isSidebarCollapsed } = useTasks()

  return (
    <div className={`${styles.wrapper} ${isSidebarCollapsed ? styles.sidebarCollapsed : ''}`}>
      <Sidebar />
      <main className={styles.main}>
        {children}
      </main>
    </div>
  )
}

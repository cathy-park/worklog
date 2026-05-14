'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Layout, Calendar, BarChart3, ChevronLeft, ChevronRight } from 'lucide-react'
import { useTasks } from '@/context/TaskContext'
import styles from '@/app/page.module.css'

export default function Sidebar() {
  const pathname = usePathname()
  const { isSidebarCollapsed, setIsSidebarCollapsed } = useTasks()
  const [isHovered, setIsHovered] = useState(false)

  return (
    <aside 
      className={`${styles.sidebar} ${isSidebarCollapsed ? styles.collapsed : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={styles.logo}>
        <Link href="/" className={styles.logoLink} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none', color: 'inherit' }}>
          <div className={styles.logoIcon}>
            <img src="/logo.png" alt="WorkLog Auto Logo" className={styles.logoImage} />
          </div>
          {!isSidebarCollapsed && <h1 className={styles.logoText}>WorkLog <span>Auto</span></h1>}
        </Link>
      </div>
      
      <nav className={styles.nav}>
        <Link href="/" className={`${styles.navItem} ${pathname === '/' ? styles.active : ''}`}>
          <Layout size={20} />
          {!isSidebarCollapsed && <span>대시보드</span>}
        </Link>
        <Link href="/calendar" className={`${styles.navItem} ${pathname === '/calendar' ? styles.active : ''}`}>
          <Calendar size={20} />
          {!isSidebarCollapsed && <span>캘린더</span>}
        </Link>
        <Link href="/stats" className={`${styles.navItem} ${pathname === '/stats' ? styles.active : ''}`}>
          <BarChart3 size={20} />
          {!isSidebarCollapsed && <span>통계</span>}
        </Link>
      </nav>



      <button 
        className={`${styles.sidebarToggle} ${isHovered ? styles.visible : ''}`} 
        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      >
        {isSidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>
    </aside>
  )
}

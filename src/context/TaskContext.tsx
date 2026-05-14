'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { Task, Project } from '@/lib/supabase'

const DEFAULT_PROJECTS: Project[] = [
  { id: '1', name: '개인 업무', color: '#3b82f6' },
  { id: '2', name: '디자인', color: '#ec4899' },
  { id: '3', name: '개발', color: '#10b981' },
]

interface TaskContextType {
  tasks: Task[]
  projects: Project[]
  userName: string
  selectedDate: string
  isSidebarCollapsed: boolean
  isLoading: boolean
  setIsSidebarCollapsed: (v: boolean) => void
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>
  setUserName: (name: string) => void
  setSelectedDate: (date: string) => void
  addTask: (title: string, projectId: string) => void
  toggleTask: (id: string) => void
  deleteTask: (id: string) => void
  updateTask: (id: string, newTitle: string) => void
  addProject: (name: string, color: string) => void
  deleteProject: (id: string) => void
  updateProject: (id: string, name: string, color: string) => void
  aiDetailsMap: Record<string, Record<string, string[]>>
  updateAiDetails: (date: string, details: Record<string, string[]> | null) => void
  getTodayLocal: () => string
}

const TaskContext = createContext<TaskContextType | undefined>(undefined)

export function TaskProvider({ children }: { children: React.ReactNode }) {
  const getTodayLocal = () => {
    const now = new Date()
    const y = now.getFullYear()
    const m = String(now.getMonth() + 1).padStart(2, '0')
    const d = String(now.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }

  const [tasks, setTasks] = useState<Task[]>([])
  const [projects, setProjects] = useState<Project[]>(DEFAULT_PROJECTS)
  const [userName, setUserName] = useState('사용자')
  const [selectedDate, setSelectedDate] = useState(getTodayLocal())
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [aiDetailsMap, setAiDetailsMap] = useState<Record<string, Record<string, string[]>>>({})
  const [isMounted, setIsMounted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Load data from File API on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)
        const res = await fetch('/api/storage')
        if (res.ok) {
          const data = await res.json()
          if (data.tasks) setTasks(data.tasks)
          if (data.projects) setProjects(data.projects)
          if (data.userName) setUserName(data.userName)
          if (data.aiDetailsMap) setAiDetailsMap(data.aiDetailsMap)
        }
      } catch (err) {
        console.error('Failed to load data from file:', err)
      } finally {
        setIsMounted(true)
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  // Save data to File API whenever state changes (with debounce)
  useEffect(() => {
    if (!isMounted) return

    const saveData = async () => {
      try {
        await fetch('/api/storage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tasks,
            projects,
            userName,
            aiDetailsMap
          })
        })
      } catch (err) {
        console.error('Failed to save data to file:', err)
      }
    }

    const timer = setTimeout(saveData, 500)
    return () => clearTimeout(timer)
  }, [tasks, projects, userName, aiDetailsMap, isMounted])

  const updateAiDetails = (date: string, details: Record<string, string[]> | null) => {
    setAiDetailsMap(prev => {
      const newMap = { ...prev }
      if (details === null) {
        delete newMap[date]
      } else {
        newMap[date] = details
      }
      return newMap
    })
  }

  const addTask = (title: string, projectId: string) => {
    if (isLoading) return // Prevent adding tasks while loading
    // Ensure string comparison for IDs
    const project = projects.find(p => String(p.id) === String(projectId))
    const now = new Date()
    const timeStr = now.toTimeString().split(' ')[0]
    const isoString = `${selectedDate}T${timeStr}.000`
    
    const newTask: Task = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      project_id: String(projectId),
      project_name: project?.name || '기타',
      project_color: project?.color || '#94a3b8',
      status: 'todo' as const,
      priority: 'medium' as const,
      tags: [],
      created_at: isoString
    }
    setTasks(prev => [newTask, ...prev])
  }

  const toggleTask = (id: string) => {
    if (isLoading) return
    setTasks(prev => prev.map(task => {
      if (task.id === id) {
        const newStatus = task.status === 'completed' ? 'todo' : 'completed'
        const now = new Date()
        const timeStr = now.toTimeString().split(' ')[0]
        const completedAt = newStatus === 'completed' ? `${getTodayLocal()}T${timeStr}.000` : undefined
        return {
          ...task,
          status: newStatus as any,
          completed_at: completedAt
        }
      }
      return task
    }))
  }

  const deleteTask = (id: string) => {
    if (isLoading) return
    setTasks(prev => prev.filter(task => task.id !== id))
  }

  const updateTask = (id: string, newTitle: string) => {
    if (isLoading) return
    setTasks(prev => prev.map(task => 
      task.id === id ? { ...task, title: newTitle } : task
    ))
  }

  const addProject = (name: string, color: string) => {
    const newProject: Project = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      color
    }
    setProjects(prev => [...prev, newProject])
  }

  const deleteProject = (id: string) => {
    if (projects.length <= 1) return
    setProjects(prev => prev.filter(p => p.id !== id))
  }

  const updateProject = (id: string, name: string, color: string) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, name, color } : p))
    // Update tasks that use this project to sync name and color
    setTasks(prev => prev.map(task => task.project_id === id ? { 
      ...task, 
      project_name: name, 
      project_color: color 
    } : task))
  }

  const handleSetUserName = (name: string) => {
    setUserName(name)
  }

  return (
    <TaskContext.Provider value={{ 
      tasks, projects, userName, selectedDate, isSidebarCollapsed, isLoading,
      setTasks, setProjects, setUserName: handleSetUserName, setSelectedDate,
      setIsSidebarCollapsed,
      addTask, toggleTask, deleteTask, updateTask, addProject, deleteProject, updateProject,
      aiDetailsMap, updateAiDetails,
      getTodayLocal
    }}>
      {children}
    </TaskContext.Provider>
  )
}

export function useTasks() {
  const context = useContext(TaskContext)
  if (context === undefined) {
    throw new Error('useTasks must be used within a TaskProvider')
  }
  return context
}

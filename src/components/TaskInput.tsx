'use client'

import React, { useState, useRef } from 'react'
import { Plus, Send, Hash, X, Palette, Settings2, Check, Edit2 } from 'lucide-react'
import { Project } from '@/lib/supabase'
import styles from './TaskInput.module.css'

interface TaskInputProps {
  onAdd: (title: string, projectId: string) => void
  projects: Project[]
  onAddProject: (name: string, color: string) => void
  onDeleteProject: (id: string) => void
  onUpdateProject: (id: string, name: string, color: string) => void
}

export default function TaskInput({ onAdd, projects, onAddProject, onDeleteProject, onUpdateProject }: TaskInputProps) {
  const [title, setTitle] = useState('')
  const [projectId, setProjectId] = useState(projects[0]?.id || '')
  const [isAddingProject, setIsAddingProject] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectColor, setNewProjectColor] = useState('#3b82f6')
  
  // Project editing states
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState('')

  // Ensure projectId is always valid whenever projects list changes
  React.useEffect(() => {
    if (projects.length > 0) {
      const isValid = projects.some(p => String(p.id) === String(projectId))
      if (!isValid) {
        setProjectId(projects[0].id)
      }
    }
  }, [projects, projectId])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !projectId) return
    onAdd(title, projectId)
    setTitle('')
  }

  const handleAddProject = () => {
    if (!newProjectName.trim()) return
    onAddProject(newProjectName.trim(), newProjectColor)
    setNewProjectName('')
  }

  const startEditing = (p: Project) => {
    setEditingProjectId(p.id)
    setEditName(p.name)
    setEditColor(p.color)
  }

  const handleUpdate = () => {
    if (editingProjectId && editName.trim()) {
      onUpdateProject(editingProjectId, editName.trim(), editColor)
      setEditingProjectId(null)
    }
  }

  const selectedProject = projects.find(p => p.id === projectId)

  return (
    <div className={styles.wrapper}>
      <form className={`${styles.container} glass`} onSubmit={handleSubmit}>
        <div className={styles.inputSection}>
          <div className={styles.inputWrapper}>
            <Plus className={styles.icon} size={20} />
            <input
              type="text"
              placeholder="오늘 어떤 업무를 완료하실 건가요?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={styles.input}
            />
          </div>
          
          <div className={styles.metaWrapper}>
            <div 
              className={styles.projectSelect} 
              style={{ borderColor: selectedProject?.color + '66' }}
            >
              <Hash size={14} style={{ color: selectedProject?.color }} />
              <select 
                value={projectId} 
                onChange={(e) => setProjectId(e.target.value)}
                className={styles.select}
              >
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <button 
              type="button" 
              className={styles.manageBtn}
              onClick={() => setIsAddingProject(true)}
              title="프로젝트 관리"
            >
              <Settings2 size={16} />
              <span>관리</span>
            </button>
          </div>
        </div>

        <button type="submit" className={styles.submitBtn} disabled={!title.trim()}>
          <Send size={18} />
          <span>업무 추가</span>
        </button>
      </form>

      {isAddingProject && (
        <div className={styles.overlay} onClick={() => setIsAddingProject(false)}>
          <div className={`${styles.modal} glass`} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>프로젝트 관리</h3>
              <button className={styles.closeBtn} onClick={() => setIsAddingProject(false)}>
                <X size={20} />
              </button>
            </div>

            <div className={styles.addSection}>
              <p className={styles.sectionTitle}>새 프로젝트 추가</p>
              <div className={styles.addForm}>
                <input 
                  autoFocus
                  placeholder="프로젝트 이름" 
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className={styles.modalInput}
                />
                <div className={styles.colorPickerContainer}>
                  <label className={styles.colorWheelLabel} title="색상 선택">
                    <input 
                      type="color" 
                      value={newProjectColor}
                      onChange={(e) => setNewProjectColor(e.target.value)}
                      className={styles.hiddenColorInput}
                    />
                    <div 
                      className={styles.colorWheel} 
                      style={{ border: `3px solid ${newProjectColor}` }}
                    />
                  </label>
                </div>
                <button className={styles.modalAddBtn} onClick={handleAddProject}>
                  <Plus size={18} />
                </button>
              </div>
            </div>

            <div className={styles.listSection}>
              <p className={styles.sectionTitle}>기존 프로젝트 ({projects.length})</p>
              <div className={styles.projectList}>
                {projects.map(p => (
                  <div key={p.id} className={styles.projectItem}>
                    {editingProjectId === p.id ? (
                      <div className={styles.editForm}>
                        <label className={styles.colorPickerMini}>
                          <input type="color" value={editColor} onChange={e => setEditColor(e.target.value)} className={styles.hiddenColorInput} />
                          <div className={styles.colorDotLarge} style={{ background: editColor }} />
                        </label>
                        <input 
                          autoFocus
                          className={styles.miniInput} 
                          value={editName} 
                          onChange={e => setEditName(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleUpdate()}
                        />
                        <button className={styles.saveEditBtn} onClick={handleUpdate}><Check size={16} /></button>
                      </div>
                    ) : (
                      <>
                        <div className={styles.projInfo}>
                          <span className={styles.colorDot} style={{ background: p.color }}></span>
                          <span className={styles.projNameText}>{p.name}</span>
                        </div>
                        <div className={styles.actionBtns}>
                          <button className={styles.editBtn} onClick={() => startEditing(p)}><Edit2 size={14} /></button>
                          {projects.length > 1 && (
                            <button className={styles.delProjBtn} onClick={() => onDeleteProject(p.id)}><X size={14} /></button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

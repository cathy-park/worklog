'use client'

import React, { useState } from 'react'
import { CheckCircle2, Circle, Trash2, Edit2, Check } from 'lucide-react'
import { motion } from 'framer-motion'
import { Task } from '@/lib/supabase'
import styles from './TaskCard.module.css'

interface TaskCardProps {
  task: Task
  onToggle: (id: string) => void
  onDelete: (id: string) => void
  onEdit: (id: string, newTitle: string) => void
}

export default function TaskCard({ task, onToggle, onDelete, onEdit }: TaskCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(task.title)
  const isCompleted = task.status === 'completed'

  const handleSave = () => {
    if (editTitle.trim() && editTitle !== task.title) {
      onEdit(task.id, editTitle)
    }
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditTitle(task.title)
    setIsEditing(false)
  }

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`${styles.card} glass ${isCompleted ? styles.completed : ''} ${isEditing ? styles.isEditing : ''}`}
    >
      <button 
        className={styles.checkBtn} 
        onClick={() => onToggle(task.id)}
      >
        {isCompleted ? (
          <CheckCircle2 className={styles.checkedIcon} size={24} />
        ) : (
          <Circle className={styles.circleIcon} size={24} />
        )}
      </button>

      <div className={styles.content}>
        {isEditing ? (
          <input 
            autoFocus
            className={styles.editInput}
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={handleSave}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave()
              if (e.key === 'Escape') handleCancel()
            }}
          />
        ) : (
          <h3 className={styles.title} onClick={() => !isCompleted && setIsEditing(true)}>
            {task.title}
          </h3>
        )}
        {task.project_name && (
          <span 
            className={styles.projectTag}
            style={{ 
              backgroundColor: `${task.project_color}22`,
              color: task.project_color,
              borderColor: `${task.project_color}44`
            }}
          >
            {task.project_name}
          </span>
        )}
      </div>

      <div className={styles.actions}>
        {!isEditing && !isCompleted && (
          <button className={styles.editBtn} onClick={() => setIsEditing(true)}>
            <Edit2 size={16} />
          </button>
        )}
        <button className={styles.deleteBtn} onClick={() => onDelete(task.id)}>
          <Trash2 size={18} />
        </button>
      </div>
    </motion.div>
  )
}

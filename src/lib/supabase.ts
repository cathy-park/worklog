import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type TaskStatus = 'todo' | 'in_progress' | 'completed'

export interface Project {
  id: string
  name: string
  color: string
}

export interface Task {
  id: string
  user_id?: string
  project_id?: string
  title: string
  description?: string
  status: TaskStatus
  priority: 'low' | 'medium' | 'high'
  tags: string[]
  created_at: string
  completed_at?: string
  project_name?: string
  project_color?: string
}

export interface Report {
  id: string
  user_id: string
  period_type: 'daily' | 'weekly' | 'monthly'
  start_date: string
  end_date: string
  content: string
  created_at: string
}

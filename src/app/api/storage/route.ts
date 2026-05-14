import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

// 사용자의 로컬 환경에 맞춘 절대 경로 지정
const DATA_DIR = '/Users/apple/Desktop/A/worklog/data'
const DATA_FILE = path.join(DATA_DIR, 'db.json')

// Ensure directory and file exist
function initStorage() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      console.log('Creating data directory at:', DATA_DIR)
      fs.mkdirSync(DATA_DIR, { recursive: true })
    }
    if (!fs.existsSync(DATA_FILE)) {
      console.log('Initializing db.json at:', DATA_FILE)
      fs.writeFileSync(DATA_FILE, JSON.stringify({
        tasks: [],
        projects: [
          { id: '1', name: '개인 업무', color: '#3b82f6' },
          { id: '2', name: '디자인', color: '#ec4899' },
          { id: '3', name: '개발', color: '#10b981' },
        ],
        userName: '사용자',
        aiDetailsMap: {}
      }, null, 2))
    }
  } catch (err) {
    console.error('Error initializing storage:', err)
  }
}

export async function GET() {
  try {
    initStorage()
    const data = fs.readFileSync(DATA_FILE, 'utf-8')
    return NextResponse.json(JSON.parse(data))
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load data' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    initStorage()
    const body = await req.json()
    fs.writeFileSync(DATA_FILE, JSON.stringify(body, null, 2))
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save data' }, { status: 500 })
  }
}

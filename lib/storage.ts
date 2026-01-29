// IndexedDB storage for Consensus projects

export interface Project {
  id: string
  title: string
  problem: string
  constraints: {
    budget?: string
    timeframe?: string
    stakeholders?: string[]
    legal?: string
    priority?: string
  }
  answers?: Record<string, string>
  result?: DecisionPackage
  createdAt: string
  updatedAt: string
}

export interface DecisionPackage {
  title: string
  headline: string
  summary: string
  options: Array<{
    id: string
    title: string
    description: string
    pros: string[]
    cons: string[]
    estimated_cost: string
    estimated_time_weeks: number
    success_probability: number
  }>
  recommended_plan: Array<{
    step_number: number
    action: string
    owner: string
    estimated_time_days: number
  }>
  scenarios: {
    best: string
    expected: string
    worst: string
  }
  stakeholder_messages: Array<{
    stakeholder: string
    channel: string
    tone: 'formal' | 'neutral' | 'persuasive'
    message: string
  }>
  metrics: Array<{
    metric_name: string
    target: string
    measure_frequency: string
  }>
  processing_notes: string | null
}

const DB_NAME = 'consensus-db'
const DB_VERSION = 1
const STORE_NAME = 'projects'

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
        store.createIndex('updatedAt', 'updatedAt', { unique: false })
      }
    }
  })
}

export async function getAllProjects(): Promise<Project[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const request = store.getAll()
    
    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      const projects = request.result as Project[]
      projects.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      resolve(projects)
    }
  })
}

export async function getProject(id: string): Promise<Project | undefined> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const request = store.get(id)
    
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result as Project | undefined)
  })
}

export async function saveProject(project: Project): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const request = store.put({
      ...project,
      updatedAt: new Date().toISOString()
    })
    
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

export async function deleteProject(id: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const request = store.delete(id)
    
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

export function generateId(): string {
  return `proj_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

export function exportProject(project: Project): string {
  return JSON.stringify(project, null, 2)
}

export function exportAllProjects(projects: Project[]): string {
  return JSON.stringify({ 
    exported: new Date().toISOString(),
    projects 
  }, null, 2)
}

export function importProjects(jsonString: string): Project[] {
  const data = JSON.parse(jsonString)
  if (data.projects && Array.isArray(data.projects)) {
    return data.projects
  }
  if (Array.isArray(data)) {
    return data
  }
  if (data.id && data.problem) {
    return [data]
  }
  throw new Error('Invalid project data format')
}

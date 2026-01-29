'use client'

import React from "react"

import { useState, useEffect, useRef } from 'react'
import { Header } from '@/components/consensus/header'
import { ProblemInput } from '@/components/consensus/problem-input'
import { ClarifyingQuestions } from '@/components/consensus/clarifying-questions'
import { ResultCard } from '@/components/consensus/result-card'
import { ProjectsList } from '@/components/consensus/projects-list'
import { Button } from '@/components/ui/button'
import { Loader2, Sparkles, Save } from 'lucide-react'
import { toast } from 'sonner'
import { 
  getAllProjects, 
  saveProject, 
  deleteProject, 
  generateId,
  exportProject,
  importProjects,
  type Project,
  type DecisionPackage
} from '@/lib/storage'
import type { Constraints, ClarifyingQuestion, GeminiStatus } from '@/lib/types'

export default function ConsensusDashboard() {
  // State
  const [problem, setProblem] = useState('')
  const [constraints, setConstraints] = useState<Constraints>({})
  const [questions, setQuestions] = useState<ClarifyingQuestion[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [result, setResult] = useState<DecisionPackage | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null)
  
  // Loading states
  const [isLoadingClarify, setIsLoadingClarify] = useState(false)
  const [isLoadingProduce, setIsLoadingProduce] = useState(false)
  
  // Gemini status
  const [geminiStatus, setGeminiStatus] = useState<GeminiStatus | null>(null)
  
  // File input ref
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load projects and check Gemini status on mount
  useEffect(() => {
    loadProjects()
    checkGeminiStatus()
  }, [])

  const checkGeminiStatus = async () => {
    try {
      const res = await fetch('/api/check-gemini')
      const data = await res.json()
      setGeminiStatus(data)
    } catch {
      setGeminiStatus({ geminiConfigured: false, reason: 'Failed to check status' })
    }
  }

  const loadProjects = async () => {
    try {
      const loaded = await getAllProjects()
      setProjects(loaded)
    } catch (error) {
      console.error('Failed to load projects:', error)
    }
  }

  const handleRequestClarification = async () => {
    if (!geminiStatus?.geminiConfigured || problem.length < 10) return

    setIsLoadingClarify(true)
    try {
      const res = await fetch('/api/clarify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problem, constraints })
      })

      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate questions')
      }

      setQuestions(data.questions || [])
      toast.success('Clarifying questions generated')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to generate questions')
    } finally {
      setIsLoadingClarify(false)
    }
  }

  const handleProducePackage = async () => {
    if (!geminiStatus?.geminiConfigured || problem.length < 10) return

    setIsLoadingProduce(true)
    setResult(null)
    
    try {
      const res = await fetch('/api/produce', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'gemini',
          problem,
          constraints,
          answers: Object.keys(answers).length > 0 ? answers : undefined
        })
      })

      const data = await res.json()
      
      if (!res.ok) {
        // Handle quota errors specially
        if (data.isQuotaError || res.status === 429) {
          toast.error('API Quota Exceeded: Free tier limit reached. Please wait and try again, or upgrade your plan.')
          return
        }
        throw new Error(data.error || 'Failed to produce decision package')
      }

      setResult(data.result)
      toast.success('Decision package generated successfully')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to produce decision package'
      toast.error(message)
    } finally {
      setIsLoadingProduce(false)
    }
  }

  const handleSaveProject = async () => {
    const projectId = currentProjectId || generateId()
    const project: Project = {
      id: projectId,
      title: result?.title || problem.substring(0, 50),
      problem,
      constraints,
      answers: Object.keys(answers).length > 0 ? answers : undefined,
      result: result || undefined,
      createdAt: currentProjectId ? projects.find(p => p.id === projectId)?.createdAt || new Date().toISOString() : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    try {
      await saveProject(project)
      setCurrentProjectId(projectId)
      await loadProjects()
      toast.success('Project saved locally')
    } catch (error) {
      toast.error('Failed to save project')
    }
  }

  const handleLoadProject = (project: Project) => {
    setProblem(project.problem)
    setConstraints(project.constraints)
    setAnswers(project.answers || {})
    setResult(project.result || null)
    setCurrentProjectId(project.id)
    setQuestions([])
    toast.success('Project loaded')
  }

  const handleDeleteProject = async (id: string) => {
    try {
      await deleteProject(id)
      if (currentProjectId === id) {
        setCurrentProjectId(null)
      }
      await loadProjects()
      toast.success('Project deleted')
    } catch {
      toast.error('Failed to delete project')
    }
  }

  const handleExportProject = (project: Project) => {
    const json = exportProject(project)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `consensus-${project.id}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Project exported')
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const imported = importProjects(text)
      
      for (const project of imported) {
        project.id = generateId()
        project.createdAt = new Date().toISOString()
        project.updatedAt = new Date().toISOString()
        await saveProject(project)
      }
      
      await loadProjects()
      toast.success(`Imported ${imported.length} project(s)`)
    } catch {
      toast.error('Failed to import projects - invalid format')
    }
    
    e.target.value = ''
  }

  const handleExportJSON = () => {
    if (!result) return
    const json = JSON.stringify(result, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `decision-package-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('JSON exported')
  }

  const handleExportPDF = () => {
    if (!result) return
    // Create printable HTML
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${result.title}</title>
        <style>
          body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px 20px; line-height: 1.6; }
          h1 { color: #0d7377; border-bottom: 2px solid #0d7377; padding-bottom: 10px; }
          h2 { color: #333; margin-top: 30px; }
          h3 { color: #555; }
          .summary { background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .option { border: 1px solid #ddd; padding: 20px; border-radius: 8px; margin: 15px 0; }
          .pros { color: #22c55e; }
          .cons { color: #ef4444; }
          .step { display: flex; gap: 15px; margin: 15px 0; }
          .step-num { background: #0d7377; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
          .scenario { padding: 15px; border-radius: 8px; margin: 10px 0; }
          .best { background: #dcfce7; }
          .expected { background: #fef9c3; }
          .worst { background: #fee2e2; }
          .message { border-left: 3px solid #0d7377; padding-left: 15px; margin: 15px 0; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <h1>${result.title}</h1>
        <p><strong>${result.headline}</strong></p>
        <div class="summary">${result.summary}</div>
        
        <h2>Options Analysis</h2>
        ${result.options.map((opt, i) => `
          <div class="option">
            <h3>Option ${i + 1}: ${opt.title}</h3>
            <p>${opt.description}</p>
            <p><strong>Success Probability:</strong> ${opt.success_probability}% | <strong>Cost:</strong> ${opt.estimated_cost} | <strong>Time:</strong> ${opt.estimated_time_weeks} weeks</p>
            <p class="pros"><strong>Pros:</strong> ${opt.pros.join(', ')}</p>
            <p class="cons"><strong>Cons:</strong> ${opt.cons.join(', ')}</p>
          </div>
        `).join('')}
        
        <h2>Recommended Plan</h2>
        ${result.recommended_plan.map(step => `
          <div class="step">
            <div class="step-num">${step.step_number}</div>
            <div>
              <strong>${step.action}</strong><br/>
              <small>Owner: ${step.owner} | Duration: ${step.estimated_time_days} days</small>
            </div>
          </div>
        `).join('')}
        
        <h2>Scenario Analysis</h2>
        <div class="scenario best"><strong>Best Case:</strong> ${result.scenarios.best}</div>
        <div class="scenario expected"><strong>Expected Case:</strong> ${result.scenarios.expected}</div>
        <div class="scenario worst"><strong>Worst Case:</strong> ${result.scenarios.worst}</div>
        
        <h2>Stakeholder Messages</h2>
        ${result.stakeholder_messages.map(msg => `
          <div class="message">
            <strong>${msg.stakeholder}</strong> (${msg.channel} - ${msg.tone})<br/>
            ${msg.message}
          </div>
        `).join('')}
        
        <h2>Success Metrics</h2>
        <ul>
          ${result.metrics.map(m => `<li><strong>${m.metric_name}:</strong> Target: ${m.target} (${m.measure_frequency})</li>`).join('')}
        </ul>
        
        <p style="margin-top: 40px; color: #888; font-size: 12px;">Generated by Consensus AI Decision Engine</p>
      </body>
      </html>
    `
    
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(printContent)
      printWindow.document.close()
      printWindow.print()
    }
  }

  const handleNewProject = () => {
    setProblem('')
    setConstraints({})
    setQuestions([])
    setAnswers({})
    setResult(null)
    setCurrentProjectId(null)
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground text-balance">
              Turn Problems into Action
            </h1>
            <p className="mt-2 text-muted-foreground text-lg">
              AI-powered decision packages in minutes
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Problem Input */}
              <ProblemInput
                problem={problem}
                setProblem={setProblem}
                constraints={constraints}
                setConstraints={setConstraints}
                onRequestClarification={handleRequestClarification}
                isLoading={isLoadingClarify}
                geminiConfigured={geminiStatus?.geminiConfigured || false}
              />

              {/* Clarifying Questions */}
              <ClarifyingQuestions
                questions={questions}
                answers={answers}
                setAnswers={setAnswers}
              />

              {/* Produce Button */}
              <div className="flex gap-3">
                <Button
                  onClick={handleProducePackage}
                  disabled={!geminiStatus?.geminiConfigured || problem.length < 10 || isLoadingProduce}
                  size="lg"
                  className="flex-1 h-14 text-lg"
                >
                  {isLoadingProduce ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Generating Package...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      Produce Decision Package
                    </>
                  )}
                </Button>
                
                {(problem || result) && (
                  <Button
                    onClick={handleSaveProject}
                    variant="outline"
                    size="lg"
                    className="h-14 bg-transparent"
                  >
                    <Save className="w-5 h-5 mr-2" />
                    Save
                  </Button>
                )}
              </div>

              {currentProjectId && (
                <Button
                  onClick={handleNewProject}
                  variant="ghost"
                  className="w-full"
                >
                  Start New Project
                </Button>
              )}

              {/* Result */}
              {result && (
                <ResultCard
                  result={result}
                  onExportJSON={handleExportJSON}
                  onExportPDF={handleExportPDF}
                />
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <ProjectsList
                  projects={projects}
                  onLoad={handleLoadProject}
                  onDelete={handleDeleteProject}
                  onExport={handleExportProject}
                  onImport={handleImportClick}
                />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileImport}
        className="hidden"
      />
    </div>
  )
}

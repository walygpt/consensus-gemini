'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  FolderOpen, 
  Trash2, 
  Download, 
  Upload,
  Clock
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import type { Project } from '@/lib/storage'

interface ProjectsListProps {
  projects: Project[]
  onLoad: (project: Project) => void
  onDelete: (id: string) => void
  onExport: (project: Project) => void
  onImport: () => void
}

export function ProjectsList({ 
  projects, 
  onLoad, 
  onDelete, 
  onExport,
  onImport 
}: ProjectsListProps) {
  return (
    <Card className="shadow-lg border-border/50">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
              <FolderOpen className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">Saved Projects</CardTitle>
              <CardDescription>{projects.length} project{projects.length !== 1 ? 's' : ''} stored locally</CardDescription>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={onImport}>
            <Upload className="w-4 h-4 mr-2" />
            Import
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {projects.length === 0 ? (
          <div className="text-center py-8">
            <FolderOpen className="w-12 h-12 mx-auto text-muted-foreground/50" />
            <p className="mt-2 text-sm text-muted-foreground">No saved projects yet</p>
            <p className="text-xs text-muted-foreground">Your decision packages will appear here</p>
          </div>
        ) : (
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-3">
              {projects.map((project) => (
                <div 
                  key={project.id}
                  className="p-4 rounded-xl border border-border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{project.title || 'Untitled Project'}</h4>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {project.problem.substring(0, 100)}...
                      </p>
                      <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true })}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button 
                      variant="default" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => onLoad(project)}
                    >
                      Load
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => onExport(project)}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => onDelete(project.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}

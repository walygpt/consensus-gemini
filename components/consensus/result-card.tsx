'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { 
  CheckCircle2, 
  XCircle, 
  ChevronDown, 
  Copy, 
  Download,
  Target,
  TrendingUp,
  TrendingDown,
  Minus,
  Users,
  BarChart3,
  ListChecks,
  Code,
  Sparkles
} from 'lucide-react'
import { toast } from 'sonner'
import type { DecisionPackage } from '@/lib/storage'

interface ResultCardProps {
  result: DecisionPackage
  onExportJSON: () => void
  onExportPDF: () => void
}

export function ResultCard({ result, onExportJSON, onExportPDF }: ResultCardProps) {
  const [jsonOpen, setJsonOpen] = useState(false)

  const copyMessage = (message: string) => {
    navigator.clipboard.writeText(message)
    toast.success('Message copied to clipboard')
  }

  const getSuccessColor = (probability: number) => {
    if (probability >= 70) return 'text-green-600 dark:text-green-400'
    if (probability >= 40) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }

  const getProgressColor = (probability: number) => {
    if (probability >= 70) return 'bg-green-500'
    if (probability >= 40) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  return (
    <Card className="shadow-lg border-border/50">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-xl text-balance">{result.title}</CardTitle>
            <CardDescription className="text-balance">{result.headline}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary */}
        <div className="p-4 rounded-xl bg-muted/50">
          <p className="text-sm text-foreground leading-relaxed">{result.summary}</p>
        </div>

        <Tabs defaultValue="options" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="options" className="text-xs sm:text-sm">Options</TabsTrigger>
            <TabsTrigger value="plan" className="text-xs sm:text-sm">Plan</TabsTrigger>
            <TabsTrigger value="scenarios" className="text-xs sm:text-sm">Scenarios</TabsTrigger>
            <TabsTrigger value="messages" className="text-xs sm:text-sm">Messages</TabsTrigger>
          </TabsList>

          {/* Options Tab */}
          <TabsContent value="options" className="space-y-4 mt-4">
            {result.options.map((option, i) => (
              <Card key={option.id} className="border-border/50">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Badge variant="outline" className="mb-2">Option {i + 1}</Badge>
                      <CardTitle className="text-lg">{option.title}</CardTitle>
                    </div>
                    <div className="text-right">
                      <span className={`text-2xl font-bold ${getSuccessColor(option.success_probability)}`}>
                        {option.success_probability}%
                      </span>
                      <p className="text-xs text-muted-foreground">success rate</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{option.description}</p>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Success Probability</span>
                      <span>{option.success_probability}%</span>
                    </div>
                    <Progress 
                      value={option.success_probability} 
                      className="h-2"
                      style={{
                        ['--progress-foreground' as string]: getProgressColor(option.success_probability)
                      }}
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-green-600 dark:text-green-400">
                        <CheckCircle2 className="w-4 h-4" />
                        Pros
                      </div>
                      <ul className="space-y-1">
                        {option.pros.map((pro, j) => (
                          <li key={j} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-green-500 mt-1.5">+</span>
                            {pro}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-red-600 dark:text-red-400">
                        <XCircle className="w-4 h-4" />
                        Cons
                      </div>
                      <ul className="space-y-1">
                        {option.cons.map((con, j) => (
                          <li key={j} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-red-500 mt-1.5">-</span>
                            {con}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4 pt-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Est. Cost:</span>{' '}
                      <span className="font-medium">{option.estimated_cost}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Est. Time:</span>{' '}
                      <span className="font-medium">{option.estimated_time_weeks} weeks</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Plan Tab */}
          <TabsContent value="plan" className="mt-4">
            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <ListChecks className="w-5 h-5 text-primary" />
                  <CardTitle className="text-lg">Recommended Plan</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {result.recommended_plan.map((step) => (
                    <div key={step.step_number} className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-medium">
                        {step.step_number}
                      </div>
                      <div className="flex-1 pt-1">
                        <p className="font-medium">{step.action}</p>
                        <div className="flex flex-wrap gap-3 mt-1 text-sm text-muted-foreground">
                          <span>Owner: {step.owner}</span>
                          <span>Duration: {step.estimated_time_days} days</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Metrics */}
            <Card className="border-border/50 mt-4">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  <CardTitle className="text-lg">Success Metrics</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2">
                  {result.metrics.map((metric, i) => (
                    <div key={i} className="p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-primary" />
                        <span className="font-medium text-sm">{metric.metric_name}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">Target: {metric.target}</p>
                      <p className="text-xs text-muted-foreground">Measure: {metric.measure_frequency}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Scenarios Tab */}
          <TabsContent value="scenarios" className="mt-4">
            <div className="grid gap-4">
              <Card className="border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-green-700 dark:text-green-300">Best Case</h4>
                      <p className="text-sm text-green-600/80 dark:text-green-400/80 mt-1">{result.scenarios.best}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-yellow-200 dark:border-yellow-800 bg-yellow-50/50 dark:bg-yellow-950/20">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center">
                      <Minus className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-yellow-700 dark:text-yellow-300">Expected Case</h4>
                      <p className="text-sm text-yellow-600/80 dark:text-yellow-400/80 mt-1">{result.scenarios.expected}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900 flex items-center justify-center">
                      <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-red-700 dark:text-red-300">Worst Case</h4>
                      <p className="text-sm text-red-600/80 dark:text-red-400/80 mt-1">{result.scenarios.worst}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Messages Tab */}
          <TabsContent value="messages" className="mt-4">
            <div className="space-y-4">
              {result.stakeholder_messages.map((msg, i) => (
                <Card key={i} className="border-border/50">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                          <Users className="w-5 h-5 text-accent" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold">{msg.stakeholder}</span>
                            <Badge variant="outline" className="text-xs">{msg.channel}</Badge>
                            <Badge variant="secondary" className="text-xs capitalize">{msg.tone}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">{msg.message}</p>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => copyMessage(msg.message)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* JSON Viewer */}
        <Collapsible open={jsonOpen} onOpenChange={setJsonOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="w-full justify-between bg-transparent">
              <span className="flex items-center gap-2">
                <Code className="w-4 h-4" />
                View Raw JSON
              </span>
              <ChevronDown className={`w-4 h-4 transition-transform ${jsonOpen ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2">
            <pre className="p-4 rounded-xl bg-muted text-xs overflow-x-auto max-h-96">
              {JSON.stringify(result, null, 2)}
            </pre>
          </CollapsibleContent>
        </Collapsible>

        {/* Export Buttons */}
        <div className="flex gap-3">
          <Button onClick={onExportJSON} variant="outline" className="flex-1 bg-transparent">
            <Download className="w-4 h-4 mr-2" />
            Export JSON
          </Button>
          <Button onClick={onExportPDF} variant="outline" className="flex-1 bg-transparent">
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

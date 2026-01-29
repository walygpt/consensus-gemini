'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Download, Wifi, WifiOff, Scale } from 'lucide-react'
import type { GeminiStatus } from '@/lib/types'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function Header() {
  const [geminiStatus, setGeminiStatus] = useState<GeminiStatus | null>(null)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Check Gemini status
    fetch('/api/check-gemini')
      .then(res => res.json())
      .then(data => setGeminiStatus(data))
      .catch(() => setGeminiStatus({ geminiConfigured: false, reason: 'Failed to check status' }))

    // PWA install prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)
    
    // Register service worker (only in production/proper deployment)
    if ('serviceWorker' in navigator && typeof window !== 'undefined') {
      // Delay registration to avoid blocking initial load
      setTimeout(() => {
        navigator.serviceWorker
          .register('/sw.js', { scope: '/' })
          .catch((error) => {
            // Silently fail in development/preview environments
            if (process.env.NODE_ENV === 'development') {
              console.debug('Service worker registration failed (expected in preview):', error.message)
            }
          })
      }, 1000)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    
    if (outcome === 'accepted') {
      setIsInstalled(true)
    }
    setDeferredPrompt(null)
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary">
            <Scale className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-semibold tracking-tight text-foreground">Consensus</span>
            <span className="text-xs text-muted-foreground hidden sm:block">AI Decision Engine</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {geminiStatus && (
            <Badge 
              variant={geminiStatus.geminiConfigured ? 'default' : 'secondary'}
              className="flex items-center gap-1.5 px-2.5 py-1"
            >
              {geminiStatus.geminiConfigured ? (
                <>
                  <Wifi className="w-3 h-3" />
                  <span className="hidden sm:inline">Gemini:</span> Connected
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3" />
                  <span className="hidden sm:inline">Gemini:</span> Not configured
                </>
              )}
            </Badge>
          )}

          {!isInstalled && deferredPrompt && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleInstall}
              className="flex items-center gap-2 bg-transparent"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Install</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}

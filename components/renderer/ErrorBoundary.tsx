// Error boundary components for renderer error handling
'use client'

import React, { Component, type ReactNode, type ErrorInfo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, RefreshCw, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  componentContext?: {
    componentType?: string
    slotName?: string
    patternFamily?: string
    patternVariant?: number
  }
}

export interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo, context?: ErrorBoundaryState['componentContext']) => void
  componentContext?: ErrorBoundaryState['componentContext']
  className?: string
  showRetry?: boolean
}

/**
 * Base error boundary class component
 */
export class ErrorBoundaryBase extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      componentContext: props.componentContext,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      errorInfo,
    })

    // Report error to telemetry if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo, this.state.componentContext)
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      const { error, componentContext } = this.state
      const errorMessage = error?.message || 'An unexpected error occurred'
      const componentInfo = componentContext
        ? `${componentContext.componentType || 'Component'}${componentContext.slotName ? ` (slot: ${componentContext.slotName})` : ''}`
        : 'Component'

      return (
        <div className={cn('p-4', this.props.className)}>
          <Card className="border-destructive">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                <CardTitle>Rendering Error</CardTitle>
              </div>
              <CardDescription>
                Failed to render {componentInfo}
                {componentContext?.patternFamily && (
                  <> in pattern {componentContext.patternFamily}</>
                )}
                {componentContext?.patternVariant && (
                  <> variant {componentContext.patternVariant}</>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-destructive mb-2">Error Details:</p>
                  <pre className="text-xs bg-muted p-3 rounded-md overflow-auto max-h-48">
                    {errorMessage}
                    {this.state.errorInfo?.componentStack && (
                      <>
                        {'\n\n'}
                        Component Stack:
                        {this.state.errorInfo.componentStack}
                      </>
                    )}
                  </pre>
                </div>
                {this.props.showRetry !== false && (
                  <div className="flex gap-2">
                    <Button onClick={this.handleRetry} variant="default" size="sm">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Retry
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * Error boundary for ScreenRenderer
 */
export interface ScreenRendererErrorBoundaryProps {
  children: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo, context?: ErrorBoundaryState['componentContext']) => void
  patternFamily?: string
  patternVariant?: number
  className?: string
}

export const ScreenRendererErrorBoundary: React.FC<ScreenRendererErrorBoundaryProps> = ({
  children,
  onError,
  patternFamily,
  patternVariant,
  className,
}) => {
  return (
    <ErrorBoundaryBase
      onError={onError}
      componentContext={{
        patternFamily,
        patternVariant,
      }}
      className={className}
      showRetry={true}
    >
      {children}
    </ErrorBoundaryBase>
  )
}

/**
 * Error boundary for component rendering
 */
export interface ComponentRendererErrorBoundaryProps {
  children: ReactNode
  componentType?: string
  slotName?: string
  onError?: (error: Error, errorInfo: ErrorInfo, context?: ErrorBoundaryState['componentContext']) => void
  fallback?: ReactNode
  className?: string
}

export const ComponentRendererErrorBoundary: React.FC<ComponentRendererErrorBoundaryProps> = ({
  children,
  componentType,
  slotName,
  onError,
  fallback,
  className,
}) => {
  return (
    <ErrorBoundaryBase
      onError={onError}
      componentContext={{
        componentType,
        slotName,
      }}
      fallback={fallback}
      className={className}
      showRetry={false}
    >
      {children}
    </ErrorBoundaryBase>
  )
}


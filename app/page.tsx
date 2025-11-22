import Link from 'next/link'
import { AppHeader } from '@/components/navigation/AppHeader'
import { Button } from '@/components/ui/button'
import { Sparkles, LayoutGrid, Image as ImageIcon, Play } from 'lucide-react'

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-16">
          {/* Hero Section */}
          <div className="max-w-4xl mx-auto text-center space-y-8 mb-16">
            <h1 className="text-5xl font-bold tracking-tight">
              FlowRunner
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              AI–Art–Directed, Multi-Screen UI Flow Generator
            </p>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Transform natural language prompts into multi-screen, fully illustrated, themed UI flows
            </p>
            <div className="flex items-center justify-center gap-4 pt-4">
              <Link href="/flows/new">
                <Button size="lg">
                  <Sparkles className="mr-2 h-5 w-5" />
                  Create New Flow
                </Button>
              </Link>
              <Link href="/gallery">
                <Button size="lg" variant="outline">
                  Browse Gallery
                </Button>
              </Link>
            </div>
          </div>

          {/* Quick Links */}
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mt-16">
            <Link
              href="/flows/new"
              className="group rounded-lg border p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-lg font-semibold">Create Flow</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Start a new flow with AI-generated screens and layouts
              </p>
            </Link>

            <Link
              href="/gallery"
              className="group rounded-lg border p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <LayoutGrid className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-lg font-semibold">Gallery</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Explore public flows created by the community
              </p>
            </Link>

            <Link
              href="/flow-playground"
              className="group rounded-lg border p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <Play className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-lg font-semibold">Playground</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Experiment with flow generation and screen creation
              </p>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}



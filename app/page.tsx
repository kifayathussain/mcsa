import type React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { Package, ShoppingCart, BarChart3, Zap, CheckCircle2, ArrowRight } from "lucide-react"

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border/50 backdrop-blur-sm">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
              <Package className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold tracking-tight">MultiChannel</span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/auth/login">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
            <Link href="/auth/sign-up">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="container mx-auto px-4 py-24 text-center lg:py-32">
          <div className="mx-auto max-w-4xl space-y-8">
            <h1 className="text-balance text-5xl font-bold leading-tight tracking-tight lg:text-7xl">
              The complete platform to manage your <span className="text-primary">e-commerce</span>
            </h1>
            <p className="text-pretty text-lg leading-relaxed text-muted-foreground lg:text-xl">
              Streamline your multi-channel sales operations across Amazon, eBay, Etsy, and more. Securely manage
              inventory, track orders, and scale your business with powerful analytics.
            </p>
            <div className="flex items-center justify-center gap-4 pt-6">
              <Link href="/auth/sign-up">
                <Button size="lg" className="gap-2 font-medium">
                  Get Started <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/auth/login">
                <Button size="lg" variant="outline" className="font-medium bg-transparent">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="border-t border-border/50 py-24">
          <div className="container mx-auto px-4">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <FeatureCard
                icon={<ShoppingCart className="h-6 w-6 text-primary" />}
                title="Multi-Channel Orders"
                description="Manage orders from Amazon, eBay, Etsy, and more in one unified dashboard."
              />
              <FeatureCard
                icon={<Package className="h-6 w-6 text-primary" />}
                title="Inventory Sync"
                description="Real-time inventory tracking across all channels to prevent overselling."
              />
              <FeatureCard
                icon={<BarChart3 className="h-6 w-6 text-primary" />}
                title="Sales Analytics"
                description="Powerful insights and reports to understand your business performance."
              />
              <FeatureCard
                icon={<Zap className="h-6 w-6 text-primary" />}
                title="Amazon SP-API"
                description="Direct integration with Amazon Seller Partner API for seamless operations."
              />
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-24">
          <div className="mx-auto max-w-3xl space-y-12">
            <h2 className="text-center text-3xl font-bold tracking-tight lg:text-4xl">Everything you need to scale</h2>
            <div className="space-y-4">
              <BenefitItem text="Centralized dashboard for all your e-commerce channels" />
              <BenefitItem text="Automated inventory synchronization to prevent stockouts" />
              <BenefitItem text="Real-time order tracking and fulfillment management" />
              <BenefitItem text="Comprehensive analytics and reporting tools" />
              <BenefitItem text="Direct API integrations with major marketplaces" />
              <BenefitItem text="Secure and scalable infrastructure" />
            </div>
          </div>
        </section>

        <section className="border-t border-border/50 py-24">
          <div className="container mx-auto px-4 text-center">
            <div className="mx-auto max-w-2xl space-y-6">
              <h2 className="text-3xl font-bold tracking-tight lg:text-4xl">Ready to streamline your operations?</h2>
              <p className="text-lg leading-relaxed text-muted-foreground">
                Join thousands of sellers who trust MultiChannel to manage their e-commerce business.
              </p>
              <Link href="/auth/sign-up">
                <Button size="lg" className="gap-2 font-medium">
                  Get Started Now <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/50 py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; 2025 MultiChannel. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="group space-y-3 rounded-lg border border-border bg-card p-6 transition-colors hover:border-border/80">
      <div className="transition-transform group-hover:scale-110">{icon}</div>
      <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
      <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
    </div>
  )
}

function BenefitItem({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3">
      <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
      <p className="leading-relaxed text-foreground">{text}</p>
    </div>
  )
}

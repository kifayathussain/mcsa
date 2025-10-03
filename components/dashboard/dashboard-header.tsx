import { ThemeToggle } from "@/components/theme-toggle"

interface DashboardHeaderProps {
  userName: string
}

export function DashboardHeader({ userName }: DashboardHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1.5 text-sm">Welcome back, {userName}</p>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-sm text-muted-foreground">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </div>
        <ThemeToggle />
      </div>
    </div>
  )
}

import { Moon, Sun, Monitor } from "lucide-react"
import { useTheme } from "@/components/theme-provider"
import { motion } from "motion/react"
import { cn } from "@/lib/utils"

const themes = ["light", "system", "dark"] as const

interface ThemeSwitchProps {
  className?: string
}

export function ThemeSwitch({ className }: ThemeSwitchProps) {
  const { theme, setTheme } = useTheme()

  const currentIndex = themes.indexOf(theme)

  const toggleTheme = () => {
    const nextIndex = (currentIndex + 1) % themes.length
    setTheme(themes[nextIndex])
  }

  return (
    <button
      onClick={toggleTheme}
      aria-label={`当前主题: ${theme === "light" ? "浅色" : theme === "dark" ? "深色" : "跟随系统"}`}
      className={cn(
        "relative inline-flex items-center gap-0.5 rounded-full bg-muted p-0.5 transition-colors hover:bg-muted/80",
        className
      )}
    >
      {/* 滑动背景指示器 */}
      <motion.div
        className="absolute h-6 w-6 rounded-full bg-primary"
        initial={false}
        animate={{
          x: currentIndex * 26, // 24px (icon) + 2px (gap)
        }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30,
        }}
      />

      {/* 图标 */}
      <div className="relative z-10 flex h-6 w-6 items-center justify-center">
        <Sun
          className={`h-3.5 w-3.5 transition-colors ${
            theme === "light" ? "text-primary-foreground" : "text-muted-foreground"
          }`}
        />
      </div>
      <div className="relative z-10 flex h-6 w-6 items-center justify-center">
        <Monitor
          className={`h-3.5 w-3.5 transition-colors ${
            theme === "system" ? "text-primary-foreground" : "text-muted-foreground"
          }`}
        />
      </div>
      <div className="relative z-10 flex h-6 w-6 items-center justify-center">
        <Moon
          className={`h-3.5 w-3.5 transition-colors ${
            theme === "dark" ? "text-primary-foreground" : "text-muted-foreground"
          }`}
        />
      </div>
    </button>
  )
}

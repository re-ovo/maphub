import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme, type Theme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ThemeSwitchProps {
  className?: string;
}

const themeConfig = {
  light: { icon: Sun, label: "浅色" },
  system: { icon: Monitor, label: "跟随系统" },
  dark: { icon: Moon, label: "深色" },
} as const;

export function ThemeSwitch({ className }: ThemeSwitchProps) {
  const { theme, setTheme } = useTheme();

  const CurrentIcon = themeConfig[theme].icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-muted/80",
          className,
        )}
        aria-label={`当前主题: ${themeConfig[theme].label}`}
      >
        <CurrentIcon className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup value={theme} onValueChange={(value) => setTheme(value as Theme)}>
          <DropdownMenuRadioItem value="light">
            <Sun className="mr-2 h-4 w-4" />
            浅色
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="system">
            <Monitor className="mr-2 h-4 w-4" />
            跟随系统
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark">
            <Moon className="mr-2 h-4 w-4" />
            深色
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

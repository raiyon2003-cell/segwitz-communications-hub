import { Mail } from "lucide-react";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  variant?: "light" | "dark";
  size?: "sm" | "md" | "lg";
  showSubtitle?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: { icon: "h-5 w-5", title: "text-base", subtitle: "text-[10px]" },
  md: { icon: "h-6 w-6", title: "text-lg", subtitle: "text-xs" },
  lg: { icon: "h-8 w-8", title: "text-2xl", subtitle: "text-sm" },
};

export function BrandLogo({
  variant = "dark",
  size = "md",
  showSubtitle = true,
  className,
}: BrandLogoProps) {
  const s = sizeClasses[size];
  const isLight = variant === "light";

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div
        className={cn(
          "flex items-center justify-center rounded-lg",
          isLight ? "bg-white/15" : "bg-primary/10",
          size === "sm" ? "h-9 w-9" : size === "md" ? "h-10 w-10" : "h-12 w-12"
        )}
      >
        <Mail
          className={cn(s.icon, isLight ? "text-white" : "text-primary")}
        />
      </div>
      <div>
        <p
          className={cn(
            s.title,
            "font-semibold leading-tight tracking-tight",
            isLight ? "text-white" : "text-foreground"
          )}
        >
          SegWitz
        </p>
        {showSubtitle && (
          <p
            className={cn(
              s.subtitle,
              isLight ? "text-white/70" : "text-muted-foreground"
            )}
          >
            Communications Hub
          </p>
        )}
      </div>
    </div>
  );
}

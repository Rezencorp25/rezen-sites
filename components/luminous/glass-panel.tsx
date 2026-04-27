import { cn } from "@/lib/utils";

export function GlassPanel({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("glass rounded-xl", className)}>{children}</div>
  );
}

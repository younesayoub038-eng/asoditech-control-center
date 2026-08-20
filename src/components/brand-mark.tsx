import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * ASODITECH's mark, in the two forms used across the app: a compact
 * icon + wordmark for chrome (sidebar, mobile header), and the full
 * lockup with tagline for the login page. Source files: /public/icon-a.png
 * and /public/logo.png. `unoptimized`: Next 16's built-in optimizer hard-
 * requires `sharp` with no fallback, and 500s here even with it installed —
 * skip it for these small, fixed-size, already-appropriately-sized assets
 * rather than chase the optimizer bug.
 */
export function BrandMark({
  variant = "compact",
  className,
}: {
  variant?: "compact" | "full";
  className?: string;
}) {
  if (variant === "full") {
    return (
      <Image
        src="/logo.png"
        alt="ASODITECH"
        width={1418}
        height={280}
        priority
        unoptimized
        className={cn("h-14 w-auto dark:invert", className)}
      />
    );
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Image
        src="/icon-a.png"
        alt=""
        width={740}
        height={740}
        priority
        unoptimized
        className="size-6 shrink-0 dark:invert"
      />
      <span className="text-sm font-semibold tracking-tight">ASODITECH Control Center</span>
    </div>
  );
}

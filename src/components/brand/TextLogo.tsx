import { cn } from "@/lib/cn";

export function TextLogo({ className }: { className?: string }) {
  return (
    <span className={cn("iyane-wordmark inline-flex items-center align-middle", className)}>
      <span className="sr-only">Iyane</span>
      <span aria-hidden="true" className="iyane-wordmark__initial">
        I
      </span>
      <span aria-hidden="true" className="iyane-wordmark__name">
        YANE
      </span>
    </span>
  );
}

"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

type LoadRippleProps = {
  className?: string;
  compact?: boolean;
};

export function LoadRipple({ className, compact = false }: LoadRippleProps) {
  const sizeClass = compact ? "h-[150px]" : "h-[220px]";

  return (
    <div className={cn("relative aspect-square", sizeClass, className)}>
      <span className="absolute inset-[40%] rounded-full border border-[rgba(0,102,255,0.75)] animate-[ripple_2s_infinite_ease-in-out] bg-gradient-to-tr from-[rgba(0,102,255,0.14)] to-[rgba(20,184,166,0.10)] backdrop-blur-sm z-[98]" />
      <span className="absolute inset-[30%] rounded-full border border-[rgba(0,102,255,0.6)] animate-[ripple_2s_infinite_ease-in-out_0.2s] bg-gradient-to-tr from-[rgba(0,102,255,0.12)] to-[rgba(20,184,166,0.09)] backdrop-blur-sm z-[97]" />
      <span className="absolute inset-[20%] rounded-full border border-[rgba(20,184,166,0.5)] animate-[ripple_2s_infinite_ease-in-out_0.4s] bg-gradient-to-tr from-[rgba(20,184,166,0.12)] to-[rgba(255,82,28,0.08)] backdrop-blur-sm z-[96]" />
      <span className="absolute inset-[10%] rounded-full border border-[rgba(20,184,166,0.36)] animate-[ripple_2s_infinite_ease-in-out_0.6s] bg-gradient-to-tr from-[rgba(20,184,166,0.12)] to-[rgba(255,82,28,0.06)] backdrop-blur-sm z-[95]" />
      <span className="absolute inset-0 rounded-full border border-[rgba(255,82,28,0.25)] animate-[ripple_2s_infinite_ease-in-out_0.8s] bg-gradient-to-tr from-[rgba(255,82,28,0.08)] to-[rgba(0,102,255,0.06)] backdrop-blur-sm z-[94]" />
    </div>
  );
}


"use client";

import { useEffect } from "react";
import { useHaptics } from "@/hooks/use-haptics";

export function SummaryHaptics({ weekComplete }: { weekComplete: boolean }) {
  const haptics = useHaptics();

  useEffect(() => {
    if (weekComplete) {
      const id = setTimeout(() => haptics.heavy(), 300);
      return () => clearTimeout(id);
    }
  }, [weekComplete, haptics]);

  return null;
}

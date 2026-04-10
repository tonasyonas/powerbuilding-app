"use client";

import { useEffect } from "react";

export function NotificationPrompt() {
  useEffect(() => {
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  return null;
}

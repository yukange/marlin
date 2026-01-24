"use client";

import { useEffect } from "react";

import { useStore } from "@/lib/store";

export function useNetworkStatus() {
  const { setNetworkStatus } = useStore();

  useEffect(() => {
    const handleOnline = () => setNetworkStatus("online");
    const handleOffline = () => setNetworkStatus("offline");

    setNetworkStatus(navigator.onLine ? "online" : "offline");

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [setNetworkStatus]);

  return null;
}

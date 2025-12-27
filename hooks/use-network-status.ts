"use client";

import { useEffect, useRef } from "react";

import { useStore } from "@/lib/store";

import type { NetworkStatus } from "@/lib/store";

const HEARTBEAT_INTERVAL = 60 * 1000; // 1 minute
const API_RATE_LIMIT_THRESHOLD = 100;

interface RateLimitResponse {
  limit: number;
  remaining: number;
  reset: number;
}

export function useNetworkStatus() {
  const { setNetworkStatus, setRateLimitInfo } = useStore();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const checkNetworkStatus = async () => {
    try {
      const response = await fetch("/api/proxy/rate_limit", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        // If API request fails, mark as offline
        setNetworkStatus("offline");
        setRateLimitInfo(null);
        return;
      }

      const data: RateLimitResponse = await response.json();
      setRateLimitInfo(data);

      // Determine status based on rate limit
      let status: NetworkStatus = "online";
      if (data.remaining < API_RATE_LIMIT_THRESHOLD) {
        status = "limited";
      }

      setNetworkStatus(status);
    } catch (error) {
      // Network error or timeout - mark as offline
      console.error("Network status check failed:", error);
      setNetworkStatus("offline");
      setRateLimitInfo(null);
    }
  };

  useEffect(() => {
    // Run check immediately on mount
    checkNetworkStatus();

    // Set up interval for periodic checks
    intervalRef.current = setInterval(checkNetworkStatus, HEARTBEAT_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}

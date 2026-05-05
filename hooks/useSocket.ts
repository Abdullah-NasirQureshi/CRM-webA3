"use client";

import { useEffect, useRef } from "react";

interface UseSocketOptions {
  userId: string;
  role: "admin" | "agent";
  onLeadCreated?: (data: unknown) => void;
  onLeadAssigned?: (data: unknown) => void;
  onScoreChanged?: (data: unknown) => void;
  onPollTick?: () => void;
}

// Poll every 3 seconds — fast enough to feel real-time
const POLL_INTERVAL_MS = 3_000;

export function useSocket({
  userId,
  onPollTick,
}: UseSocketOptions) {
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!userId || !onPollTick) return;

    // Start polling immediately on mount
    onPollTick();
    pollRef.current = setInterval(() => {
      onPollTick();
    }, POLL_INTERVAL_MS);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [userId]);

  return {};
}

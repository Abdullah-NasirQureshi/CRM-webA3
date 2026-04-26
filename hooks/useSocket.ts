"use client";

import { useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";

export type SocketEvent = "lead:created" | "lead:assigned" | "lead:scoreChanged";

interface UseSocketOptions {
  userId: string;
  role: "admin" | "agent";
  onLeadCreated?: (data: unknown) => void;
  onLeadAssigned?: (data: unknown) => void;
  onScoreChanged?: (data: unknown) => void;
  /** Called on each poll tick when Socket.io is unavailable */
  onPollTick?: () => void;
}

const POLL_INTERVAL_MS = 10_000;
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL ?? "";

export function useSocket({
  userId,
  role,
  onLeadCreated,
  onLeadAssigned,
  onScoreChanged,
  onPollTick,
}: UseSocketOptions) {
  const socketRef = useRef<Socket | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const connectedRef = useRef(false);

  const startPolling = useCallback(() => {
    if (pollRef.current) return;
    pollRef.current = setInterval(() => {
      onPollTick?.();
    }, POLL_INTERVAL_MS);
  }, [onPollTick]);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!SOCKET_URL || !userId) return;

    const socket = io(SOCKET_URL, {
      path: "/api/socket",
      transports: ["websocket", "polling"],
      reconnectionAttempts: 3,
      timeout: 5000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      connectedRef.current = true;
      stopPolling();
      socket.emit("join", { userId, role });
    });

    socket.on("connect_error", () => {
      if (!connectedRef.current) {
        // Socket.io unavailable — fall back to polling (Req 9.4)
        startPolling();
      }
    });

    socket.on("disconnect", () => {
      connectedRef.current = false;
      startPolling();
    });

    if (onLeadCreated) socket.on("lead:created", onLeadCreated);
    if (onLeadAssigned) socket.on("lead:assigned", onLeadAssigned);
    if (onScoreChanged) socket.on("lead:scoreChanged", onScoreChanged);

    return () => {
      socket.disconnect();
      stopPolling();
    };
  }, [userId, role]);

  return { socket: socketRef.current };
}

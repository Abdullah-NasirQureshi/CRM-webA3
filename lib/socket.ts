import { Server as SocketIOServer } from "socket.io";
import type { Server as HTTPServer } from "http";

let io: SocketIOServer | null = null;

export function initSocketIO(httpServer: HTTPServer): SocketIOServer {
  if (io) return io;

  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:3000",
      methods: ["GET", "POST"],
    },
    path: "/api/socket",
  });

  io.on("connection", (socket) => {
    // Client sends their userId and role to join the right rooms
    socket.on("join", ({ userId, role }: { userId: string; role: string }) => {
      if (role === "admin") {
        socket.join("admins");
      }
      // Every user joins their personal room
      socket.join(`agent:${userId}`);
    });

    socket.on("disconnect", () => {});
  });

  return io;
}

export function getIO(): SocketIOServer {
  if (!io) throw new Error("Socket.io not initialized. Call initSocketIO first.");
  return io;
}

/** Safe getter — returns null if not initialized (e.g. during tests) */
export function getIOSafe(): SocketIOServer | null {
  return io;
}

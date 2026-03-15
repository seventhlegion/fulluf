"use client";

import { useEffect, useState } from "react";
import { io, type Socket } from "socket.io-client";
import type { ConnectionStatus } from "./connection-status";

const API_URL =
  typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001")
    : "http://localhost:3001";

function deriveStatus(socket: Socket | null): ConnectionStatus {
  if (!socket) return "disconnected";
  return socket.connected ? "connected" : "connecting";
}

export function useChatSocket(
  getToken: () => string | null | Promise<string | null>
): { socket: Socket | null; isConnected: boolean; connectionStatus: ConnectionStatus } {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("disconnected");

  useEffect(() => {
    let s: Socket | null = null;

    const connect = async () => {
      const token = await Promise.resolve(getToken());
      if (!token) return;

      s = io(`${API_URL}/chat`, { auth: { token } });
      const updateStatus = () => setConnectionStatus(deriveStatus(s));
      s.on("connect", updateStatus);
      s.on("disconnect", updateStatus);
      s.on("connect_error", updateStatus);
      setSocket(s);
      setConnectionStatus(deriveStatus(s));
    };

    void connect();
    return () => {
      s?.removeAllListeners();
      s?.close();
      setSocket(null);
      setConnectionStatus("disconnected");
    };
  }, [getToken]);

  const isConnected = connectionStatus === "connected";
  return { socket, isConnected, connectionStatus };
}

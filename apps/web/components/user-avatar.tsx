"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar";
import { useMemo } from "react";

const AVATAR_API_URL =
  process.env.NEXT_PUBLIC_AVATAR_API_URL || "https://api.dicebear.com";
const AVATAR_STYLE = "dylan";

interface UserAvatarProps {
  /** Hash/seed for deterministic avatar (e.g. senderHash) */
  seed: string;
  size?: "default" | "sm" | "lg";
  className?: string;
}

export function UserAvatar({ seed, size = "lg", className }: UserAvatarProps) {
  const avatarSrc = useMemo(() => {
    const params = new URLSearchParams({ seed });
    return `${AVATAR_API_URL}/9.x/${AVATAR_STYLE}/svg?${params.toString()}`;
  }, [seed]);

  const fallback = useMemo(() => {
    return (seed.slice(1, 3) || "??").toUpperCase();
  }, [seed]);

  return (
    <Avatar size={size} className={className}>
      <AvatarImage src={avatarSrc} alt="User avatar" />
      <AvatarFallback className="text-xs">{fallback}</AvatarFallback>
    </Avatar>
  );
}

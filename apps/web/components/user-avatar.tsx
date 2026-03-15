"use client";

import { dylan } from "@dicebear/collection";
import { createAvatar } from "@dicebear/core";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar";
import { useMemo } from "react";

interface UserAvatarProps {
  /** Hash/seed for deterministic avatar (e.g. senderHash) */
  seed: string;
  size?: "default" | "sm" | "lg";
  className?: string;
}

export function UserAvatar({ seed, size = "lg", className }: UserAvatarProps) {
  const avatarSrc = useMemo(() => {
    return createAvatar(dylan, {
      seed,
      size: 96,
    }).toDataUri();
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

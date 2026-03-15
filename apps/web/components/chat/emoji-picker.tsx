"use client";

import { useEffect } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover";

const QUICK_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "😡"];

interface EmojiPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (emoji: string) => void;
  trigger: React.ReactNode;
}

export function EmojiPicker({
  open,
  onOpenChange,
  onSelect,
  trigger,
}: EmojiPickerProps) {
  useEffect(() => {
    if (!open) return;
    const handleScroll = () => onOpenChange(false);
    const scrollParent = document.querySelector("[data-chat-scroll]");
    scrollParent?.addEventListener("scroll", handleScroll);
    window.addEventListener("scroll", handleScroll, true);
    return () => {
      scrollParent?.removeEventListener("scroll", handleScroll);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [open, onOpenChange]);

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        align="start"
        side="bottom"
        sideOffset={4}
        className="w-auto p-1"
      >
        <div className="flex gap-1">
          {QUICK_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              className="rounded p-1 text-lg hover:bg-muted transition-colors"
              onClick={() => {
                onSelect(emoji);
                onOpenChange(false);
              }}
            >
              {emoji}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

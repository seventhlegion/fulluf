"use client";

import { useRef, useEffect } from "react";

const QUICK_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "😡"];

interface EmojiPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (emoji: string) => void;
  /** Ref to the container that wraps both trigger and picker - used for click-outside detection */
  triggerRef?: React.RefObject<HTMLDivElement | null>;
}

export function EmojiPicker({
  isOpen,
  onClose,
  onSelect,
  triggerRef,
}: EmojiPickerProps) {
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const isInsidePicker = pickerRef.current?.contains(target);
      const isInsideTrigger = triggerRef?.current?.contains(target);
      if (!isInsidePicker && !isInsideTrigger) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose, triggerRef]);

  if (!isOpen) return null;

  return (
    <div
      ref={pickerRef}
      className="absolute left-0 top-full z-20 mt-1 flex gap-1 rounded-lg border border-border bg-popover p-1 shadow-lg"
    >
      {QUICK_EMOJIS.map((emoji) => (
        <button
          key={emoji}
          type="button"
          className="rounded p-1 text-lg hover:bg-muted transition-colors"
          onClick={() => onSelect(emoji)}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}

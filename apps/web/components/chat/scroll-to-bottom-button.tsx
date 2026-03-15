"use client";

import { Button } from "@workspace/ui/components/button";
import { ChevronDown } from "lucide-react";

interface ScrollToBottomButtonProps {
  onClick: () => void;
}

export function ScrollToBottomButton({ onClick }: ScrollToBottomButtonProps) {
  return (
    <Button
      size="icon"
      className="absolute bottom-24 right-6 z-10 size-10 rounded-full shadow-lg animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-2 duration-200"
      onClick={onClick}
      aria-label="Scroll to bottom"
    >
      <ChevronDown className="size-5" />
    </Button>
  );
}

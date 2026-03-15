"use client";

import { Spinner } from "@workspace/ui/components/spinner";
import { FileDown, MicIcon } from "lucide-react";
import type { MessageType } from "@/lib/api/types";

interface MessageContentProps {
  type: MessageType;
  content: string;
  blobUrl: string | null;
  isLoading: boolean;
}

export function MessageContent({
  type,
  content,
  blobUrl,
  isLoading,
}: MessageContentProps) {
  if (type === "text") {
    return <p className="mt-0.5 break-words text-sm">{content}</p>;
  }

  return (
    <div className="mt-1">
      {isLoading ? (
        <div className="flex h-24 items-center justify-center rounded-lg bg-muted">
          <Spinner className="size-6" />
        </div>
      ) : blobUrl ? (
        <MediaContent type={type} blobUrl={blobUrl} />
      ) : null}
    </div>
  );
}

function MediaContent({ type, blobUrl }: { type: MessageType; blobUrl: string }) {
  switch (type) {
    case "image":
      return (
        <img
          src={blobUrl}
          alt=""
          className="max-h-48 max-w-full rounded-lg object-contain"
        />
      );
    case "video":
      return (
        <video src={blobUrl} controls className="max-h-48 max-w-full rounded-lg" />
      );
    case "audio":
      return (
        <div className="flex w-full max-w-sm items-center gap-3 rounded-xl border border-border bg-muted/50 px-4 py-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <MicIcon className="size-5 text-primary" />
          </div>
          <audio
            src={blobUrl}
            controls
            className="h-10 flex-1 min-w-0 [&::-webkit-media-controls-panel]:bg-transparent"
          />
        </div>
      );
    case "file":
      return (
        <a
          href={blobUrl}
          download
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-muted px-3 py-2 text-sm hover:bg-muted/80"
        >
          <FileDown className="size-4 shrink-0" />
          Download file
        </a>
      );
    default:
      return null;
  }
}

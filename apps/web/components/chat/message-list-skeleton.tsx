"use client";

import { Skeleton } from "@workspace/ui/components/skeleton";

export function MessageListSkeleton() {
  return (
    <>
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
        <div key={i} className="flex gap-3">
          <Skeleton className="size-10 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex items-baseline gap-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-12" />
            </div>
            <Skeleton className="h-4 w-full max-w-[280px]" />
            {i % 2 === 0 && <Skeleton className="h-4 max-w-[200px] w-2/3" />}
          </div>
        </div>
      ))}
    </>
  );
}

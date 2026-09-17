"use client";

import { useTransition } from "react";
import { markDelivered } from "./actions";

export function MarkDeliveredButton({ deliveryId }: { deliveryId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      disabled={isPending}
      onClick={() => startTransition(() => markDelivered(deliveryId))}
      className="rounded bg-gray-900 px-2 py-1 text-xs font-medium text-white hover:bg-gray-800 disabled:opacity-50"
    >
      {isPending ? "Marking…" : "Mark delivered"}
    </button>
  );
}

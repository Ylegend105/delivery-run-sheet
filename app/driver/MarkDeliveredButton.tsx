"use client";

import { useTransition } from "react";
import { markDelivered } from "./actions";

export function MarkDeliveredButton({ deliveryId }: { deliveryId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      disabled={isPending}
      onClick={() => startTransition(() => markDelivered(deliveryId))}
      className="rounded-md bg-blue-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
    >
      {isPending ? "Marking…" : "Mark delivered"}
    </button>
  );
}

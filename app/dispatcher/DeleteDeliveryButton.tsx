"use client";

import { useTransition } from "react";
import { deleteDelivery } from "./actions";

export function DeleteDeliveryButton({
  deliveryId,
  customerName,
}: {
  deliveryId: string;
  customerName: string;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => {
        if (
          !window.confirm(
            `Delete this delivery for ${customerName}? This cannot be undone.`,
          )
        ) {
          return;
        }
        startTransition(() => deleteDelivery(deliveryId));
      }}
      className="rounded-md border border-red-200 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
    >
      {isPending ? "Deleting…" : "Delete"}
    </button>
  );
}

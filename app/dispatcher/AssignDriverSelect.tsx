"use client";

import { useTransition } from "react";
import { assignDelivery } from "./actions";
import type { UserRow } from "@/lib/types";

export function AssignDriverSelect({
  deliveryId,
  currentDriverId,
  drivers,
}: {
  deliveryId: string;
  currentDriverId: string | null;
  drivers: UserRow[];
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <select
      defaultValue={currentDriverId ?? ""}
      disabled={isPending}
      onChange={(e) => {
        const driverId = e.target.value;
        startTransition(() => {
          assignDelivery(deliveryId, driverId);
        });
      }}
      className="rounded border border-gray-300 px-2 py-1 text-xs disabled:opacity-50"
    >
      <option value="">Unassigned</option>
      {drivers.map((driver) => (
        <option key={driver.id} value={driver.id}>
          {driver.name ?? driver.email}
        </option>
      ))}
    </select>
  );
}

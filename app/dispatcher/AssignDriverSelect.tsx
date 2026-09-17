"use client";

import { useTransition } from "react";
import { assignDelivery } from "./actions";
import type { UserRow } from "@/lib/types";
import { inputClass } from "@/lib/ui";

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
      className={`text-xs ${inputClass}`}
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

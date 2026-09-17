"use client";

import { useRef } from "react";
import { createDelivery } from "./actions";
import type { UserRow } from "@/lib/types";

export function CreateDeliveryForm({ drivers }: { drivers: UserRow[] }) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await createDelivery(formData);
        formRef.current?.reset();
      }}
      className="mb-6 grid grid-cols-1 gap-2 rounded border border-gray-200 p-4 sm:grid-cols-2 lg:grid-cols-5"
    >
      <input
        name="customer_name"
        required
        placeholder="Customer name"
        className="rounded border border-gray-300 px-2 py-1.5 text-sm"
      />
      <input
        name="address"
        required
        placeholder="Address (e.g. 12 Main St, Austin)"
        className="rounded border border-gray-300 px-2 py-1.5 text-sm lg:col-span-2"
      />
      <input
        name="notes"
        placeholder="Notes (optional)"
        className="rounded border border-gray-300 px-2 py-1.5 text-sm"
      />
      <select
        name="assigned_driver_id"
        className="rounded border border-gray-300 px-2 py-1.5 text-sm"
      >
        <option value="">Unassigned</option>
        {drivers.map((driver) => (
          <option key={driver.id} value={driver.id}>
            {driver.name ?? driver.email}
          </option>
        ))}
      </select>
      <button
        type="submit"
        className="rounded bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800 sm:col-span-2 lg:col-span-5"
      >
        Add delivery
      </button>
    </form>
  );
}

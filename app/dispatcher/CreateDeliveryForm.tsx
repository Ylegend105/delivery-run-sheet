"use client";

import { useRef } from "react";
import { createDelivery } from "./actions";
import type { UserRow } from "@/lib/types";
import { inputClass, primaryButtonClass, cardClass } from "@/lib/ui";

export function CreateDeliveryForm({ drivers }: { drivers: UserRow[] }) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await createDelivery(formData);
        formRef.current?.reset();
      }}
      className={`mb-6 grid grid-cols-1 gap-2 p-4 sm:grid-cols-2 lg:grid-cols-5 ${cardClass}`}
    >
      <input
        name="customer_name"
        required
        placeholder="Customer name"
        className={inputClass}
      />
      <input
        name="address"
        required
        placeholder="Address (e.g. 12 Main St, Austin)"
        className={`${inputClass} lg:col-span-2`}
      />
      <input
        name="notes"
        placeholder="Notes (optional)"
        className={inputClass}
      />
      <select name="assigned_driver_id" className={inputClass}>
        <option value="">Unassigned</option>
        {drivers.map((driver) => (
          <option key={driver.id} value={driver.id}>
            {driver.name ?? driver.email}
          </option>
        ))}
      </select>
      <button
        type="submit"
        className={`sm:col-span-2 lg:col-span-5 ${primaryButtonClass}`}
      >
        Add delivery
      </button>
    </form>
  );
}

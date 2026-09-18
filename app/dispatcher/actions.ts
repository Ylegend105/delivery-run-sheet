"use server";

import { revalidatePath } from "next/cache";
import { getSessionAndSupabase } from "@/lib/auth/session";

export async function createDelivery(formData: FormData) {
  const { session, supabase } = await getSessionAndSupabase();
  if (!session || session.role !== "dispatcher" || !supabase) {
    throw new Error("Not authorized.");
  }

  const customerName = String(formData.get("customer_name") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  const assignedDriverId = String(formData.get("assigned_driver_id") ?? "").trim();

  if (!customerName || !address) {
    throw new Error("Customer name and address are required.");
  }

  const { error } = await supabase.from("deliveries").insert({
    customer_name: customerName,
    address,
    notes: notes || null,
    assigned_driver_id: assignedDriverId || null,
    created_by: session.sub,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/dispatcher");
}

export async function assignDelivery(deliveryId: string, driverId: string) {
  const { session, supabase } = await getSessionAndSupabase();
  if (!session || session.role !== "dispatcher" || !supabase) {
    throw new Error("Not authorized.");
  }

  const { error } = await supabase
    .from("deliveries")
    .update({ assigned_driver_id: driverId || null })
    .eq("id", deliveryId);

  if (error) throw new Error(error.message);

  revalidatePath("/dispatcher");
}

export async function deleteDelivery(deliveryId: string) {
  const { session, supabase } = await getSessionAndSupabase();
  if (!session || session.role !== "dispatcher" || !supabase) {
    throw new Error("Not authorized.");
  }

  const { error } = await supabase
    .from("deliveries")
    .delete()
    .eq("id", deliveryId);

  if (error) throw new Error(error.message);

  revalidatePath("/dispatcher");
}

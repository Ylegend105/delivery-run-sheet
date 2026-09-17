"use server";

import { revalidatePath } from "next/cache";
import { getSessionAndSupabase } from "@/lib/auth/session";

export async function markDelivered(deliveryId: string) {
  const { session, supabase } = await getSessionAndSupabase();
  if (!session || session.role !== "driver" || !supabase) {
    throw new Error("Not authorized.");
  }

  const { error } = await supabase
    .from("deliveries")
    .update({ status: "delivered", delivered_at: new Date().toISOString() })
    .eq("id", deliveryId);

  if (error) throw new Error(error.message);

  revalidatePath("/driver");
}

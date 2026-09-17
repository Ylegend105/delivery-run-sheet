"use server";

import { revalidatePath } from "next/cache";
import { getSessionAndSupabase } from "@/lib/auth/session";

export async function updateProfile(formData: FormData) {
  const { session, supabase } = await getSessionAndSupabase();
  if (!session || !supabase) {
    throw new Error("Not authorized.");
  }

  const name = String(formData.get("name") ?? "").trim();
  const whatsappNumber = String(formData.get("whatsapp_number") ?? "").trim();

  const { error } = await supabase
    .from("users")
    .update({ name: name || null, whatsapp_number: whatsappNumber || null })
    .eq("id", session.sub);

  if (error) throw new Error(error.message);

  revalidatePath("/settings");
  revalidatePath("/dispatcher");
  revalidatePath("/driver");
}

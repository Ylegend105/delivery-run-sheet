import { redirect } from "next/navigation";
import { getSessionAndSupabase } from "@/lib/auth/session";
import { updateProfile } from "./actions";
import type { UserRow } from "@/lib/types";

export default async function SettingsPage() {
  const { session, supabase } = await getSessionAndSupabase();
  if (!session || !supabase) {
    redirect("/login");
  }

  const { data: user, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", session.sub)
    .single();

  if (error) throw new Error(error.message);

  const profile = user as UserRow;

  return (
    <main className="mx-auto max-w-md px-4 py-8">
      <h1 className="mb-1 text-lg font-semibold text-gray-900">Settings</h1>
      <p className="mb-6 text-sm text-gray-500">
        Signed in as {profile.email} ({profile.role})
      </p>

      <form action={updateProfile} className="space-y-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">
            Name
          </label>
          <input
            name="name"
            defaultValue={profile.name ?? ""}
            placeholder="Your name"
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">
            WhatsApp number
          </label>
          <input
            name="whatsapp_number"
            defaultValue={profile.whatsapp_number ?? ""}
            placeholder="+1 555 123 4567"
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
          />
          <p className="mt-1 text-xs text-gray-400">
            Include country code. This is the number others&rsquo; WhatsApp
            buttons will message you on, and takes effect as soon as you save.
          </p>
        </div>
        <button
          type="submit"
          className="rounded bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          Save
        </button>
      </form>
    </main>
  );
}

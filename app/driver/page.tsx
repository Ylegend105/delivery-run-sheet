import { redirect } from "next/navigation";
import { getSessionAndSupabase } from "@/lib/auth/session";
import { getWeatherForAddress } from "@/lib/weather";
import { WeatherTag } from "@/components/WeatherTag";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { MarkDeliveredButton } from "./MarkDeliveredButton";
import type { DeliveryRow, UserRow } from "@/lib/types";

export default async function DriverPage() {
  const { session, supabase } = await getSessionAndSupabase();
  if (!session || session.role !== "driver" || !supabase) {
    redirect("/login");
  }

  const { data: deliveries, error } = await supabase
    .from("deliveries")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  const rows = (deliveries ?? []) as DeliveryRow[];

  const dispatcherIds = [
    ...new Set(rows.map((d) => d.created_by).filter((v): v is string => !!v)),
  ];
  const { data: dispatchers } = dispatcherIds.length
    ? await supabase.from("users").select("*").in("id", dispatcherIds)
    : { data: [] as UserRow[] };
  const dispatchersById = new Map((dispatchers ?? []).map((d) => [d.id, d as UserRow]));

  const weatherByDelivery = new Map(
    await Promise.all(
      rows.map(
        async (d) => [d.id, await getWeatherForAddress(d.address)] as const,
      ),
    ),
  );

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-4 text-lg font-semibold text-gray-900">
        Your deliveries
      </h1>

      <div className="space-y-3">
        {rows.map((delivery) => {
          const dispatcher = delivery.created_by
            ? dispatchersById.get(delivery.created_by)
            : undefined;
          return (
            <div
              key={delivery.id}
              className="rounded border border-gray-200 p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-gray-900">
                    {delivery.customer_name}
                  </p>
                  <p className="text-sm text-gray-600">{delivery.address}</p>
                  {delivery.notes && (
                    <p className="mt-1 text-sm text-gray-500">
                      {delivery.notes}
                    </p>
                  )}
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${
                    delivery.status === "delivered"
                      ? "bg-green-100 text-green-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {delivery.status}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <WeatherTag weather={weatherByDelivery.get(delivery.id) ?? null} />
                <WhatsAppButton
                  phoneNumber={dispatcher?.whatsapp_number}
                  label="Message dispatcher"
                  message={`Hi, about the delivery for ${delivery.customer_name} at ${delivery.address}`}
                />
                {delivery.status !== "delivered" && (
                  <MarkDeliveredButton deliveryId={delivery.id} />
                )}
              </div>
            </div>
          );
        })}
        {rows.length === 0 && (
          <p className="text-sm text-gray-400">
            No deliveries assigned to you yet.
          </p>
        )}
      </div>
    </main>
  );
}

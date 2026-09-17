import { redirect } from "next/navigation";
import { getSessionAndSupabase } from "@/lib/auth/session";
import { getWeatherForAddress } from "@/lib/weather";
import { WeatherTag } from "@/components/WeatherTag";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { CreateDeliveryForm } from "./CreateDeliveryForm";
import { AssignDriverSelect } from "./AssignDriverSelect";
import type { DeliveryRow, UserRow } from "@/lib/types";

export default async function DispatcherPage() {
  const { session, supabase } = await getSessionAndSupabase();
  if (!session || session.role !== "dispatcher" || !supabase) {
    redirect("/login");
  }

  const [{ data: deliveries, error: deliveriesError }, { data: drivers }] =
    await Promise.all([
      supabase
        .from("deliveries")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase.from("users").select("*").eq("role", "driver"),
    ]);

  if (deliveriesError) {
    throw new Error(deliveriesError.message);
  }

  const driverList = (drivers ?? []) as UserRow[];
  const driversById = new Map(driverList.map((d) => [d.id, d]));

  const rows = (deliveries ?? []) as DeliveryRow[];
  const weatherByDelivery = new Map(
    await Promise.all(
      rows.map(
        async (d) => [d.id, await getWeatherForAddress(d.address)] as const,
      ),
    ),
  );

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-4 text-lg font-semibold text-gray-900">
        Dispatcher board
      </h1>

      <CreateDeliveryForm drivers={driverList} />

      <div className="overflow-x-auto rounded border border-gray-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-3 py-2">Customer</th>
              <th className="px-3 py-2">Address</th>
              <th className="px-3 py-2">Notes</th>
              <th className="px-3 py-2">Weather</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Driver</th>
              <th className="px-3 py-2">WhatsApp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((delivery) => {
              const driver = delivery.assigned_driver_id
                ? driversById.get(delivery.assigned_driver_id)
                : undefined;
              return (
                <tr key={delivery.id}>
                  <td className="px-3 py-2 font-medium text-gray-900">
                    {delivery.customer_name}
                  </td>
                  <td className="px-3 py-2 text-gray-600">{delivery.address}</td>
                  <td className="px-3 py-2 text-gray-500">
                    {delivery.notes || "—"}
                  </td>
                  <td className="px-3 py-2">
                    <WeatherTag weather={weatherByDelivery.get(delivery.id) ?? null} />
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        delivery.status === "delivered"
                          ? "bg-green-100 text-green-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {delivery.status}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <AssignDriverSelect
                      deliveryId={delivery.id}
                      currentDriverId={delivery.assigned_driver_id}
                      drivers={driverList}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <WhatsAppButton
                      phoneNumber={driver?.whatsapp_number}
                      label="Message driver"
                      message={`Hi ${driver?.name ?? ""}, about the delivery for ${
                        delivery.customer_name
                      } at ${delivery.address}: ${delivery.notes ?? ""}`.trim()}
                    />
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-gray-400">
                  No deliveries yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}

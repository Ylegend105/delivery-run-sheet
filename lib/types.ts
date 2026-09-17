export type AppRole = "dispatcher" | "driver";
export type DeliveryStatus = "pending" | "delivered";

export type UserRow = {
  id: string;
  email: string;
  name: string | null;
  role: AppRole;
  whatsapp_number: string | null;
};

export type DeliveryRow = {
  id: string;
  customer_name: string;
  address: string;
  notes: string | null;
  status: DeliveryStatus;
  assigned_driver_id: string | null;
  created_by: string | null;
  created_at: string;
  delivered_at: string | null;
};

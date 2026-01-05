import { apiFetch, apiFetchVoid } from "./client";

export type AlertCondition = "ABOVE" | "BELOW";

export type AlertRead = {
  id: string;
  user_id: string;
  listing_id: string;
  condition: AlertCondition;
  target_price: number;
  currency: string;
  is_active: boolean;
  last_triggered_at: string | null;
  created_at: string;
  updated_at: string;
  ticker?: string | null;
  name?: string | null;
  venue_code?: string | null;
};

export type AlertCreate = {
  listing_id: string;
  condition: AlertCondition;
  target_price: number;
  currency?: string;
};

export async function getMyAlerts(token: string, active?: boolean): Promise<AlertRead[]> {
  const params = new URLSearchParams();
  if (active !== undefined) params.set("active", String(active));
  const q = params.toString();
  const path = q ? `/alerts/me?${q}` : "/alerts/me";
  return apiFetch<AlertRead[]>(path, { method: "GET" }, token);
}

export async function createAlert(token: string, payload: AlertCreate): Promise<AlertRead> {
  return apiFetch<AlertRead>(
    "/alerts",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    token
  );
}

export async function setAlertActive(token: string, alertId: string, isActive: boolean): Promise<AlertRead> {
  return apiFetch<AlertRead>(
    `/alerts/${alertId}`,
    {
      method: "PATCH",
      body: JSON.stringify({ is_active: isActive }),
    },
    token
  );
}

export async function deleteAlert(token: string, alertId: string): Promise<void> {
  return apiFetchVoid(`/alerts/${alertId}`, { method: "DELETE" }, token);
}

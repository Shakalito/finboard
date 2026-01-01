import { apiFetch } from "./client";

export type OrderRead = {
  id: string;
  account_id: string;
  instrument_id: string;
  side: string;
  type: string;
  qty: number;
  limit_price: number | null;
  state: string;
  created_at: string;
  updated_at: string;
};

export type ExecutionRead = {
  id: string;
  order_id: string;
  price: number;
  qty: number;
  fee: number;
  fee_currency: string | null;
  executed_at: string;
};

export async function getMyOrders(token: string, accountId?: string): Promise<OrderRead[]> {
  const qs = accountId ? `?account_id=${encodeURIComponent(accountId)}` : "";
  return apiFetch<OrderRead[]>(`/portfolio/orders/me${qs}`, { method: "GET" }, token);
}

export async function getMyExecutions(token: string): Promise<ExecutionRead[]> {
  return apiFetch<ExecutionRead[]>(`/portfolio/executions/me`, { method: "GET" }, token);
}

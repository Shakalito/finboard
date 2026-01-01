import { apiFetch, apiFetchVoid } from "./client";

export type AccountRead = {
  id: string;
  user_id: string;
  base_currency: string;
  type: string;
  created_at: string;
  updated_at: string;
};

export type BalanceResponse = {
  account_id: string;
  currency: string;
  balance: number;
};

export type PositionRead = {
  position_id: string;
  account_id: string;
  instrument_id: string;
  listing_id: string | null;
  ticker: string | null;
  name: string;
  venue_code: string;
  venue_name?: string;
  qty: number;
  avg_price: number;
  last_price: number | null;
  market_value: number | null;
  unrealized_pnl_abs: number | null;
  unrealized_pnl_pct: number | null;
  asof: string | null;
};

export type PlaceOrderRequest = {
  account_id: string;
  listing_id: string;
  side: "BUY" | "SELL";
  qty: number;
};

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

export async function getMyAccounts(token: string): Promise<AccountRead[]> {
  return apiFetch<AccountRead[]>("/portfolio/accounts/me", {}, token);
}

export async function getAccountBalance(
  token: string,
  accountId: string,
  currency: string
): Promise<BalanceResponse> {
  const q = new URLSearchParams({ currency });
  return apiFetch<BalanceResponse>(
    `/portfolio/accounts/${accountId}/balance?${q.toString()}`,
    {},
    token
  );
}

export async function getMyPositions(token: string): Promise<PositionRead[]> {
  return apiFetch<PositionRead[]>("/portfolio/positions/me", {}, token);
}

export async function createPaperAccount(
  token: string,
  baseCurrency = "USD"
): Promise<AccountRead> {
  return apiFetch<AccountRead>(
    "/portfolio/accounts",
    {
      method: "POST",
      body: JSON.stringify({ base_currency: baseCurrency }),
    },
    token
  );
}


export async function placeOrder(
  token: string,
  payload: PlaceOrderRequest
): Promise<OrderRead> {
  return apiFetch<OrderRead>(
    "/portfolio/orders",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    token
  );
}

export async function deposit(
  token: string,
  accountId: string,
  amount: number,
  currency = "USD"
): Promise<void> {
  await apiFetchVoid(
    `/portfolio/accounts/${accountId}/deposit`,
    {
      method: "POST",
      body: JSON.stringify({ amount, currency }),
    },
    token
  );
}

export async function fillOrder(token: string, orderId: string): Promise<void> {
  await apiFetchVoid(
    `/portfolio/orders/${orderId}/fill`,
    {
      method: "POST",
      body: JSON.stringify({}),
    },
    token
  );
}

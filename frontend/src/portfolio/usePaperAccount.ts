import { useCallback, useEffect, useState } from "react";
import type { AccountRead } from "../api/portfolio";
import { createPaperAccount, getAccountBalance, getMyAccounts } from "../api/portfolio";

type State = {
  account: AccountRead | null;
  balance: number | null;
  currency: string;
  loading: boolean;
  error: string | null;
};

export function usePaperAccount(token: string | null) {
  const [state, setState] = useState<State>({
    account: null,
    balance: null,
    currency: "USD",
    loading: false,
    error: null,
  });

  const refresh = useCallback(async () => {
    if (!token) {
      setState((s) => ({ ...s, account: null, balance: null, loading: false, error: "Not authenticated" }));
      return;
    }

    setState((s) => ({ ...s, loading: true, error: null }));

    try {
      const accounts = await getMyAccounts(token);
      let paper = accounts.find((a) => a.type === "PAPER") ?? null;

      if (!paper) {
        paper = await createPaperAccount(token, "USD");
      }

      const bal = await getAccountBalance(token, paper.id, paper.base_currency);

      setState({
        account: paper,
        balance: bal.balance,
        currency: bal.currency,
        loading: false,
        error: null,
      });
    } catch (e: any) {
      setState((s) => ({
        ...s,
        loading: false,
        error: e?.message ?? "Portfolio account error",
      }));
    }
  }, [token]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { ...state, refresh };
}

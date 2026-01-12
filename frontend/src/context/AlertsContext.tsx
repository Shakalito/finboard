import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { getMyAlerts, type AlertRead } from "../api/alerts";

interface TriggerInfo {
    msg: string;
    type: "success" | "error";
    alertId: string; // To avoid showing same popup twice if state doesn't change
    timestamp: number;
}

interface AlertsContextType {
    alerts: AlertRead[];
    loading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
    latestTrigger: TriggerInfo | null;
    clearTrigger: () => void;
}

const AlertsContext = createContext<AlertsContextType | null>(null);

export function useAlerts() {
    const ctx = useContext(AlertsContext);
    if (!ctx) throw new Error("useAlerts must be used within AlertsProvider");
    return ctx;
}

export function AlertsProvider({ children }: { children: React.ReactNode }) {
    const { token } = useAuth();
    const [alerts, setAlerts] = useState<AlertRead[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // For Popup
    const [latestTrigger, setLatestTrigger] = useState<TriggerInfo | null>(null);

    // Track the most recent triggered time we've seen
    const lastCheckRef = useRef<Date>(new Date());

    // Track if we are currently fetching to avoid overlapping polls
    const isFetchingRef = useRef(false);

    const refresh = async (silent = false) => {
        if (!token) return;
        if (isFetchingRef.current) return;

        isFetchingRef.current = true;
        if (!silent) setLoading(true);
        setError(null);

        try {
            // Always fetch ALL alerts (active=null) to see everything
            const data = await getMyAlerts(token);

            // Check for new triggers
            let maxTime = lastCheckRef.current;
            const newTriggers: AlertRead[] = [];

            data.forEach(a => {
                if (a.last_triggered_at) {
                    const t = new Date(a.last_triggered_at);
                    // If this alert was triggered after our last check
                    if (t > lastCheckRef.current) {
                        newTriggers.push(a);
                        if (t > maxTime) maxTime = t;
                    }
                }
            });

            lastCheckRef.current = maxTime;

            // Update state
            setAlerts(data);

            if (newTriggers.length > 0) {
                // Pick the most relevant one (e.g. latest or first)
                const latest = newTriggers[0];
                setLatestTrigger({
                    msg: `Price Alert! ${latest.ticker} ${latest.condition === 'ABOVE' ? '>' : '<'} ${latest.target_price} ${latest.currency}`,
                    type: 'success',
                    alertId: latest.id,
                    timestamp: Date.now()
                });
            }

        } catch (e: any) {
            console.error("Alerts fetch failed", e);
            if (!silent) setError(e?.message ?? "Failed to load alerts");
        } finally {
            setLoading(false);
            isFetchingRef.current = false;
        }
    };

    useEffect(() => {
        if (!token) {
            setAlerts([]);
            return;
        }

        // Initial fetch
        refresh();

        // Poll every 10 seconds
        const interval = setInterval(() => {
            refresh(true); // silent refresh
        }, 10000);

        return () => clearInterval(interval);
    }, [token]);

    const clearTrigger = () => setLatestTrigger(null);

    return (
        <AlertsContext.Provider value={{
            alerts,
            loading,
            error,
            refresh,
            latestTrigger,
            clearTrigger
        }}>
            {children}
        </AlertsContext.Provider>
    );
}

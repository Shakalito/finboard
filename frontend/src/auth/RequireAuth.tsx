import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { GlobalAlerts } from "../components/GlobalAlerts";
import { AlertsProvider } from "../context/AlertsContext";

export function RequireAuth({ children }: { children: React.ReactNode }) {
    const { token, userInitiatedLogout } = useAuth();
    const location = useLocation();

    if (!token) {
        // If user explicitly logged out, don't show "You must be logged in" message
        if (userInitiatedLogout) {
            return <Navigate to="/login" replace />;
        }

        return (
            <Navigate
                to="/login"
                state={{
                    from: location,
                    message: "You must be logged in to access this page.",
                }}
                replace
            />
        );
    }

    return (
        <AlertsProvider>
            <GlobalAlerts />
            {children}
        </AlertsProvider>
    );
}

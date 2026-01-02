import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

export function RequireAuth({ children }: { children: React.ReactNode }) {
    const { token } = useAuth();
    const location = useLocation();

    if (!token) {
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

    return <>{children}</>;
}

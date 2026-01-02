import { createBrowserRouter, Navigate } from "react-router-dom";
import { RequireAuth } from "../auth/RequireAuth";
import { LoginPage } from "../pages/LoginPage";
import { RegisterPage } from "../pages/RegisterPage";
import { MePage } from "../pages/MePage";
import { ListingsPage } from "../pages/ListingsPage";
import { WatchlistPage } from "../pages/WatchlistPage.tsx";
import { ChartPage } from "../pages/ChartPage";

import { PortfolioPage } from "../pages/PortfolioPage";
import { PortfolioOrdersPage } from "../pages/PortfolioOrdersPage";
import { PortfolioDepositPage } from "../pages/PortfolioDepositPage";
import { PortfolioExecutionsPage } from "../pages/PortfolioExecutionsPage";


export const router = createBrowserRouter([
  { path: "/", element: <Navigate to="/me" replace /> },
  { path: "/login", element: <LoginPage /> },
  { path: "/register", element: <RegisterPage /> },
  {
    path: "/me",
    element: (
      <RequireAuth>
        <MePage />
      </RequireAuth>
    ),
  },

  { path: "/listings", element: <ListingsPage /> },
  {
    path: "/watchlist",
    element: (
      <RequireAuth>
        <WatchlistPage />
      </RequireAuth>
    ),
  },
  {
    path: "/chart/:listingId",
    element: (
      <RequireAuth>
        <ChartPage />
      </RequireAuth>
    ),
  },

  {
    path: "/portfolio",
    element: (
      <RequireAuth>
        <PortfolioPage />
      </RequireAuth>
    ),
  },
  {
    path: "/portfolio/orders",
    element: (
      <RequireAuth>
        <PortfolioOrdersPage />
      </RequireAuth>
    ),
  },
  {
    path: "/portfolio/deposit",
    element: (
      <RequireAuth>
        <PortfolioDepositPage />
      </RequireAuth>
    ),
  },
  {
    path: "/portfolio/executions",
    element: (
      <RequireAuth>
        <PortfolioExecutionsPage />
      </RequireAuth>
    ),
  },
]);

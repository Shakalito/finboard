import { createBrowserRouter, Navigate } from "react-router-dom";
import { LoginPage } from "../pages/LoginPage";
import { RegisterPage } from "../pages/RegisterPage";
import { MePage } from "../pages/MePage";
import { ListingsPage } from "../pages/ListingsPage";
import { WatchlistPage } from "../pages/WatchlistPage.tsx";
import { ChartPage } from "../pages/ChartPage";
import { PortfolioPage } from "../pages/PortfolioPage";
import { PortfolioOrdersPage } from "../pages/PortfolioOrdersPage";
import { PortfolioDepositPage } from "../pages/PortfolioDepositPage";



export const router = createBrowserRouter([
  { path: "/", element: <Navigate to="/me" replace /> },
  { path: "/login", element: <LoginPage /> },
  { path: "/register", element: <RegisterPage /> },
  { path: "/me", element: <MePage /> },

  { path: "/listings", element: <ListingsPage /> },
  { path: "/watchlist", element: <WatchlistPage /> },
  { path: "/chart/:listingId", element: <ChartPage /> },

  { path: "/portfolio", element: <PortfolioPage /> },
  { path: "/portfolio/orders", element: <PortfolioOrdersPage /> },
  { path: "/portfolio/deposit", element: <PortfolioDepositPage /> },

]);

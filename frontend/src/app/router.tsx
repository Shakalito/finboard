import { createBrowserRouter, Navigate } from "react-router-dom";
import { LoginPage } from "../pages/LoginPage";
import { RegisterPage } from "../pages/RegisterPage";
import { MePage } from "../pages/MePage";

export const router = createBrowserRouter([
  { path: "/", element: <Navigate to="/me" replace /> },
  { path: "/login", element: <LoginPage /> },
  { path: "/register", element: <RegisterPage /> },
  { path: "/me", element: <MePage /> },
]);

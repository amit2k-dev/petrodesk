import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  // Check karo ki localStorage mein client_id hai ya nahi
  const isAuthenticated = !!localStorage.getItem("client_id");

  // Agar token/id hai, toh children (dashboard) dikhao, warna login par bhejo
  return isAuthenticated ? children : <Navigate to="/" replace />;
};

export default ProtectedRoute;
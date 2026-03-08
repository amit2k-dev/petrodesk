import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import DailySales from "./pages/DailySales";
import Inventory from "./pages/Inventory";
import Attendance from "./pages/Attendance";
import StaffShiftEntry from "./pages/StaffShiftEntry";
import StaffManagement from "./pages/StaffManagement";
import SalaryReport from "./pages/SalaryReport";
import Settings from "./pages/Settings";

const Layout = ({ children, setAuth }) => (
  <div style={{ display: "flex", width: "100vw", minHeight: "100vh" }}>
    <Sidebar setAuth={setAuth} />
    <div style={{ marginLeft: "260px", flex: 1, padding: "20px" }}>
      {children}
    </div>
  </div>
);

function App() {
  const [auth, setAuth] = useState(localStorage.getItem("client_id"));

  return (
    <Router>
      <Routes>
        <Route 
          path="/" 
          element={auth ? <Navigate to="/dashboard" replace /> : <Login setAuth={setAuth} />} 
        />

        {/* Yahan dekho: isAuthenticated={!!auth} pass kiya hai */}
        <Route path="/*" element={
          <ProtectedRoute isAuthenticated={!!auth}>
            <Layout setAuth={setAuth}>
              <Routes>
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="sales" element={<DailySales />} />
                <Route path="inventory" element={<Inventory />} />
                <Route path="attendance" element={<Attendance />} />
                <Route path="StaffShiftEntry" element={<StaffShiftEntry />} />
                <Route path="staff-management" element={<StaffManagement />} />
                <Route path="salary-report" element={<SalaryReport />} />
                <Route path="settings" element={<Settings />} />
                <Route path="*" element={<Navigate to="dashboard" replace />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
}

export default App;
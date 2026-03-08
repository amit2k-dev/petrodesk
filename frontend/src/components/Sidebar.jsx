import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Fuel, Package, Users, Settings, 
  Wallet, CheckCircle, LogOut, UserCircle 
} from 'lucide-react';

const Sidebar = ({ setAuth }) => { 
  const location = useLocation();
  const navigate = useNavigate();
  
  // Software Name Fixed (Brand)
  const softwareName = "PETRODESK";
  // Client Pump Name (Dynamic)
  const pumpName = localStorage.getItem("pump_name") || "Select Station";
  
  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    document.cookie.split(";").forEach(c => {
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
    if (setAuth) setAuth(null);
    navigate("/", { replace: true });
  };

  const menus = [
    { name: 'Dashboard', icon: <LayoutDashboard size={20}/>, path: '/dashboard' },
    { name: 'Daily Sales', icon: <Fuel size={20}/>, path: '/sales' },
    { name: 'Inventory', icon: <Package size={20}/>, path: '/inventory' },  
    { name: 'Staff Management', icon: <Users size={20}/>, path: '/staff-management' },
    { name: 'Attendance', icon: <CheckCircle size={20}/>, path: '/attendance' },
    { name: 'Shift Entry', icon: <Users size={20}/>, path: '/StaffShiftEntry' },
    { name: 'Salary Report', icon: <Wallet size={20}/>, path: '/salary-report' },
    { name: 'Settings', icon: <Settings size={20}/>, path: '/settings' },
  ];

  return (
    <div style={styles.container}>
      {/* Software Branding */}
      <div style={styles.logoSection}>
        <div style={styles.logoIcon}>⛽</div>
        <div style={styles.brandName}>{softwareName}</div>
      </div>

      {/* Client Pump Name & User Info */}
      <div style={styles.userProfile}>
        <UserCircle size={35} color="#60a5fa" />
        <div style={{ marginLeft: '12px' }}>
          <p style={styles.subLabel}>CURRENT STATION</p>
          <div style={styles.pumpNameDisplay}>{pumpName.toUpperCase()}</div>
        </div>
      </div>

      <div style={styles.menuContainer}>
        {menus.map((m) => {
          const isActive = location.pathname === m.path;
          return (
            <Link key={m.path} to={m.path} style={styles.link}>
              <div style={{ ...styles.menuItem, backgroundColor: isActive ? '#3b82f6' : 'transparent', color: isActive ? 'white' : '#94a3b8' }}>
                <span style={{ marginRight: '12px', color: isActive ? 'white' : '#3b82f6', display: 'flex' }}>{m.icon}</span> 
                {m.name}
              </div>
            </Link>
          );
        })}
      </div>

      <div style={styles.footer}>
        <button type="button" onClick={handleLogout} style={styles.logoutBtn}>
          <LogOut size={18} style={{ marginRight: '8px' }} /> Logout
        </button>
      </div>
    </div>
  );
};

const styles = {
  container: { width: '260px', backgroundColor: '#0f172a', height: '100vh', position: 'fixed', color: 'white', left: 0, top: 0, display: 'flex', flexDirection: 'column', boxShadow: '4px 0 10px rgba(0,0,0,0.3)', fontFamily: "'Inter', sans-serif" },
  logoSection: { padding: '30px 20px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid #1e293b' },
  logoIcon: { background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', width: '35px', height: '35px', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '20px' },
  brandName: { fontSize: '18px', fontWeight: '900', color: '#f8fafc', letterSpacing: '1px' },
  userProfile: { display: 'flex', alignItems: 'center', padding: '20px', margin: '15px', backgroundColor: '#1e293b', borderRadius: '12px' },
  subLabel: { margin: 0, fontSize: '9px', color: '#94a3b8', fontWeight: 'bold', letterSpacing: '0.5px' },
  pumpNameDisplay: { fontSize: '12px', fontWeight: '800', color: '#e2e8f0', marginTop: '4px' },
  menuContainer: { padding: '10px 15px', flex: 1, overflowY: 'auto' },
  link: { textDecoration: 'none' },
  menuItem: { display: 'flex', alignItems: 'center', padding: '12px 16px', borderRadius: '10px', marginBottom: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '500', transition: 'all 0.3s ease' },
  footer: { padding: '20px', borderTop: '1px solid #1e293b' },
  logoutBtn: { width: '100%', display: 'flex', alignItems: 'center', padding: '12px', borderRadius: '10px', cursor: 'pointer', color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: 'none', fontWeight: 'bold', transition: 'all 0.3s ease', textAlign: 'left' }
};

export default Sidebar;
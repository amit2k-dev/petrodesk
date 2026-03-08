import React, { useState, useEffect, useCallback } from "react";
import api from "../api"; 
import { PlusCircle, Database, AlertTriangle, Fuel, Droplets, RefreshCw, BarChart3 } from "lucide-react";

const InventoryForm = () => {
  const [tanks, setTanks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ tank_id: "", added_qty: "" });

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/inventory/'); 
      setTanks(data);
      if(data.length > 0 && !formData.tank_id) {
        setFormData(prev => ({ ...prev, tank_id: data[0].id }));
      }
    } catch (error) {
      console.error("Inventory Fetch Error:", error);
      alert("⚠️ Server connection failed.");
    } finally {
      setLoading(false);
    }
  }, [formData.tank_id]);

  useEffect(() => { fetchInventory(); }, [fetchInventory]);

  const handleStockUpdate = async (e) => {
    e.preventDefault();
    if (!formData.added_qty || formData.added_qty <= 0) return alert("Enter valid quantity.");

    // Logic: Find current selected tank's details
    const selectedTank = tanks.find(t => t.id === formData.tank_id);
    const totalPotential = selectedTank.current_stock + parseFloat(formData.added_qty);

    if (totalPotential > selectedTank.capacity) {
        return alert(`❌ Error: Capacity limit exceed! \nAvailable: ${selectedTank.current_stock}L, Max: ${selectedTank.capacity}L`);
    }

    try {
        await api.post('/update-inventory/', formData);
        alert("🎉 Inventory Updated Successfully!");
        setFormData({ ...formData, added_qty: "" });
        fetchInventory();
    } catch (error) {
        alert("❌ Failed to update stock.");
    }
};

  // Helper to determine fuel color
  const getFuelColor = (type, low) => {
    if (low) return "#ef4444"; // Danger Red
    return type.toLowerCase().includes("petrol") ? "#3b82f6" : "#10b981"; // Blue for Petrol, Green for Diesel
  };

  return (
    <div style={styles.container}>
      {/* Header Section */}
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>Fuel Inventory Dashboard</h1>
          <p style={styles.subtitle}>Real-time monitoring & stock replenishment</p>
        </div>
        <button onClick={fetchInventory} style={styles.refreshBtn} disabled={loading}>
          <RefreshCw size={16} className={loading ? "spin-animation" : ""} />
          {loading ? "Syncing..." : "Refresh Status"}
        </button>
      </header>

      {/* Tank Status Grid */}
      <div style={styles.grid}>
        {tanks.map((tank) => {
          const fuelLevel = Math.min((tank.current_stock / tank.capacity) * 100, 100);
          const isCritical = tank.current_stock < 1000;
          const fuelColor = getFuelColor(tank.product_type, isCritical);

          return (
            <div key={tank.id} style={styles.card}>
              <div style={styles.cardHeader}>
                <div style={styles.iconWrapper(tank.product_type)}>
                  {tank.product_type.toLowerCase().includes("petrol") ? <Droplets size={20} /> : <Fuel size={20} />}
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={styles.productName}>{tank.product_type}</h3>
                  <div style={{display:'flex', alignItems: 'center', gap: '5px'}}>
                    <span style={styles.badge(isCritical)}>
                      {isCritical ? "Low Stock" : "Operational"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Graphical Progress Bar */}
              <div style={styles.progressContainer}>
                <div style={styles.progressLabelRow}>
                  <span style={styles.progressLabel}>Tank Fill Level</span>
                  <span style={{...styles.progressLabel, color: fuelColor}}>{fuelLevel.toFixed(1)}%</span>
                </div>
                <div style={styles.progressBarBg}>
                  <div style={styles.progressBarFill(fuelLevel, fuelColor)} />
                </div>
              </div>

              <div style={styles.statsRow}>
                <div style={styles.statBox}>
                  <label style={styles.statLabel}>Available</label>
                  <span style={styles.statValue}>{tank.current_stock.toLocaleString()} <small>Ltr</small></span>
                </div>
                <div style={styles.statBox}>
                  <label style={styles.statLabel}>Capacity</label>
                  <span style={styles.statValue}>{tank.capacity.toLocaleString()} L</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Stock Entry Form */}
      <section style={styles.formCard}>
        <div style={styles.formHeader}>
          <div style={styles.formIcon}><PlusCircle size={20} color="white" /></div>
          <h2 style={styles.formTitle}>Tanker Refill Entry</h2>
        </div>
        
        <form onSubmit={handleStockUpdate} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Select Tank</label>
            <select 
              style={styles.input} 
              value={formData.tank_id} 
              onChange={(e) => setFormData({ ...formData, tank_id: parseInt(e.target.value) })}
            >
              {tanks.map(t => <option key={t.id} value={t.id}>{t.product_type} - {t.id}</option>)}
            </select>
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Qty Inward (Litres)</label>
            <input 
              type="number" 
              style={styles.input} 
              placeholder="0.00" 
              value={formData.added_qty}
              onChange={(e) => setFormData({ ...formData, added_qty: e.target.value })}
            />
          </div>
          <button type="submit" style={styles.submitBtn}>
            ADD TO INVENTORY
          </button>
        </form>
      </section>

      {/* Simple CSS for Refresh Icon Animation */}
      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
        .spin-animation { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
};

// --- MODERN MATTE STYLES ---
const styles = {
  container: { padding: "40px", backgroundColor: "#f8fafc", minHeight: "100vh", fontFamily: "'Inter', sans-serif" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "35px" },
  title: { fontSize: "26px", fontWeight: "900", color: "#0f172a", margin: 0, letterSpacing: "-0.5px" },
  subtitle: { color: "#64748b", margin: "4px 0 0 0", fontSize: "14px" },
  refreshBtn: { display: "flex", alignItems: "center", gap: "8px", padding: "10px 20px", borderRadius: "10px", border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", fontWeight: "700", color: "#0f172a", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" },
  
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "25px", marginBottom: "40px" },
  card: { background: "#fff", borderRadius: "20px", padding: "24px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)", border: "1px solid #e2e8f0" },
  cardHeader: { display: "flex", gap: "15px", marginBottom: "25px", alignItems: 'center' },
  productName: { fontSize: "17px", fontWeight: "800", color: "#1e293b", margin: 0 },
  
  iconWrapper: (type) => ({ 
    padding: "10px", borderRadius: "12px", 
    backgroundColor: type.toLowerCase().includes("petrol") ? "#eff6ff" : "#ecfdf5", 
    color: type.toLowerCase().includes("petrol") ? "#3b82f6" : "#10b981" 
  }),

  badge: (low) => ({ 
    fontSize: "10px", padding: "3px 10px", borderRadius: "20px", fontWeight: "800", 
    backgroundColor: low ? "#fef2f2" : "#f0fdf4", 
    color: low ? "#dc2626" : "#16a34a", 
    textTransform: "uppercase", letterSpacing: "0.5px"
  }),

  // Progress Bar Styles
  progressContainer: { marginBottom: "20px" },
  progressLabelRow: { display: "flex", justifyContent: "space-between", marginBottom: "8px" },
  progressLabel: { fontSize: "12px", fontWeight: "700", color: "#94a3b8" },
  progressBarBg: { height: "12px", backgroundColor: "#f1f5f9", borderRadius: "10px", overflow: "hidden" },
  progressBarFill: (lvl, color) => ({ 
    width: `${lvl}%`, height: "100%", backgroundColor: color, 
    borderRadius: "10px", transition: "width 1s ease-in-out" 
  }),

  statsRow: { marginTop: "20px", display: "flex", borderTop: "1px solid #f1f5f9", paddingTop: "18px", gap: "15px", justifyContent:"space-between" },
  // statBox: { flex: 1 },
  statLabel: { display: "block", fontSize: "11px", color: "#94a3b8", fontWeight: "800", textTransform: "uppercase" },
  statValue: { fontSize: "18px", fontWeight: "800", color: "#1e293b" },

  formCard: { background: "#fff", padding: "35px", borderRadius: "20px", border: "1px solid #e2e8f0", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.05)" },
  formHeader: { display: "flex", alignItems: "center", gap: "15px", marginBottom: "30px" },
  formIcon: { background: "#0f172a", padding: "8px", borderRadius: "10px" , display:"flex" },
  formTitle: { fontSize: "20px", fontWeight: "900", margin: 0, color: "#0f172a" },
  form: { display: "flex", gap: "25px", flexWrap: "wrap", alignItems: "flex-end" },
  inputGroup: { flex: 1, minWidth: "260px", display: "flex", flexDirection: "column", gap: "10px" },
  label: { fontSize: "13px", fontWeight: "700", color: "#475569" },
  input: { padding: "12px 15px", borderRadius: "12px", border: "1px solid #e2e8f0", outline: "none", fontSize: "14px", fontWeight: "600", color: "#1e293b", background: "#f8fafc" },
  submitBtn: { padding: "13px 35px", borderRadius: "12px", backgroundColor: "#0f172a", color: "#fff", border: "none", fontWeight: "800", cursor: "pointer", transition: "0.2s", fontSize: "13px" }
};

export default InventoryForm;
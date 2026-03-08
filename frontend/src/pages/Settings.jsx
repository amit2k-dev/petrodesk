import React, { useState, useEffect } from "react";
import api from "../api"; 
import { Save, Fuel, ShieldCheck, Info, Check, Activity } from "lucide-react";

const Settings = () => {
  const [rates, setRates] = useState({ petrol: "", diesel: "" });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  // --- GET CURRENT RATES FROM DB ---
  const fetchCurrentRates = async () => {
    try {
      const res = await api.get("/get-current-rates/");
      // Agar backend array bhej raha hai toh pehla record uthao
      const data = Array.isArray(res.data) ? res.data[0] : res.data;
      
      if (data) {
        setRates({
          petrol: data.petrol_rate || "",
          diesel: data.diesel_rate || "",
        });
      }
    } catch (err) {
      console.error("Settings fetch error:", err);
    }
  };

  // Page load hote hi data fetch karo
  useEffect(() => { 
    fetchCurrentRates(); 
  }, []);

  // --- UPDATE RATES TO DB ---
  const handleUpdate = async () => {
    if (!rates.petrol || !rates.diesel) {
      return alert("Error: Please enter both Petrol and Diesel rates.");
    }

    setLoading(true);
    try {
      await api.post(`/update-rates/`, null, {
        params: { petrol: rates.petrol, diesel: rates.diesel }
      });
      
      setSaved(true);
      setTimeout(() => setSaved(false), 3000); 
      fetchCurrentRates(); // Dubara fetch karo taaki confirm ho jaye
    } catch (err) {
      alert("❌ Update failed! Check backend connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.headerSection}>
        <h2 style={styles.mainTitle}>System Control Panel</h2>
        <p style={styles.subtitle}>Current active fuel prices in your database</p>
      </div>

      <div style={styles.settingsGrid}>
        {/* --- LEFT: RATE SETTINGS --- */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <Activity size={20} color="#3b82f6" />
            <h3 style={styles.cardTitle}>Live Price Configuration</h3>
          </div>
          <p style={styles.cardDesc}>
            The values below are currently active in the system. Edit and save to update.
          </p>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Petrol (MS) Active Rate</label>
            <div style={styles.inputWrapper}>
              <span style={styles.currencyPrefix}>₹</span>
              <input 
                type="number" 
                style={styles.input} 
                value={rates.petrol} // ✅ Ab ye database wala value dikhayega
                onChange={(e) => setRates({ ...rates, petrol: e.target.value })} 
                placeholder="0.00" 
              />
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Diesel (HSD) Active Rate</label>
            <div style={styles.inputWrapper}>
              <span style={styles.currencyPrefix}>₹</span>
              <input 
                type="number" 
                style={styles.input} 
                value={rates.diesel} // ✅ Ab ye database wala value dikhayega
                onChange={(e) => setRates({ ...rates, diesel: e.target.value })} 
                placeholder="0.00" 
              />
            </div>
          </div>

          <button 
            onClick={handleUpdate} 
            style={{
              ...styles.updateBtn, 
              background: saved ? '#10b981' : '#2563eb'
            }} 
            disabled={loading}
          >
            {loading ? "Saving Changes..." : saved ? <><Check size={18}/> Rates Updated Successfully</> : <><Save size={18}/> Save New Rates</>}
          </button>
        </div>

        {/* --- RIGHT: STATUS --- */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ ...styles.card, borderLeft: '4px solid #3b82f6' }}>
            <div style={styles.cardHeader}>
              <Fuel size={20} color="#3b82f6" />
              <h3 style={styles.cardTitle}>Current Status</h3>
            </div>
            <div style={styles.statusRow}>
              <span>Petrol: <strong>₹{rates.petrol || '0.00'}</strong></span>
              <span>Diesel: <strong>₹{rates.diesel || '0.00'}</strong></span>
            </div>
          </div>

          <div style={{ ...styles.card, borderLeft: '4px solid #f59e0b' }}>
            <div style={styles.cardHeader}>
              <Info size={20} color="#f59e0b" />
              <h3 style={styles.cardTitle}>Quick Tip</h3>
            </div>
            <p style={styles.infoText}>
              Jab bhi aap rate badalte hain, Sales Entry page ko refresh karne ki zaroorat nahi padti, system auto-pick kar lega.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: { padding: "40px", backgroundColor: "#f8fafc", minHeight: "100vh", fontFamily: "'Inter', sans-serif" },
  headerSection: { marginBottom: '35px' },
  mainTitle: { margin: 0, fontSize: '28px', fontWeight: '900', color: '#0f172a' },
  subtitle: { margin: '5px 0 0 0', color: '#64748b', fontSize: '15px' },
  settingsGrid: { display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "25px", maxWidth: '1000px' },
  card: { background: "white", padding: "30px", borderRadius: "20px", border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', boxSizing: 'border-box' },
  cardHeader: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' },
  cardTitle: { margin: 0, fontSize: '17px', fontWeight: '800', color: '#1e293b' },
  cardDesc: { fontSize: '13px', color: '#64748b', marginBottom: '25px' },
  inputGroup: { marginBottom: '22px' },
  label: { display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase' },
  inputWrapper: { position: 'relative', display: 'flex', alignItems: 'center' },
  currencyPrefix: { position: 'absolute', left: '15px', fontWeight: '800', color: '#94a3b8' },
  input: { width: '100%', padding: '14px 14px 14px 40px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '20px', fontWeight: '800', outline: 'none', color: '#0f172a', boxSizing: 'border-box' },
  updateBtn: { color: 'white', border: 'none', padding: '16px', borderRadius: '12px', cursor: 'pointer', width: '100%', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', transition: 'all 0.3s ease' },
  statusRow: { display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '16px', color: '#1e293b' },
  infoText: { margin: 0, fontSize: '14px', color: '#475569', lineHeight: '1.6' }
};

export default Settings;
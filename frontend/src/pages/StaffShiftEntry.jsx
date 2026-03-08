import React, { useState, useEffect, useCallback, useMemo } from "react";
import api from "../api"; 
import { 
  Save, Smartphone, Banknote, CreditCard, List, 
  FileSpreadsheet, X, Search, Trash2, Edit3, UserCircle, CheckCircle2 
} from "lucide-react";
import * as XLSX from "xlsx";

const StaffShiftEntry = () => {
  const initialForm = {
    date: new Date().toISOString().split("T")[0],
    shift: "Shift A (Day)", 
    salesman_name: "", 
    nozzle: "Nozzle 1 (P)",
    opening_reading: "", 
    closing_reading: "", 
    rate: 0, 
    online_payment: "", 
    cash_payment: "",
    otp_payment: 0, 
    testing: 0 
  };

  const [formData, setFormData] = useState(initialForm);
  const [history, setHistory] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [currentRates, setCurrentRates] = useState({ petrol: 0, diesel: 0 });
  const [search, setSearch] = useState({ name: "", date: "" });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  // --- DATA FETCHING ---
  const fetchInitialData = useCallback(async () => {
    try {
      const [staffRes, rateRes] = await Promise.all([
        api.get("/employees/"),
        api.get("/get-current-rates/")
      ]);
      setStaffList(staffRes.data || []);
      
      // Backend response handle kar rahe hain (Array vs Object check)
      const dbRate = Array.isArray(rateRes.data) ? rateRes.data[0] : rateRes.data;
      const rates = {
        petrol: dbRate?.petrol_rate || 0,
        diesel: dbRate?.diesel_rate || 0
      };
      setCurrentRates(rates);
      setFormData(prev => ({ ...prev, rate: prev.nozzle.includes("(D)") ? rates.diesel : rates.petrol }));
    } catch (err) { 
      console.log("Initial Load Error:", err); 
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await api.get(`/staff-history/`, {
        params: { name: search.name || undefined, date: search.date || undefined }
      });
      setHistory(res.data || []);
    } catch (err) { 
      console.log("History Fetch Error:", err); 
    }
  }, [search]);

  useEffect(() => { fetchInitialData(); fetchHistory(); }, [fetchInitialData, fetchHistory]);

  // --- AUTO RATE SYNC ---
  useEffect(() => {
    const isDiesel = formData.nozzle.includes("(D)");
    setFormData(prev => ({
      ...prev,
      rate: isDiesel ? currentRates.diesel : currentRates.petrol
    }));
  }, [formData.nozzle, currentRates]);

  // --- LIVE CALCULATIONS ---
  const calculations = useMemo(() => {
    const opening = parseFloat(formData.opening_reading) || 0;
    const closing = parseFloat(formData.closing_reading) || 0;
    const rate = parseFloat(formData.rate) || 0;
    const online = parseFloat(formData.online_payment) || 0;
    const cash = parseFloat(formData.cash_payment) || 0;

    const actualSale = Math.max(0, closing - opening);
    const totalAmount = actualSale * rate;
    const autoCredit = Math.max(0, totalAmount - (online + cash));

    return { actualSale, totalAmount, autoCredit };
  }, [formData]);

  // --- SAVE ACTION ---
  const handleSave = async () => {
    if (!formData.salesman_name) return alert("Bhai, Staff ka naam select karo!");
    if (parseFloat(formData.closing_reading) < parseFloat(formData.opening_reading)) {
      return alert("Meter Error: Closing reading opening se kam nahi ho sakti!");
    }

    setLoading(true);
    const payload = {
      ...formData,
      opening_reading: Number(formData.opening_reading),
      closing_reading: Number(formData.closing_reading),
      otp_payment: Number(calculations.autoCredit.toFixed(2)), 
      actual_sale_ltr: Number(calculations.actualSale.toFixed(3)),
      total_amount: Number(calculations.totalAmount.toFixed(2)),
    };

    try {
      if (editingId) {
        await api.put(`/update-staff-shift/${editingId}/`, payload);
      } else {
        await api.post("/add-staff-shift/", payload);
      }
      alert("✅ Shift Record Saved Successfully!");
      setFormData({ ...initialForm, rate: currentRates.petrol });
      setEditingId(null);
      fetchHistory();
    } catch (err) { 
      console.log("Save Transaction Error:", err);
      alert("❌ Save Failed: Check Console for details."); 
    } finally { 
      setLoading(false); 
    }
  };

  const startEdit = (row) => {
    setEditingId(row.id);
    setFormData({
      date: row.date,
      shift: row.shift,
      salesman_name: row.salesman_name,
      nozzle: row.nozzle,
      opening_reading: row.opening_reading,
      closing_reading: row.closing_reading,
      rate: row.rate,
      online_payment: row.online_payment,
      cash_payment: row.cash_payment,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(history);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "StaffSales");
    XLSX.writeFile(wb, `Staff_Report_${formData.date}.xlsx`);
  };

  return (
    <div style={styles.container}>
      {/* Header Area */}
      <div style={styles.headerArea}>
        <div>
          <h2 style={styles.headerTitle}>{editingId ? "📝 Edit Shift Entry" : "⛽ Staff Shift & Sales"}</h2>
          <p style={styles.subtitle}>Manage daily nozzle readings and staff handovers</p>
        </div>
        <div style={styles.liveBadge}><CheckCircle2 size={14}/> System Online</div>
      </div>

      <div style={styles.card}>
        {/* Row 1: Basic Selection */}
        <div style={styles.grid4}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Date</label>
            <input type="date" style={styles.input} value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} />
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Salesman</label>
            <select style={styles.input} value={formData.salesman_name} onChange={(e) => setFormData({...formData, salesman_name: e.target.value})}>
              <option value="">-- Choose Staff --</option>
              {staffList.map(emp => <option key={emp.id} value={emp.name}>{emp.name}</option>)}
            </select>
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Shift</label>
            <select style={styles.input} value={formData.shift} onChange={(e) => setFormData({...formData, shift: e.target.value})}>
              <option>Shift A (Day)</option>
              <option>Shift B (Night)</option>
            </select>
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Nozzle</label>
            <select style={styles.input} value={formData.nozzle} onChange={(e) => setFormData({...formData, nozzle: e.target.value})}>
              {["Nozzle 1 (P)", "Nozzle 2 (D)", "Nozzle 3 (P)", "Nozzle 4 (D)"].map(n => <option key={n}>{n}</option>)}
            </select>
          </div>
        </div>

        {/* Row 2: Reading Section */}
        <div style={styles.readingSection}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Opening Meter</label>
            <input type="number" style={styles.input} value={formData.opening_reading} onChange={(e) => setFormData({...formData, opening_reading: e.target.value})} placeholder="0.00" />
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Closing Meter</label>
            <input type="number" style={styles.input} value={formData.closing_reading} onChange={(e) => setFormData({...formData, closing_reading: e.target.value})} placeholder="0.00" />
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Current Rate</label>
            <input type="number" style={{...styles.input, backgroundColor: '#f8fafc', fontWeight: 'bold'}} value={formData.rate} readOnly />
          </div>
          <div style={styles.statBox}>
            <span style={styles.statLabel}>Sale Volume</span>
            <span style={styles.statValue}>{calculations.actualSale.toFixed(2)} Ltr</span>
          </div>
        </div>

        {/* Row 3: Payments */}
        <div style={styles.grid3}>
          <div style={{...styles.payCard, background: '#eff6ff'}}>
            <label style={styles.payLabel}><Smartphone size={14}/> Online Payment</label>
            <input type="number" style={styles.payInput} value={formData.online_payment} onChange={(e) => setFormData({...formData, online_payment: e.target.value})} placeholder="₹ 0.00" />
          </div>
          <div style={{...styles.payCard, background: '#ecfdf5'}}>
            <label style={styles.payLabel}><Banknote size={14}/> Cash Handover</label>
            <input type="number" style={styles.payInput} value={formData.cash_payment} onChange={(e) => setFormData({...formData, cash_payment: e.target.value})} placeholder="₹ 0.00" />
          </div>
          <div style={{...styles.payCard, background: '#fff7ed', border: '1px dashed #fdba74'}}>
            <label style={{...styles.payLabel, color: '#c2410c'}}><CreditCard size={14}/> Pending / Credit</label>
            <div style={styles.creditVal}>₹{calculations.autoCredit.toFixed(2)}</div>
          </div>
        </div>

        {/* Form Footer */}
        <div style={styles.footer}>
          <div>
            <p style={styles.totalLabel}>Total Sale Value</p>
            <h3 style={styles.totalAmount}>₹{calculations.totalAmount.toLocaleString('en-IN')}</h3>
          </div>
          <div style={{display:'flex', gap:'10px'}}>
            {editingId && <button onClick={() => {setEditingId(null); setFormData(initialForm);}} style={styles.cancelBtn}>Cancel</button>}
            <button onClick={handleSave} style={styles.saveBtn} disabled={loading}>
              <Save size={18} /> {loading ? "Saving..." : (editingId ? "Update Entry" : "Save Shift")}
            </button>
          </div>
        </div>
      </div>

      {/* History Table */}
      <div style={{ ...styles.card, marginTop: "30px", padding: "0" }}>
        <div style={styles.tableTop}>
          <h3 style={styles.tableTitle}><List size={18}/> Shift History</h3>
          <button onClick={exportToExcel} style={styles.exportBtn}><FileSpreadsheet size={16}/> Export Excel</button>
        </div>

        <div style={styles.filterArea}>
          <div style={{position: 'relative', flex: 1}}>
            <Search size={16} style={styles.searchIcon} />
            <input placeholder="Search salesman..." style={styles.filterInput} value={search.name} onChange={(e) => setSearch({...search, name: e.target.value})} />
          </div>
          <input type="date" style={styles.filterInput} value={search.date} onChange={(e) => setSearch({...search, date: e.target.value})} />
        </div>

        <div style={{overflowX: 'auto'}}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.thRow}>
                <th style={styles.th}>Date</th>
                <th style={styles.th}>Staff</th>
                <th style={styles.th}>Nozzle</th>
                <th style={styles.th}>Sale (L)</th>
                <th style={styles.th}>Net Amount</th>
                <th style={styles.th}>Credit</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {history.map((row) => (
                <tr key={row.id} style={styles.tr}>
                  <td style={styles.td}>{row.date}</td>
                  <td style={{...styles.td, fontWeight: '700'}}>{row.salesman_name}</td>
                  <td style={styles.td}>{row.nozzle}</td>
                  <td style={styles.td}>{row.actual_sale_ltr}</td>
                  <td style={{...styles.td, fontWeight: '800'}}>₹{row.total_amount}</td>
                  <td style={{...styles.td, color: '#e11d48', fontWeight: 'bold'}}>₹{row.otp_payment}</td>
                  <td style={styles.td}>
                    <div style={{display:'flex', gap:'8px'}}>
                      <button onClick={() => startEdit(row)} style={styles.actionBtnEdit}><Edit3 size={14}/></button>
                      <button onClick={() => {
                        if(window.confirm("Bhai, delete kar du?")) {
                          api.delete(`/delete-staff-shift/${row.id}/`).then(fetchHistory).catch(err => console.log(err));
                        }
                      }} style={styles.actionBtnDel}><Trash2 size={14}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// --- STYLING ---
const styles = {
  container: { padding: "40px", backgroundColor: "#f8fafc", minHeight: "100vh", fontFamily: "'Inter', sans-serif" },
  headerArea: { display: 'flex', justifyContent: 'space-between', marginBottom: '30px', alignItems: 'center' },
  headerTitle: { margin: 0, fontSize: '24px', fontWeight: '900', color: '#0f172a' },
  subtitle: { margin: 0, color: '#64748b', fontSize: '14px' },
  liveBadge: { fontSize: '11px', background: '#dcfce7', color: '#166534', padding: '6px 15px', borderRadius: '30px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '5px' },
  card: { background: "white", padding: "30px", borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" },
  grid4: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px" },
  grid3: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px", marginTop: '25px' },
  inputGroup: { display: "flex", flexDirection: "column", gap: '8px' },
  label: { fontSize: "11px", fontWeight: "800", color: "#475569", textTransform: "uppercase" },
  input: { padding: "12px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "14px", outline: 'none' },
  readingSection: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '20px', background: '#f8fafc', padding: '20px', borderRadius: '12px', marginTop: '25px', border: '1px solid #e2e8f0' },
  statBox: { display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingLeft: '20px', borderLeft: '2px solid #e2e8f0' },
  statLabel: { fontSize: '11px', color: '#64748b', fontWeight: 'bold' },
  statValue: { fontSize: '22px', fontWeight: '900', color: '#0f172a' },
  payCard: { padding: '20px', borderRadius: '12px' },
  payLabel: { fontSize: '11px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px' },
  payInput: { width: '100%', border: 'none', background: 'white', marginTop: '10px', padding: '10px', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold' },
  creditVal: { fontSize: '22px', fontWeight: '900', color: '#9a3412', marginTop: '10px' },
  footer: { marginTop: "30px", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #f1f5f9", paddingTop: "25px" },
  totalLabel: { margin: 0, fontSize: '12px', color: '#64748b', fontWeight: 'bold' },
  totalAmount: { margin: 0, fontSize: '28px', fontWeight: '900', color: '#0f172a' },
  saveBtn: { background: "#0f172a", color: "white", padding: "12px 30px", border: "none", borderRadius: "10px", fontWeight: "bold", cursor: "pointer", display: 'flex', gap: '8px' },
  cancelBtn: { padding: '12px 20px', background: '#f1f5f9', border: 'none', borderRadius: '10px', fontWeight: 'bold', color: '#64748b', cursor: 'pointer' },
  tableTop: { padding: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  tableTitle: { margin: 0, fontSize: '18px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' },
  exportBtn: { background: '#16a34a', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '8px', fontWeight: 'bold', display: 'flex', gap: '6px', cursor: 'pointer' },
  filterArea: { padding: '0 25px 20px', display: 'flex', gap: '10px' },
  filterInput: { padding: '10px 10px 10px 35px', borderRadius: '8px', border: '1px solid #cbd5e1', flex: 1 },
  searchIcon: { position: 'absolute', left: '12px', top: '12px', color: '#94a3b8' },
  table: { width: "100%", borderCollapse: "collapse" },
  thRow: { background: "#f8fafc", borderBottom: "2px solid #e2e8f0" },
  th: { padding: '18px', textAlign: 'left', color: '#64748b', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' },
  td: { padding: '18px', fontSize: '14px', borderBottom: '1px solid #f1f5f9' },
  tr: { transition: '0.2s', ':hover': { background: '#f8fafc' } },
  actionBtnEdit: { background: '#eff6ff', color: '#2563eb', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer' },
  actionBtnDel: { background: '#fff1f2', color: '#e11d48', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer' }
};

export default StaffShiftEntry;
  import React, { useState, useEffect, useCallback } from "react";
  import api from "../api";
  import { Save, Fuel, History, Download, X, Trash2, Edit3, RotateCcw } from "lucide-react";
  import * as XLSX from "xlsx";


  const DailySales = () => {
    // --- States ---
    const [sales, setSales] = useState([]);
    const [globalRates, setGlobalRates] = useState({ petrol_rate: 0, diesel_rate: 0 });
    const [filterDate, setFilterDate] = useState("");
    const [editingId, setEditingId] = useState(null);
    
    const getTodayDate = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0'); // Mahina 2 digit mein
        const day = String(today.getDate()).padStart(2, '0');        // Din 2 digit mein
        return `${year}-${month}-${day}`;
    };
    const [formData, setFormData] = useState({
      date: getTodayDate(),
      nozzle: "Petrol (MS)",
      opening: "",
      closing: "",
      testing: "0",
      rate: "",
    });

    // --- Data Fetching ---
    const fetchData = useCallback(async (dateParam = "") => {
      try {
        // 1. Fetch Current Fuel Rates
        const rateRes = await api.get(`/get-current-rates/`);
        setGlobalRates(rateRes.data);
        
        // Auto-set initial rate if not present
        if (!formData.rate) {
          setFormData(prev => ({ ...prev, rate: rateRes.data.petrol_rate }));
        }

        // 2. Fetch Sales Records (with optional date filter)
       const url = dateParam 
        ? `/get-sales/?date=${dateParam}` 
        : `/get-sales/`;
        
        const salesRes = await api.get(url);
        setSales(salesRes.data);
      } catch (err) {
        console.log(err)
        console.error("Data fetch error:", err);
      }
    }, [formData.rate]);

    useEffect(() => {
      fetchData();
    }, [fetchData]);

    // --- Event Handlers ---

    // Handle Product/Nozzle change and update rate automatically
    const handleNozzleChange = (val) => {
      const selectedRate = val === "Petrol (MS)" ? globalRates.petrol_rate : globalRates.diesel_rate;
      setFormData({ ...formData, nozzle: val, rate: selectedRate });
    };

    // Start Editing a Record
    const startEdit = (item) => {
      setEditingId(item.id);
      setFormData({
        date: item.date,
        nozzle: item.nozzle,
        opening: item.opening,
        closing: item.closing,
        testing: item.testing,
        rate: item.rate,
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    };

    // Cancel/Reset Form
    const resetForm = () => {
      setEditingId(null);
      setFormData({
        ...formData,
        date: getTodayDate(),
        opening: "",
        closing: "",
        testing: "0",
      });
    };

    // Save or Update Sales Record
    const handleSave = async (e) => {
      e.preventDefault();
      if (parseFloat(formData.opening) >= parseFloat(formData.closing)) {
    alert("❌ Error: Opening reading closing se zyada nahi ho sakti!");
    return;
  }
      const payload = {
        ...formData,
        opening: parseFloat(formData.opening),
        closing: parseFloat(formData.closing),
        testing: parseFloat(formData.testing) || 0,
        rate: parseFloat(formData.rate),
      };

      try {
        if (editingId) {
          await api.put(`/update-sale/${editingId}`, payload);
          alert("✅ Record Updated!");
        } else {
          await api.post(`/add-sale/`, payload);
          alert("🎉 Entry Saved!");
        }
        resetForm();
        fetchData(filterDate);
      } catch (err) {
        console.log(err)
        alert("❌ Error: Operation failed!");
      }
    };

    // Delete Record
    const handleDelete = async (id) => {
      if (window.confirm("Are you sure you want to delete this record?")) {
        try {
          await api.delete(`/delete-sale/${id}`);
          fetchData(filterDate);
        } catch (err) {
          console.log(err)
          alert("❌ Delete failed!");
        }
      }
    };

    // Export Table to Excel
    const exportToExcel = () => {
      if (sales.length === 0) return alert("No data to export!");
      const ws = XLSX.utils.json_to_sheet(sales);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Sales_Record");
      XLSX.writeFile(wb, `Sales_Report_${filterDate || "All"}.xlsx`);
    };

    // --- Render ---
    return (
      <div style={containerStyle}>
        {/* Header Section */}
        <div style={headerStyle}>
          <h2 style={titleStyle}>
            <Fuel color="#3b82f6" /> {editingId ? "Edit Sales Entry" : "Daily Sales Entry"}
          </h2>
          <span style={dateTagStyle}>Today: {new Date().toLocaleDateString()}</span>
        </div>

        {/* Form Card */}
        <div style={cardStyle}>
          <form onSubmit={handleSave}>
            <div style={formGrid}>
              <div style={inputGroup}>
                <label style={labelStyle}>Entry Date</label>
                <input type="date" style={inputStyle} value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} />
              </div>
              <div style={inputGroup}>
                <label style={labelStyle}>Product</label>
                <select style={inputStyle} value={formData.nozzle} onChange={(e) => handleNozzleChange(e.target.value)}>
                  <option value="Petrol (MS)">Petrol (MS)</option>
                  <option value="Diesel (HSD)">Diesel (HSD)</option>
                </select>
              </div>
              <div style={inputGroup}>
                <label style={labelStyle}>Opening</label>
                <input type="number" step="any" required style={inputStyle} value={formData.opening} onChange={(e) => setFormData({...formData, opening: e.target.value})} />
              </div>
              <div style={inputGroup}>
                <label style={labelStyle}>Closing</label>
                <input type="number" step="any" required style={inputStyle} value={formData.closing} onChange={(e) => setFormData({...formData, closing: e.target.value})} />
              </div>
              <div style={inputGroup}>
                <label style={labelStyle}>Testing (Ltr)</label>
                <input type="number" step="any" style={inputStyle} value={formData.testing} onChange={(e) => setFormData({...formData, testing: e.target.value})} />
              </div>
              <div style={inputGroup}>
                <label style={labelStyle}>Rate (₹)</label>
                <input type="number" value={formData.rate} readOnly style={readOnlyInput} />
              </div>
            </div>

            <div style={buttonWrapper}>
              <button type="submit" style={{ ...fullBtnStyle, backgroundColor: editingId ? "#2563eb" : "#10b981" }}>
                <Save size={18} /> {editingId ? "UPDATE DATA" : "SAVE DATA"}
              </button>
              {editingId && (
                <button type="button" onClick={resetForm} style={{ ...fullBtnStyle, backgroundColor: "#64748b" }}>
                  <RotateCcw size={18} /> CANCEL
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Filter & Export Bar */}
        <div style={toolbarStyle}>
          <div style={filterBoxStyle}>
            <label style={{...labelStyle, marginBottom: 0}}>Filter:</label>
            <input type="date" style={{...inputStyle, padding: "5px 10px"}} value={filterDate} onChange={(e) => {setFilterDate(e.target.value); fetchData(e.target.value);}} />
            {filterDate && <X size={18} color="red" style={{cursor: "pointer"}} onClick={() => {setFilterDate(""); fetchData("");}} />}
          </div>
          <button onClick={exportToExcel} style={{ ...btnStyle, backgroundColor: "#065f46" }}>
            <Download size={18} /> EXCEL
          </button>
        </div>

        {/* Data Table */}
        <div style={{ ...cardStyle, padding: "0px", overflow: "hidden" }}>
          <div style={tableHeaderStyle}>
            <History size={20} color="#64748b" />
            <h4 style={{ margin: 0 }}>Recent Sales Record</h4>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={tableMainStyle}>
              <thead>
                <tr style={{ backgroundColor: "#f8fafc", textAlign: "left" }}>
                  <th style={thStyle}>Date</th>
                  <th style={thStyle}>Nozzle</th>
                  <th style={thStyle}>Readings</th>
                  <th style={thStyle}>Difference</th>
                  <th style={thStyle}>Actual Sale</th>
                  <th style={thStyle}>Total Amount</th>
                  <th style={thStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((s, i) => (
                  <tr key={i} style={trStyle}>
                    <td style={tdStyle}>{new Date(s.date).toLocaleDateString()}</td>
                    <td style={tdStyle}><span style={badgeStyle}>{s.nozzle}</span></td>
                    <td style={tdStyle}>{s.opening} → {s.closing}</td>
                    <td style={tdStyle}>{s.difference}</td>
                    <td style={{ ...tdStyle, fontWeight: "bold" }}>{s.actual_sale?.toFixed(2)} Ltr</td>
                    <td style={{ ...tdStyle, fontWeight: "bold", color: "#10b981" }}>₹{s.total_amount?.toLocaleString()}</td>
                    <td style={{ ...tdStyle, display: "flex", gap: "10px" }}>
                      <button onClick={() => startEdit(s)} style={actionBtnStyle}><Edit3 size={16} color="#2563eb" /></button>
                      <button onClick={() => handleDelete(s.id)} style={{...actionBtnStyle, backgroundColor: "#fee2e2"}}><Trash2 size={16} color="#dc2626" /></button>
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

  // --- Professional Styles Object ---
  const containerStyle = { padding: "30px", backgroundColor: "#f1f5f9", minHeight: "100vh" };
  const headerStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px" };
  const titleStyle = { color: "#1e293b", margin: 0, display: "flex", alignItems: "center", gap: "10px" };
  const dateTagStyle = { fontSize: "14px", color: "#64748b" };
  const cardStyle = { backgroundColor: "white", padding: "25px", borderRadius: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.05)", marginBottom: "30px" };
  const formGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "20px", alignItems: "end" };
  const inputGroup = { display: "flex", flexDirection: "column", gap: "8px" };
  const labelStyle = { fontSize: "13px", fontWeight: "600", color: "#64748b" };
  const inputStyle = { padding: "12px", borderRadius: "10px", border: "1px solid #e2e8f0", fontSize: "15px", outline: "none" };
  const readOnlyInput = { ...inputStyle, backgroundColor: "#f1f5f9", cursor: "not-allowed", color: "#64748b", fontWeight: "bold" };
  const buttonWrapper = { display: "flex", gap: "12px", marginTop: "25px", paddingTop: "20px", borderTop: "1px solid #f1f5f9" };
  const btnStyle = { color: "white", border: "none", padding: "12px 25px", borderRadius: "10px", cursor: "pointer", fontWeight: "bold", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" };
  const fullBtnStyle = { ...btnStyle, minWidth: "160px" };
  const toolbarStyle = { display: "flex", justifyContent: "space-between", marginBottom: "15px", gap: "10px" };
  const filterBoxStyle = { display: "flex", alignItems: "center", gap: "10px", backgroundColor: "white", padding: "10px 15px", borderRadius: "10px" };
  const tableHeaderStyle = { padding: "20px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: "10px" };
  const tableMainStyle = { width: "100%", borderCollapse: "collapse" };
  const thStyle = { padding: "15px 20px", fontSize: "12px", color: "#64748b", textTransform: "uppercase" };
  const tdStyle = { padding: "15px 20px", color: "#334155", fontSize: "14px" };
  const trStyle = { borderBottom: "1px solid #f1f5f9" };
  const actionBtnStyle = { border: "none", background: "#dbeafe", padding: "8px", borderRadius: "8px", cursor: "pointer", display: "flex" };
  const badgeStyle = { backgroundColor: "#eff6ff", color: "#3b82f6", padding: "4px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: "bold" };

  export default DailySales;
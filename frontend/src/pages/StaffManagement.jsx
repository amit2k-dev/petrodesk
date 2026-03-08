import React, { useState, useEffect } from "react";
import api from "../api"; 
import { 
  UserPlus, HandCoins, Users, Save, Trash2, Edit, Power, PowerOff, X, CheckCircle2 
} from "lucide-react";

const StaffManagement = () => {
  const [activeTab, setActiveTab] = useState("add");
  const [employees, setEmployees] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);

  // --- FORM STATES ---
  const [empData, setEmpData] = useState({
    name: "",
    base_salary: "",
    shift: "Day Shift",
    joining_date: new Date().toISOString().split("T")[0],
  });

  const [advData, setAdvData] = useState({
    employee_id: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    remarks: "",
  });

  // --- FETCH DATA ---
  const fetchEmployees = async () => {
    try {
      const res = await api.get("/employees/");
      setEmployees(res.data || []);
    } catch (err) {
      console.error("Staff fetch error:", err);
    }
  };

  useEffect(() => { fetchEmployees(); }, []);

  // --- SAVE EMPLOYEE ---
  const handleSaveEmployee = async () => {
    if (!empData.name.trim() || !empData.base_salary) return alert("Bhai, naam aur salary bhare!");

    setLoading(true);
    try {
        const payload = { ...empData, base_salary: parseFloat(empData.base_salary) };
        if (isEditing) {
            await api.put(`/employees/${editId}/?client_id=${localStorage.getItem("client_id")}`, payload);
        } else {
            await api.post(`/employees/?client_id=${localStorage.getItem("client_id")}`, payload);
        }
        
        resetForm();
        await fetchEmployees(); // Refresh list
        alert(isEditing ? "Profile Update Ho Gayi!" : "Naya Staff Add Ho Gaya!");
    } catch (err) {
        alert("Error: Save nahi ho paya.");
    } finally {
        setLoading(false);
    }
};

  // --- ADVANCE PAYMENT LOGIC ---
  const handleSaveAdvance = async () => {
    const selectedEmp = employees.find(e => e.id === parseInt(advData.employee_id));
    const advanceAmount = parseFloat(advData.amount);

    if (!advData.employee_id || !advData.amount || advanceAmount <= 0) {
      return alert("Sahi employee aur amount select karein!");
    }

    // Safety Alert: Agar advance salary se zyada hai
    if (selectedEmp && advanceAmount > selectedEmp.base_salary) {
      const proceed = window.confirm(`Dhyan dein: Advance (₹${advanceAmount}) salary se zyada hai. Continue?`);
      if (!proceed) return;
    }

    setLoading(true);
    try {
      await api.post("/salary-advance/", {
        employee_id: parseInt(advData.employee_id),
        amount: advanceAmount,
        date: advData.date,
        remarks: advData.remarks,
      });
      alert("Advance Record ho gaya!");
      setAdvData({ employee_id: "", amount: "", date: new Date().toISOString().split("T")[0], remarks: "" });
    } catch (err) {
      alert("Advance entry fail ho gayi.");
    } finally {
      setLoading(false);
    }
  };

  // --- DELETE & STATUS ---
  const handleDelete = async (id) => {
    if (window.confirm("Delete karna hai?")) {
        try {
            await api.delete(`/employees/${id}/?client_id=${localStorage.getItem("client_id")}`);
            fetchEmployees();
        } catch (err) {
            alert("Delete failed! Shayad is employee ka record kahin aur linked hai.");
        }
    }
};

  const toggleStatus = async (emp) => {
    const newStatus = emp.status === "Active" ? "Inactive" : "Active";
    try {
      await api.put(`/employees/${emp.id}`, { ...emp, status: newStatus });
      fetchEmployees();
    } catch (err) {
      alert("Status badalne mein error aaya.");
    }
  };

  const startEdit = (emp) => {
    setIsEditing(true);
    setEditId(emp.id);
    setActiveTab("add");
    setEmpData({ name: emp.name, base_salary: emp.base_salary, shift: emp.shift, joining_date: emp.joining_date });
  };

  const resetForm = () => {
    setEmpData({ name: "", base_salary: "", shift: "Day Shift", joining_date: new Date().toISOString().split("T")[0] });
    setIsEditing(false);
    setEditId(null);
  };

  return (
    <div style={styles.mainContainer}>
      {/* Header */}
      <div style={styles.pageHeader}>
        <div>
          <h2 style={styles.headerTitle}>Staff Management</h2>
          <p style={styles.subtitle}>Add employees and manage salary advances</p>
        </div>
        <div style={styles.statusBadge}>
          <CheckCircle2 size={14} /> Server Live
        </div>
      </div>

      {/* Tabs */}
      <div style={styles.tabContainer}>
        <button onClick={() => { setActiveTab("add"); resetForm(); }} style={activeTab === "add" ? styles.activeTabBtn : styles.inactiveTabBtn}>
          <UserPlus size={18} /> {isEditing ? "Edit Profile" : "Add New Staff"}
        </button>
        <button onClick={() => setActiveTab("advance")} style={activeTab === "advance" ? styles.activeTabBtn : styles.inactiveTabBtn}>
          <HandCoins size={18} /> Advance Payment
        </button>
      </div>

      {/* Dynamic Form Card */}
      <div style={styles.cardStyle}>
        {activeTab === "add" ? (
          <div style={styles.formGrid}>
            <div style={styles.inputGroup}>
              <label style={styles.labelStyle}>Full Name</label>
              <input type="text" style={styles.inputStyle} value={empData.name} onChange={(e) => setEmpData({ ...empData, name: e.target.value })} placeholder="Enter name" />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.labelStyle}>Base Salary (₹)</label>
              <input type="number" style={styles.inputStyle} value={empData.base_salary} onChange={(e) => setEmpData({ ...empData, base_salary: e.target.value })} placeholder="e.g. 15000" />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.labelStyle}>Shift</label>
              <select style={styles.inputStyle} value={empData.shift} onChange={(e) => setEmpData({ ...empData, shift: e.target.value })}>
                <option value="Day Shift">Day Shift</option>
                <option value="Night Shift">Night Shift</option>
              </select>
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.labelStyle}>Joining Date</label>
              <input type="date" style={styles.inputStyle} value={empData.joining_date} onChange={(e) => setEmpData({ ...empData, joining_date: e.target.value })} />
            </div>
            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button onClick={handleSaveEmployee} style={{ ...styles.saveBtn, background: isEditing ? "#f59e0b" : "#0f172a" }}>
                <Save size={18} /> {loading ? "Saving..." : isEditing ? "Update Staff" : "Register Staff"}
              </button>
              {isEditing && <button onClick={resetForm} style={styles.cancelBtn}><X size={18} /> Cancel</button>}
            </div>
          </div>
        ) : (
          <div style={styles.formGrid}>
            <div style={styles.inputGroup}>
              <label style={styles.labelStyle}>Select Staff Member</label>
              <select style={styles.inputStyle} value={advData.employee_id} onChange={(e) => setAdvData({ ...advData, employee_id: e.target.value })}>
                <option value="">-- Choose Employee --</option>
                {employees.filter(e => e.status === "Active").map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name} (Base: ₹{emp.base_salary})</option>
                ))}
              </select>
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.labelStyle}>Advance Amount (₹)</label>
              <input type="number" style={styles.inputStyle} value={advData.amount} onChange={(e) => setAdvData({ ...advData, amount: e.target.value })} placeholder="₹ 0.00" />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.labelStyle}>Date</label>
              <input type="date" style={styles.inputStyle} value={advData.date} onChange={(e) => setAdvData({ ...advData, date: e.target.value })} />
            </div>
            <div style={{ gridColumn: '1 / -1' }} className="mt-2">
              <label style={styles.labelStyle}>Remarks</label>
              <input type="text" style={styles.inputStyle} value={advData.remarks} onChange={(e) => setAdvData({ ...advData, remarks: e.target.value })} placeholder="Reason for advance..." />
            </div>
            <button onClick={handleSaveAdvance} style={{ ...styles.saveBtn, background: "#2563eb", gridColumn: '1 / -1', marginTop: '10px' }}>
              <HandCoins size={18} /> Submit Advance Payment
            </button>
          </div>
        )}
      </div>

      {/* Directory Table */}
      <div style={{ ...styles.cardStyle, marginTop: "25px", padding: "0px", overflow: "hidden" }}>
        <table style={styles.tableStyle}>
          <thead>
            <tr style={styles.thRow}>
              <th style={styles.thStyle}>Staff Name</th>
              <th style={styles.thStyle}>Join Date</th>
              <th style={styles.thStyle}>Base Salary</th>
              <th style={styles.thStyle}>Shift</th>
              <th style={styles.thStyle}>Status</th>
              <th style={styles.thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((emp) => (
              <tr key={emp.id} style={styles.trStyle}>
                <td style={{ ...styles.tdStyle, fontWeight: "700", color: "#0f172a" }}>{emp.name}</td>
                <td style={styles.tdStyle}>{emp.joining_date}</td>
                <td style={styles.tdStyle}>₹{parseFloat(emp.base_salary).toLocaleString()}</td>
                <td style={styles.tdStyle}>{emp.shift}</td>
                <td style={styles.tdStyle}>
                  <button onClick={() => toggleStatus(emp)} style={emp.status === "Active" ? styles.activeBadge : styles.inactiveBadge}>
                    {emp.status === "Active" ? <Power size={12} /> : <PowerOff size={12} />} {emp.status}
                  </button>
                </td>
                <td style={styles.tdStyle}>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button onClick={() => startEdit(emp)} style={styles.editBtn}><Edit size={16} /></button>
                    <button onClick={() => handleDelete(emp.id)} style={styles.delBtn}><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// --- STYLING ---
const styles = {
  mainContainer: { backgroundColor: "#f8fafc", minHeight: "100vh", padding: "40px", fontFamily: "'Inter', sans-serif" },
  pageHeader: { display: "flex", justifyContent: "space-between", marginBottom: "30px", alignItems: "center" },
  headerTitle: { margin: 0, fontSize: "24px", fontWeight: "900", color: "#0f172a", letterSpacing: "-0.02em" },
  subtitle: { margin: 0, color: "#64748b", fontSize: "14px" },
  statusBadge: { fontSize: "12px", background: "#dcfce7", color: "#15803d", padding: "6px 12px", borderRadius: "20px", fontWeight: "700", display: "flex", alignItems: "center", gap: "5px" },
  tabContainer: { display: "flex", gap: "10px", marginBottom: "20px" },
  cardStyle: { backgroundColor: "white", padding: "30px", borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" },
  formGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px" },
  inputGroup: { display: "flex", flexDirection: "column", gap: "8px" },
  labelStyle: { fontSize: "11px", fontWeight: "800", color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em" },
  inputStyle: { padding: "12px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "14px", outline: "none", width: "100%", boxSizing: "border-box" },
  activeTabBtn: { background: "#0f172a", color: "white", padding: "12px 24px", borderRadius: "10px", cursor: "pointer", border: "none", fontWeight: "700", display: "flex", alignItems: "center", gap: "8px" },
  inactiveTabBtn: { background: "white", color: "#64748b", padding: "12px 24px", borderRadius: "10px", cursor: "pointer", border: "1px solid #e2e8f0", fontWeight: "700", display: "flex", alignItems: "center", gap: "8px" },
  saveBtn: { color: "white", padding: "14px 28px", borderRadius: "10px", border: "none", fontWeight: "800", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" },
  cancelBtn: { background: "#f1f5f9", color: "#475569", padding: "14px 20px", borderRadius: "10px", border: "none", cursor: "pointer", fontWeight: "700", display: "flex", alignItems: "center", gap: "5px" },
  tableStyle: { width: "100%", borderCollapse: "collapse" },
  thRow: { background: "#f8fafc", borderBottom: "2px solid #e2e8f0" },
  thStyle: { padding: "18px", textAlign: "left", fontSize: "11px", color: "#64748b", fontWeight: "800", textTransform: "uppercase" },
  tdStyle: { padding: "18px", fontSize: "14px", borderBottom: "1px solid #f1f5f9", color: "#475569" },
  trStyle: { transition: "0.2s", ":hover": { background: "#f8fafc" } },
  activeBadge: { background: "#dcfce7", color: "#166534", padding: "6px 12px", borderRadius: "30px", border: "none", cursor: "pointer", fontSize: "11px", fontWeight: "800", display: "flex", alignItems: "center", gap: "5px" },
  inactiveBadge: { background: "#fee2e2", color: "#991b1b", padding: "6px 12px", borderRadius: "30px", border: "none", cursor: "pointer", fontSize: "11px", fontWeight: "800", display: "flex", alignItems: "center", gap: "5px" },
  editBtn: { background: "#fef3c7", color: "#d97706", border: "none", padding: "10px", borderRadius: "8px", cursor: "pointer" },
  delBtn: { background: "#fee2e2", color: "#dc2626", border: "none", padding: "10px", borderRadius: "8px", cursor: "pointer" },
};

export default StaffManagement;
import React, { useState, useEffect, useCallback } from 'react';
import api from '../api'; 
import { CheckCircle, Save, Calendar, List, Trash2, Lock, Unlock } from 'lucide-react';

const Attendance = () => {
  // --- STATE MANAGEMENT ---
  const [employees, setEmployees] = useState([]);
  const [attendanceData, setAttendanceData] = useState({});
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewMonth, setViewMonth] = useState(new Date().toISOString().slice(0, 7));
  const [staffPaidDates, setStaffPaidDates] = useState({});

  // --- API CALLS ---

  const fetchStaff = async () => {
    try {
      const res = await api.get('/employees/'); 
      setEmployees(res.data ? res.data.filter(emp => emp.status === 'Active') : []);
    } catch (err) {
      console.error("Failed to load staff:", err);
    }
  };

  const fetchHistory = useCallback(async () => {
    try {
      // 1. Fetch Attendance History
      const res = await api.get(`/attendance/history/${viewMonth}`); 
      setHistory(res.data || []);

      // 2. Fetch Salary Report to check "Last Paid" dates for locking
      const reportRes = await api.get(`/salary/report/${viewMonth}`); 
      const dateMap = {};
      
      if (Array.isArray(reportRes.data)) {
        reportRes.data.forEach(item => {
          dateMap[item.id] = item.last_paid_to || "0000-00-00";
        });
      }
      setStaffPaidDates(dateMap);

      // 3. Sync Current Day Selection with UI
      const todayRecords = (res.data || []).filter(h => h.date === selectedDate);
      let currentStatus = {};
      todayRecords.forEach(r => {
        const emp = (employees || []).find(e => e.name === r.name);
        if (emp) currentStatus[emp.id] = r.status;
      });
      setAttendanceData(currentStatus);
    } catch (err) {
    console.error("Save Error:", err);
    // User ko specific error dikhao agar backend se aaya hai
    alert(err.response?.data?.detail || "Attendance save karne mein error aaya!");
}
  }, [viewMonth, selectedDate, employees]);

  useEffect(() => { fetchStaff(); }, []);
  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  // --- LOGIC HELPER ---
  const isLocked = (empId) => {
    const lastPaidDate = staffPaidDates[empId];
    if (!lastPaidDate) return false;
    return selectedDate <= lastPaidDate;
  };

  // --- EVENT HANDLERS ---
  const handleStatusChange = (empId, status) => {
    if (isLocked(empId)) {
      alert(`Modification Restricted: Salary already processed up to ${staffPaidDates[empId]}`);
      return;
    }
    setAttendanceData(prev => ({ ...prev, [empId]: status }));
  };

const saveAllAttendance = async () => {
    // 1. LocalStorage se client_id uthao
    const clientId = localStorage.getItem("client_id");
    
    if (!clientId) {
        alert("Session expired! Please login again.");
        return;
    }

    const recordsToSave = Object.keys(attendanceData).filter(empId => !isLocked(empId));
    
    if (recordsToSave.length === 0) return alert("Kuch select toh karo bhai!");
    
    setLoading(true);
    try {
        // 2. Loop ke andar ab sahi variable use hoga
        for (let empId of recordsToSave) {
            await api.post(`/attendance/?client_id=${parseInt(clientId)}`, { 
                employee_id: parseInt(empId),
                status: attendanceData[empId],
                date: selectedDate
            });
        }
        alert("🎉 Attendance saved successfully!");
        
        // 3. Data save hone ke baad UI update karne ke liye
        setAttendanceData({}); 
        fetchHistory();
    } catch (err) {
        console.error("Save Error:", err);
        alert("Galti ho gayi! Check console for details.");
    } finally { 
        setLoading(false); 
    }
};
  const deleteAttendance = async (attendanceId, empName) => {
    const emp = employees.find(e => e.name === empName);
    if (emp && isLocked(emp.id)) {
      return alert("Action Restricted: Paid records cannot be deleted.");
    }
    if (!window.confirm("Are you sure you want to delete this record?")) return;
    
    try {
      await api.delete(`/attendance/${attendanceId}`); 
      fetchHistory();
    } catch (err) { 
      console.log(err);
      alert("❌ Failed to delete the record."); 
    }
  };

  // --- UI RENDERING (No changes needed in styles/return) ---
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <CheckCircle size={28} color="#22c55e" />
          <h2 style={{ margin: 0, color: '#1e293b' }}>Attendance Smart System</h2>
        </div>
        <div style={styles.datePicker}>
          <Calendar size={18} color="#64748b" />
          <input 
            type="date" 
            value={selectedDate} 
            onChange={(e) => setSelectedDate(e.target.value)} 
            style={styles.dateInput} 
          />
        </div>
      </div>

      <div style={styles.card}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.thRow}>
              <th style={styles.th}>Employee Name</th>
              <th style={styles.th}>Shift</th>
              <th style={{...styles.th, textAlign: 'center'}}>Attendance Status</th>
            </tr>
          </thead>
          <tbody>
            {employees.length > 0 ? employees.map((emp) => {
              const locked = isLocked(emp.id);
              return (
                <tr key={emp.id} style={{...styles.tr, backgroundColor: locked ? '#f8fafc' : 'white'}}>
                  <td style={styles.td}>
                    <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                      <strong style={{color: locked ? '#94a3b8' : '#1e293b'}}>{emp.name}</strong> 
                      {locked ? <Lock size={14} color="#ef4444" /> : <Unlock size={14} color="#22c55e" />}
                    </div>
                    {locked && <span style={{fontSize:'10px', color:'#94a3b8'}}>Locked (Paid: {staffPaidDates[emp.id]})</span>}
                  </td>
                  <td style={styles.td}>{emp.shift}</td>
                  <td style={styles.td}>
                    <div style={styles.btnGroup}>
                      {['Present', 'Absent', 'Half Day'].map(status => (
                        <button 
                          key={status}
                          disabled={locked}
                          onClick={() => handleStatusChange(emp.id, status)} 
                          style={attendanceData[emp.id] === status ? styles.activeBtn(status) : styles.btn}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              );
            }) : (
                <tr><td colSpan="3" style={{textAlign:'center', padding:'20px'}}>No Active Staff Registered</td></tr>
            )}
          </tbody>
        </table>
        <button onClick={saveAllAttendance} style={styles.saveBtn} disabled={loading}>
          <Save size={18} /> {loading ? 'Processing...' : 'SUBMIT RECORDS'}
        </button>
      </div>

      <div style={{ marginTop: '40px' }}>
        <div style={styles.historyHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <List size={20} color="#64748b" />
            <h3 style={{ margin: 0, color: '#475569' }}>Logs for {viewMonth}</h3>
          </div>
          <input 
            type="month" 
            value={viewMonth} 
            onChange={(e) => setViewMonth(e.target.value)} 
            style={styles.monthSelect} 
          />
        </div>
        
        <div style={styles.card}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.thRow}>
                <th style={styles.th}>Date</th>
                <th style={styles.th}>Employee</th>
                <th style={styles.th}>Status</th>
                <th style={{...styles.th, textAlign: 'center'}}>Action</th>
              </tr>
            </thead>
            <tbody>
              {history.map((row, index) => {
                const emp = employees.find(e => e.name === row.name);
                const isPaidRecord = emp && row.date <= (staffPaidDates[emp.id] || "0000-00-00");
                return (
                  <tr key={index} style={styles.tr}>
                    <td style={styles.td}>{row.date}</td>
                    <td style={styles.td}>{row.name}</td>
                    <td style={styles.td}>
                        <span style={styles.badge(row.status)}>{row.status}</span>
                    </td>
                    <td style={{...styles.td, textAlign: 'center'}}>
                      {!isPaidRecord ? (
                        <button onClick={() => deleteAttendance(row.id, row.name)} style={styles.deleteBtn}>
                          <Trash2 size={16} />
                        </button>
                      ) : <Lock size={14} color="#cbd5e1" title="Record Locked" />}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Styles object remains same as original (Omitted here for brevity, keep your original styles)
const styles = {
    container: { padding: '30px', backgroundColor: '#f1f5f9', minHeight: '100vh', fontFamily: 'Inter, sans-serif' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' },
    datePicker: { display: 'flex', alignItems: 'center', gap: '10px', background: 'white', padding: '8px 15px', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' },
    dateInput: { border: 'none', outline: 'none', fontWeight: '700', color: '#1e293b', background: 'transparent' },
    card: { background: 'white', borderRadius: '15px', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', overflow: 'hidden' },
    table: { width: '100%', borderCollapse: 'collapse' },
    thRow: { borderBottom: '2px solid #f1f5f9' },
    th: { padding: '15px', textAlign: 'left', color: '#64748b', fontSize: '11px', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '0.05em' },
    td: { padding: '12px 15px', borderBottom: '1px solid #f1f5f9', fontSize: '14px', color: '#334155' },
    tr: { transition: '0.2s hover', cursor: 'default' },
    btnGroup: { display: 'flex', gap: '8px', justifyContent: 'center' },
    btn: { padding: '6px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', fontSize: '12px', fontWeight: '600', color: '#64748b', transition: '0.2s' },
    activeBtn: (s) => ({
      padding: '6px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: '600', color: 'white',
      backgroundColor: s === 'Present' ? '#22c55e' : s === 'Absent' ? '#ef4444' : '#f59e0b',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }),
    saveBtn: { marginTop: '20px', width: '220px', padding: '12px', background: '#1e293b', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', fontWeight: 'bold', fontSize: '14px', transition: '0.2s' },
    historyHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' },
    monthSelect: { padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontWeight: '600', color: '#475569', cursor: 'pointer' },
    deleteBtn: { background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' },
    badge: (s) => ({
      padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold',
      backgroundColor: s === 'Present' ? '#dcfce7' : s === 'Absent' ? '#fee2e2' : '#fff3c7',
      color: s === 'Present' ? '#166534' : s === 'Absent' ? '#991b1b' : '#92400e'
    })
  };

export default Attendance;
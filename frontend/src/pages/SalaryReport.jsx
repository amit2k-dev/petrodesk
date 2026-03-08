import React, { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../api'; 
import * as XLSX from 'xlsx';
import { 
  RefreshCw, Download, CheckCircle, AlertCircle, Search, 
  Users, Wallet, Clock, Lock, FileText, ChevronRight 
} from 'lucide-react';

const SalaryReport = () => {
  const [salaryData, setSalaryData] = useState([]);
  const [viewMonth, setViewMonth] = useState(new Date().toISOString().slice(0, 7));
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionLoading, setActionLoading] = useState(null);

  const todayDate = new Date().toISOString().split('T')[0];

  // --- API FETCHING ---
  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/salary/report/${viewMonth}`); 
      setSalaryData(res.data || []);
    } catch (err) {
      console.error("Salary Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  }, [viewMonth]);

  useEffect(() => {
    fetchReport();
    // Auto-sync when user comes back to the tab
    window.addEventListener('focus', fetchReport);
    return () => window.removeEventListener('focus', fetchReport);
  }, [fetchReport]);

  // --- LOGIC & FILTERING ---
  const filteredData = useMemo(() => {
    return (salaryData || []).filter(emp => 
      emp.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [salaryData, searchTerm]);

  const summary = useMemo(() => {
    return filteredData.reduce((acc, curr) => {
      acc.totalNet += Number(curr.net_payable || 0);
      if (curr.status === 'Paid') acc.paidCount++;
      else acc.pendingCount++;
      return acc;
    }, { totalNet: 0, paidCount: 0, pendingCount: 0 });
  }, [filteredData]);

  const formatCurrency = (num) => {
    const value = isNaN(num) || num === null ? 0 : num;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };

  // --- ACTIONS ---
 const handleMarkDone = async (emp) => {
    
    const clientId = localStorage.getItem('client_id'); // Client ID nikalna

    try {
      await api.post(`/salary/save-payment`, {
        employee_id: emp.id,
        month: viewMonth,
        paid_up_to: todayDate,
        present_days: emp.present_days || 0,
        base_salary: emp.base_salary || 0,
        total_advance: emp.total_advance || 0,
        net_payable: emp.net_payable || 0
      });
      
      alert("✅ Payment Saved!");
      fetchReport(); 
    } catch (err) {
      alert("❌ Error saving payment.");
    }
};

  const exportExcel = (emp = null) => {
    const dataRows = emp ? [emp] : filteredData;
    const ws = XLSX.utils.json_to_sheet(dataRows.map(r => ({
      "Staff Name": r.name,
      "Base Salary": r.base_salary,
      "Days Present": r.present_days,
      "Advance Deducted": r.total_advance,
      "Final Payout": r.net_payable,
      "Status": r.status,
      "Paid Till": r.last_paid_to || 'N/A'
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Payroll");
    XLSX.writeFile(wb, `Payroll_Report_${viewMonth}.xlsx`);
  };

  return (
    <div style={styles.page}>
      {/* Header Section */}
      <div style={styles.topBar}>
        <div>
          <div style={styles.breadcrumb}>Payroll Management <ChevronRight size={14}/></div>
          <h1 style={styles.mainHeading}>Salary Disbursement</h1>
        </div>
        
        <div style={styles.controls}>
          <div style={styles.searchWrapper}>
            <Search size={16} style={styles.searchIcon} />
            <input 
              placeholder="Search staff name..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              style={styles.searchInput} 
            />
          </div>
          <input type="month" value={viewMonth} onChange={(e) => setViewMonth(e.target.value)} style={styles.dateInput} />
          <button onClick={fetchReport} style={styles.syncBtn} title="Refresh Data">
            <RefreshCw size={16} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={styles.summaryContainer}>
        <div style={styles.card}>
          <div style={{...styles.iconBox, background: '#eef2ff'}}><Users color="#6366f1" size={20} /></div>
          <div><p style={styles.cardLabel}>Active Staff</p><h3 style={styles.cardVal}>{filteredData.length} Members</h3></div>
        </div>
        <div style={styles.card}>
          <div style={{...styles.iconBox, background: '#ecfdf5'}}><Wallet color="#10b981" size={20}/></div>
          <div><p style={styles.cardLabel}>Total Liability</p><h3 style={styles.cardVal}>{formatCurrency(summary.totalNet)}</h3></div>
        </div>
        <div style={styles.card}>
          <div style={{...styles.iconBox, background: '#fff7ed'}}><Clock color="#f59e0b" size={20}/></div>
          <div><p style={styles.cardLabel}>Pending</p><h3 style={styles.cardVal}>{summary.pendingCount} Staff</h3></div>
        </div>
        <button onClick={() => exportExcel()} style={styles.mainExportBtn}>
          <FileText size={18} /> DOWNLOAD REPORT
        </button>
      </div>

      {/* Payroll Table */}
      <div style={styles.tableCard}>
        <div style={styles.tableHeader}>
          <h3 style={styles.tableTitle}>Staff Payroll Matrix - {viewMonth}</h3>
        </div>
        <div style={{overflowX: 'auto'}}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Staff Member</th>
                <th style={styles.th}>Base Salary</th>
                <th style={styles.th}>Attendance</th>
                <th style={styles.th}>Advance (Dr)</th>
                <th style={styles.th}>Net Payable</th>
                <th style={styles.th}>Status</th>
                <th style={{...styles.th, textAlign: 'center'}}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length > 0 ? filteredData.map((emp) => (
                <tr key={emp.id} style={styles.row}>
                  <td style={styles.nameTd}>
                    <div style={styles.empName}>{emp.name}</div>
                    {emp.status === 'Paid' && <div style={styles.paidDate}>Paid on: {emp.last_paid_to}</div>}
                  </td>
                  <td style={styles.td}>{formatCurrency(emp.base_salary)}</td>
                  <td style={styles.td}><span style={styles.presentLabel}>{emp.present_days || 0} Days</span></td>
                  <td style={styles.advanceTd}>- {formatCurrency(emp.total_advance)}</td>
                  <td style={styles.netTd}>{formatCurrency(emp.net_payable)}</td>
                  <td style={styles.td}>
                    <div style={emp.status === 'Paid' ? styles.statusPaid : styles.statusPending}>
                      {emp.status === 'Paid' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                      {emp.status}
                    </div>
                  </td>
                  <td style={styles.td}>
                    <div style={styles.btnGrp}>
                      {emp.status !== 'Paid' ? (
                        <button onClick={() => handleMarkDone(emp)} style={styles.payBtn} disabled={actionLoading === emp.id}>
                          {actionLoading === emp.id ? "⌛..." : "Mark Paid"}
                        </button>
                      ) : (
                        <div style={styles.lockedContainer}>
                          <Lock size={12} /> LOCKED
                        </div>
                      )}
                      <button onClick={() => exportExcel(emp)} style={styles.miniBtn} title="Download Slip">
                        <Download size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="7" style={styles.noData}>No records found for this month.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// --- STYLING ---
const styles = {
  page: { padding: '40px', backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" },
  topBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '30px' },
  breadcrumb: { color: '#64748b', fontSize: '12px', fontWeight: '600', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' },
  mainHeading: { margin: 0, fontSize: '26px', color: '#0f172a', fontWeight: '900' },
  controls: { display: 'flex', gap: '12px', alignItems: 'center' },
  searchWrapper: { position: 'relative', display: 'flex', alignItems: 'center' },
  searchIcon: { position: 'absolute', left: '14px', color: '#94a3b8' },
  searchInput: { padding: '10px 15px 10px 42px', borderRadius: '10px', border: '1px solid #e2e8f0', width: '220px', fontSize: '14px', outline: 'none' },
  dateInput: { padding: '10px 15px', borderRadius: '10px', border: '1px solid #e2e8f0', fontWeight: '700', color: '#1e293b' },
  syncBtn: { backgroundColor: 'white', border: '1px solid #e2e8f0', padding: '10px', borderRadius: '10px', cursor: 'pointer' },
  summaryContainer: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '30px' },
  card: { backgroundColor: 'white', padding: '20px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '16px', border: '1px solid #e2e8f0' },
  iconBox: { padding: '12px', borderRadius: '12px' },
  cardLabel: { margin: 0, fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' },
  cardVal: { margin: 0, fontSize: '20px', color: '#1e293b', fontWeight: '800' },
  mainExportBtn: { backgroundColor: '#1e293b', color: 'white', border: 'none', borderRadius: '16px', fontWeight: '800', cursor: 'pointer', display: 'flex', gap: '10px', alignItems: 'center', justifyContent: 'center' },
  tableCard: { backgroundColor: 'white', borderRadius: '20px', border: '1px solid #e2e8f0', overflow: 'hidden' },
  tableHeader: { padding: '20px 25px', borderBottom: '1px solid #f1f5f9' },
  tableTitle: { margin: 0, fontSize: '15px', fontWeight: '700', color: '#1e293b' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '15px 25px', textAlign: 'left', backgroundColor: '#f8fafc', color: '#64748b', fontSize: '11px', textTransform: 'uppercase', fontWeight: '800' },
  row: { borderBottom: '1px solid #f1f5f9' },
  td: { padding: '16px 25px', color: '#475569', fontSize: '14px' },
  nameTd: { padding: '16px 25px' },
  empName: { fontWeight: '700', color: '#0f172a' },
  paidDate: { fontSize: '10px', color: '#94a3b8' },
  advanceTd: { padding: '16px 25px', color: '#e11d48', fontWeight: '700' },
  netTd: { padding: '16px 25px', color: '#059669', fontWeight: '800', fontSize: '15px' },
  presentLabel: { backgroundColor: '#f1f5f9', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: '700' },
  statusPaid: { color: '#059669', fontSize: '11px', fontWeight: '800', background: '#dcfce7', padding: '4px 10px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '4px' },
  statusPending: { color: '#d97706', fontSize: '11px', fontWeight: '800', background: '#fef3c7', padding: '4px 10px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '4px' },
  btnGrp: { display: 'flex', gap: '8px', alignItems: 'center' },
  payBtn: { backgroundColor: '#2563eb', color: 'white', border: 'none', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '11px' },
  miniBtn: { backgroundColor: 'white', border: '1px solid #e2e8f0', padding: '8px', borderRadius: '8px', cursor: 'pointer', color: '#64748b' },
  lockedContainer: { color: '#94a3b8', fontSize: '10px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '4px', border: '1px solid #e2e8f0', padding: '8px 12px', borderRadius: '8px' },
  noData: { padding: '80px', textAlign: 'center', color: '#94a3b8' }
};

export default SalaryReport;
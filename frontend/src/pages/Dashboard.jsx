import React, { useState, useEffect, useMemo } from "react";
import api from "../api"; 
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area 
} from "recharts";
import { 
  TrendingUp, Fuel, DollarSign, ArrowUpRight, ArrowDownRight, 
  Activity, Zap, Calendar 
} from "lucide-react";



const Dashboard = () => {
  const [stats, setStats] = useState({ 
    totalSales: 0, petrolTotal: 0, dieselTotal: 0, chartData: [], rawData: [] 
  });
  const [loading, setLoading] = useState(true);

const fetchDashboardData = async () => {
  try {
    const clientId = localStorage.getItem("client_id");
    if (!clientId) return; // Bina ID ke call mat karo

    const res = await api.get(`/get-sales/?client_id=${clientId}`);
    const data = res.data || [];

    if (data.length === 0) {
      setLoading(false);
      return;
    }

    let pTotal = 0, dTotal = 0, revenue = 0;
    
    // Reverse trend calculation (sirf last 10 records)
    const trend = [...data].reverse().slice(0, 10).map(item => {
      revenue += item.total_amount || 0;
      // Nozzle check (string handling safe banayi hai)
      if (item.nozzle?.toLowerCase().includes("petrol")) pTotal += item.actual_sale;
      else dTotal += item.actual_sale;
      
      return { 
        name: new Date(item.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }), 
        liters: item.actual_sale,
        revenue: item.total_amount 
      };
    });

    setStats({
      totalSales: revenue,
      petrolTotal: pTotal,
      dieselTotal: dTotal,
      chartData: trend, // Reverse karke bheja hai toh yahan direct use karo
      rawData: data
    });
  } catch (err) { 
    console.error("Dashboard fetch error:", err); 
  } finally {
    setLoading(false);
  }
};

  useEffect(() => { fetchDashboardData(); }, []);

  const COLORS = ["#3b82f6", "#f59e0b"]; // Blue for Petrol, Orange for Diesel
  
  const pieData = useMemo(() => [
    { name: "Petrol", value: stats.petrolTotal },
    { name: "Diesel", value: stats.dieselTotal }
  ], [stats]);

  if (loading) return <div style={styles.loader}>Analyzing Business Data...</div>;

  return (
    <div style={styles.container}>
      {/* --- HEADER --- */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Business Overview</h1>
          <p style={styles.subtitle}>Real-time fuel sales analytics</p>
        </div>
        <div style={styles.dateBadge}>
          <Calendar size={16} /> {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      </div>

      {/* --- EXECUTIVE STATS --- */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={{...styles.iconWrapper, background: '#ecfdf5'}}>
            <DollarSign color="#10b981" size={24} />
          </div>
          <div>
            <p style={styles.statLabel}>Total Revenue</p>
            <h3 style={styles.statValue}>₹{stats.totalSales.toLocaleString('en-IN')}</h3>
            <span style={styles.trendUp}><ArrowUpRight size={14}/> 12% vs last week</span>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={{...styles.iconWrapper, background: '#eff6ff'}}>
            <Fuel color="#3b82f6" size={24} />
          </div>
          <div>
            <p style={styles.statLabel}>Petrol (MS)</p>
            <h3 style={styles.statValue}>{stats.petrolTotal.toFixed(2)} <small>Ltr</small></h3>
            <span style={styles.trendUp}><ArrowUpRight size={14}/> +5.2%</span>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={{...styles.iconWrapper, background: '#fff7ed'}}>
            <Zap color="#f59e0b" size={24} />
          </div>
          <div>
            <p style={styles.statLabel}>Diesel (HSD)</p>
            <h3 style={styles.statValue}>{stats.dieselTotal.toFixed(2)} <small>Ltr</small></h3>
            <span style={styles.trendDown}><ArrowDownRight size={14}/> -2.1%</span>
          </div>
        </div>
      </div>

      {/* --- MAIN CHARTS --- */}
      <div style={styles.chartGrid}>
        <div style={styles.mainChart}>
          <div style={styles.chartHeader}>
            <h4 style={styles.chartTitle}><TrendingUp size={18}/> Sales Performance Trend</h4>
            <select style={styles.chartFilter}><option>Last 10 Records</option></select>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={stats.chartData}>
              <defs>
                <linearGradient id="colorLiters" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} tick={{fill: '#64748b'}} dy={10} />
              <YAxis axisLine={false} tickLine={false} fontSize={12} tick={{fill: '#64748b'}} />
              <Tooltip contentStyle={styles.tooltipCustom} />
              <Area type="monotone" dataKey="liters" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorLiters)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div style={styles.sideChart}>
          <h4 style={styles.chartTitle}>Fuel Mix Ratio</h4>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={pieData} innerRadius={70} outerRadius={90} paddingAngle={8} dataKey="value">
                {pieData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div style={styles.legendGrid}>
            <div style={styles.legendItem}><span style={{...styles.dot, background: '#3b82f6'}}></span> Petrol</div>
            <div style={styles.legendItem}><span style={{...styles.dot, background: '#f59e0b'}}></span> Diesel</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- STYLES (Keep as is) ---
const styles = {
  container: { padding: "40px", backgroundColor: "#f8fafc", minHeight: "100vh", fontFamily: "'Inter', sans-serif" },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '35px' },
  title: { fontSize: '28px', fontWeight: '900', color: '#0f172a', margin: 0 },
  subtitle: { color: '#64748b', margin: '4px 0 0 0', fontSize: '14px' },
  dateBadge: { background: 'white', padding: '10px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '600', color: '#475569' },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "25px", marginBottom: "35px" },
  statCard: { backgroundColor: "white", padding: "24px", borderRadius: "20px", display: 'flex', alignItems: 'center', gap: '20px', boxShadow: "0 1px 3px rgba(0,0,0,0.05)", border: '1px solid #e2e8f0' },
  iconWrapper: { padding: '15px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  statLabel: { margin: 0, fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' },
  statValue: { margin: '4px 0', fontSize: '24px', fontWeight: '900', color: '#0f172a' },
  trendUp: { fontSize: '12px', fontWeight: '700', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' },
  trendDown: { fontSize: '12px', fontWeight: '700', color: '#e11d48', display: 'flex', alignItems: 'center', gap: '4px' },
  chartGrid: { display: "grid", gridTemplateColumns: "2fr 1fr", gap: "25px" },
  mainChart: { backgroundColor: "white", padding: "30px", borderRadius: "24px", border: '1px solid #e2e8f0', boxShadow: "0 10px 15px -3px rgba(0,0,0,0.05)" },
  sideChart: { backgroundColor: "white", padding: "30px", borderRadius: "24px", border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  chartHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' },
  chartTitle: { margin: 0, fontSize: '16px', fontWeight: '800', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '10px' },
  chartFilter: { padding: '6px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px', fontWeight: '600', color: '#64748b', outline: 'none' },
  tooltipCustom: { borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', padding: '10px' },
  legendGrid: { display: 'flex', gap: '20px', marginTop: '20px' },
  legendItem: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '600', color: '#475569' },
  dot: { width: '8px', height: '8px', borderRadius: '50%' },
  loader: { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: '700', color: '#3b82f6' }
};

export default Dashboard;
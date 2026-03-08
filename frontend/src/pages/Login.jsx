  import React, { useState } from "react";
  import { useNavigate } from "react-router-dom";

  const Login = ({ setAuth }) => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();

const handleLogin = async (e) => {
    e.preventDefault();
    try {
        // Hardcoded URL daal kar check karo
       const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password })
      });

        const data = await res.json();

        if (res.status === 200) {
            localStorage.setItem("client_id", data.client_id);
            navigate("/dashboard");
        } else {
            alert("Login Failed: " + (data.detail || "Invalid Credentials"));
        }
    } catch (error) {
        console.error("Fetch Error:", error);
        alert("Server se connect nahi ho pa raha. Terminal check karo!");
    }
};

    return (
      <div style={styles.pageWrapper}>
        <div style={styles.loginCard}>
          
          {/* LEFT SIDE: Image/Branding Section */}
          <div style={styles.leftSection}>
            <div style={styles.overlay}>
              <div style={styles.logoCircle}>⛽</div>
              <h1 style={styles.brandTitle}>PetroDesk</h1>
              <p style={styles.brandTagline}>Smart Management for Your Fuel Station</p>
            </div>
          </div>

          {/* RIGHT SIDE: Login Form Section */}
          <div style={styles.rightSection}>
            <div style={styles.formContainer}>
              <h2 style={styles.welcomeText}>Welcome Back</h2>
              <p style={styles.subText}>Please enter your details to login</p>
              
              <form onSubmit={handleLogin} style={styles.form}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Username</label>
                  <input 
                    type="text" 
                    placeholder="Enter username" 
                    value={username} 
                    onChange={(e)=>setUsername(e.target.value)} 
                    required 
                    style={styles.input} 
                  />
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Password</label>
                  <input 
                    type="password" 
                    placeholder="••••••••" 
                    value={password} 
                    onChange={(e)=>setPassword(e.target.value)} 
                    required 
                    style={styles.input} 
                  />
                </div>

                <button type="submit" style={styles.button}>
                  Sign In
                </button>
              </form>

              <p style={styles.footerText}>© 2026 PetroDesk Systems</p>
            </div>
          </div>

        </div>
      </div>
    );
  };

  const styles = {
    pageWrapper: {
      width: "100vw", 
      height: "100vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      background: "#f8fafc", // Light gray background
      fontFamily: "'Inter', sans-serif",
    },
    loginCard: {
      display: "flex",
      width: "900px",
      height: "550px",
      background: "#fff",
      borderRadius: "20px",
      boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
      overflow: "hidden",
    },
    leftSection: {
      flex: 1,
      background: "linear-gradient(135deg, #1e293b 0%, #334155 100%)", // Dark blue-gray gradient
      position: "relative",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      textAlign: "center",
      color: "white",
    },
    overlay: {
      padding: "40px",
    },
    logoCircle: {
      width: "70px",
      height: "70px",
      background: "rgba(255, 255, 255, 0.1)",
      borderRadius: "50%",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      fontSize: "35px",
      margin: "0 auto 20px",
      backdropFilter: "blur(10px)",
      border: "1px solid rgba(255, 255, 255, 0.2)",
    },
    brandTitle: { fontSize: "32px", fontWeight: "800", margin: "0", letterSpacing: "1px" },
    brandTagline: { fontSize: "14px", opacity: "0.8", marginTop: "10px" },
    
    rightSection: {
      flex: 1.2,
      padding: "50px",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
    },
    formContainer: { maxWidth: "320px", margin: "0 auto", width: "100%" },
    welcomeText: { fontSize: "28px", fontWeight: "700", color: "#1e293b", margin: "0 0 8px 0" },
    subText: { fontSize: "14px", color: "#64748b", marginBottom: "30px" },
    
    form: { display: "flex", flexDirection: "column", gap: "20px" },
    inputGroup: { display: "flex", flexDirection: "column", gap: "6px" },
    label: { fontSize: "13px", fontWeight: "600", color: "#475569" },
    input: {
      padding: "12px 16px",
      borderRadius: "8px",
      border: "1px solid #e2e8f0",
      fontSize: "14px",
      outline: "none",
      transition: "all 0.2s",
      background: "#f1f5f9",
    },
    button: {
      marginTop: "10px",
      padding: "14px",
      background: "#3b82f6",
      color: "white",
      border: "none",
      borderRadius: "8px",
      fontSize: "16px",
      fontWeight: "600",
      cursor: "pointer",
      transition: "background 0.3s",
    },
    footerText: { textAlign: "center", marginTop: "40px", fontSize: "12px", color: "#94a3b8" }
  };

  export default Login;
import axios from 'axios';

const api = axios.create({
    // .env file mein base URL set karo, warna localhost default rahega
    baseURL: "https://petrodesk-backend.onrender.com",
});

// Interceptor: Automatic client_id header/params mein daalne ke liye
api.interceptors.request.use((config) => {
    const clientId = localStorage.getItem("client_id");
    if (clientId) {
        // Query params mein client_id attach karna
        config.params = { ...config.params, client_id: clientId };
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});


export default api;

import axios from "axios";

const API = axios.create({
    baseURL: "http://localhost:8081",
});

API.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
});

API.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401 || error.response?.status === 403) {
            localStorage.removeItem("token");
            localStorage.removeItem("role");
            localStorage.removeItem("stationName");
            localStorage.removeItem("username");
            localStorage.removeItem("fullName");
            localStorage.removeItem("trainNumber");
        }
        return Promise.reject(error);
    }
);

export default API;

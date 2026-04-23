import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:3000',
    // baseURL: 'http://ipconfig de su computadora:3000',
     //se tiene que cambiar por la ip que se va a ustilizar para conectarse al backend
    headers: { 'Content-Type': 'application/json' },
});

// agregar el token automaticamente en cada peticion 
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Si el token vence, redirige al login
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401){
            localStorage.removeItem('token');
            localStorage.removeItem('usuario');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;
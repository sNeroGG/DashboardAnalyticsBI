import axios from 'axios'

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || '/api',
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
})

// Request interceptor to add JWT token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('bi_token')
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('bi_token')
            window.location.href = '/login'
        }
        return Promise.reject(error)
    }
)

export default api

// API functions
export const authAPI = {
    login: (username: string, password: string) =>
        api.post('/auth/login', { username, password }),
}

export const dashboardAPI = {
    getMasters: () => api.get('/bi/masters'),
    getReportVentas: (payload: any) => api.post('/bi/report/ventas', payload),
}

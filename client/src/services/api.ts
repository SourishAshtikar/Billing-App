import axios from 'axios';

const API_URL = '/api';

const api = axios.create({
    baseURL: API_URL,
    withCredentials: true, // Important for cookies (JWT)
    headers: {
        'Content-Type': 'application/json',
    },
});

// Auth
export const auth = {
    login: (credentials: any) => api.post('/auth/login', credentials),
    register: (data: any) => api.post('/auth/register', data),
    logout: () => api.post('/auth/logout'),
    changePassword: (currentPassword: string, newPassword: string) => api.put('/auth/update-password', { currentPassword, newPassword }),
    getMe: () => api.get('/auth/me'),
};

// Projects
export const projects = {
    getAll: () => api.get('/projects'),
    getById: (id: string) => api.get(`/projects/${id}`),
    create: (data: any) => api.post('/projects', data),
    update: (id: string, data: any) => api.put(`/projects/${id}`, data),
    delete: (id: string) => api.delete(`/projects/${id}`),
    removeResource: (projectId: string, userId: string) =>
        api.delete(`/projects/${projectId}/resources/${userId}`),
};

// Resources
export const resources = {
    assign: (data: any) => api.post('/resources/assign', data),
    getAll: () => api.get('/resources'),
    create: (data: any) => api.post('/resources', data),
    update: (id: string, data: any) => api.put(`/resources/${id}`, data),
    delete: (id: string) => api.delete(`/resources/${id}`),
    bulkImport: (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post('/resources/bulk-import', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },
    getWorkingDays: (id: string, month: number, year: number) =>
        api.get(`/resources/${id}/working-days`, { params: { month, year } }),
};

// Leaves
export const leaves = {
    apply: (data: any) => api.post('/leaves', data),
    getMyLeaves: () => api.get('/leaves/my'),
};

// Billing
export const billing = {
    getProjectStats: (id: string, month?: number, year?: number, period?: 'MONTH' | 'YTD') =>
        api.get(`/billing/stats/project/${id}`, { params: { month, year, period } }),
    getOverview: (month?: number, year?: number) =>
        api.get('/billing/stats/overview', { params: { month, year } }),
    getAnnualReport: (year: number, projectId?: string) =>
        api.get('/billing/stats/annual', { params: { year, projectId } }),
    getResourceStats: (month?: number, year?: number) =>
        api.get('/billing/my-stats', { params: { month, year } }),
};

export default api;

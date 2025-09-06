import axios from 'axios';
import { getAuthHeaders, clearAuthData } from './auth';

// Spring Boot 서버 URL (개발 환경)
const API_BASE_URL = 'http://localhost:8080/api';

// Axios 기본 설정
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
});

// 요청 인터셉터 - 모든 요청에 인증 헤더 추가
apiClient.interceptors.request.use(
    (config) => {
        const headers = getAuthHeaders();
        config.headers = { ...config.headers, ...headers };
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// 응답 인터셉터 - 401 에러 시 로그아웃 처리
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            clearAuthData();
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// 인증 API
export const authAPI = {
    login: async (credentials) => {
        const response = await apiClient.post('/auth/login', credentials);
        return response.data;
    },

    register: async (userData) => {
        const response = await apiClient.post('/auth/register', userData);
        return response.data;
    }
};

// 공연장 API
export const venueAPI = {
    getAll: async () => {
        const response = await apiClient.get('/venues');
        return response.data;
    },

    getById: async (id) => {
        const response = await apiClient.get(`/venues/${id}`);
        return response.data;
    },

    create: async (venueData) => {
        const response = await apiClient.post('/venues', venueData);
        return response.data;
    },

    update: async (id, venueData) => {
        const response = await apiClient.put(`/venues/${id}`, venueData);
        return response.data;
    },

    updateSeatStructure: async (id, seatStructureData) => {
        const response = await apiClient.put(`/venues/${id}/seat-structure`, seatStructureData);
        return response.data;
    },

    delete: async (id) => {
        const response = await apiClient.delete(`/venues/${id}`);
        return response.data;
    },

    search: async (searchData) => {
        const response = await apiClient.post('/venues/search', searchData);
        return response.data;
    },

    getActive: async () => {
        const response = await apiClient.get('/venues/active');
        return response.data;
    },

    getStatistics: async () => {
        const response = await apiClient.get('/venues/statistics');
        return response.data;
    },

    checkName: async (name) => {
        const response = await apiClient.get(`/venues/check-name?name=${encodeURIComponent(name)}`);
        return response.data;
    }
};

// 좌석 배치 API
export const seatLayoutAPI = {
    getByVenue: async (venueId) => {
        const response = await apiClient.get(`/venues/${venueId}/seat-layouts`);
        return response.data;
    },

    getActiveByVenue: async (venueId) => {
        const response = await apiClient.get(`/venues/${venueId}/seat-layouts/active`);
        return response.data;
    },

    getSeatMap: async (venueId) => {
        const response = await apiClient.get(`/venues/${venueId}/seat-map`);
        return response.data;
    },

    create: async (seatLayoutData) => {
        const response = await apiClient.post('/seat-layouts', seatLayoutData);
        return response.data;
    },

    createBulk: async (bulkData) => {
        const response = await apiClient.post('/seat-layouts/bulk', bulkData);
        return response.data;
    },

    update: async (id, seatLayoutData) => {
        const response = await apiClient.put(`/seat-layouts/${id}`, seatLayoutData);
        return response.data;
    },

    delete: async (id) => {
        const response = await apiClient.delete(`/seat-layouts/${id}`);
        return response.data;
    },

    deleteAllForVenue: async (venueId) => {
        const response = await apiClient.delete(`/venues/${venueId}/seat-layouts`);
        return response.data;
    },

    autoGenerate: async (venueId) => {
        const response = await apiClient.post(`/venues/${venueId}/seat-layouts/auto-generate`);
        return response.data;
    },

    getStatistics: async (venueId) => {
        const response = await apiClient.get(`/venues/${venueId}/seat-statistics`);
        return response.data;
    }
};

// 공연 API
export const performanceAPI = {
    getAll: async () => {
        const response = await apiClient.get('/performances');
        return response.data;
    },

    getById: async (id) => {
        const response = await apiClient.get(`/performances/${id}`);
        return response.data;
    },

    create: async (performanceData) => {
        const response = await apiClient.post('/performances', performanceData);
        return response.data;
    },

    update: async (id, performanceData) => {
        const response = await apiClient.put(`/performances/${id}`, performanceData);
        return response.data;
    },

    delete: async (id) => {
        const response = await apiClient.delete(`/performances/${id}`);
        return response.data;
    }
};

// 좌석 API
export const seatAPI = {
    getByPerformance: async (performanceId) => {
        const response = await apiClient.get(`/performances/${performanceId}/seats`);
        return response.data;
    }
};

// 예매 API
export const bookingAPI = {
    create: async (bookingData) => {
        const response = await apiClient.post('/bookings', bookingData);
        return response.data;
    },

    getMyBookings: async () => {
        const response = await apiClient.get('/bookings/my');
        return response.data;
    },

    cancel: async (bookingId) => {
        const response = await apiClient.delete(`/bookings/${bookingId}`);
        return response.data;
    }
};

export default apiClient;

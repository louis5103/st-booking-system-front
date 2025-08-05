// JWT 토큰 관리 및 인증 관련 함수들

export const isAuthenticated = () => {
    const token = localStorage.getItem('token');
    if (!token) return false;

    try {
        // JWT 토큰 만료 확인 (간단한 버전)
        const payload = JSON.parse(atob(token.split('.')[1]));
        const currentTime = Date.now() / 1000;

        if (payload.exp < currentTime) {
            localStorage.removeItem('token');
            localStorage.removeItem('userRole');
            return false;
        }

        return true;
    } catch (error) {
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        return false;
    }
};

export const getToken = () => {
    return localStorage.getItem('token');
};

export const getUserRole = () => {
    return localStorage.getItem('userRole');
};

export const setAuthData = (token, role) => {
    localStorage.setItem('token', token);
    localStorage.setItem('userRole', role);
};

export const clearAuthData = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
};

export const getAuthHeaders = () => {
    const token = getToken();
    return token ? {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    } : {
        'Content-Type': 'application/json'
    };
};
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { setAuthData } from '../services/auth';

const LoginPage = ({ onLogin }) => {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError(''); // 입력 시 에러 메시지 클리어
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await authAPI.login(formData);

            // JWT 토큰과 사용자 역할 저장
            setAuthData(response.token, response.role);

            // 부모 컴포넌트에 로그인 상태 전달
            onLogin({
                isLoggedIn: true,
                role: response.role
            });

            // 관리자면 관리자 페이지로, 일반 사용자면 메인 페이지로
            if (response.role === 'ROLE_ADMIN') {
                navigate('/admin');
            } else {
                navigate('/');
            }
        } catch (error) {
            console.error('Login error:', error);
            if (error.response?.status === 401) {
                setError('이메일 또는 비밀번호가 잘못되었습니다.');
            } else {
                setError('로그인 중 오류가 발생했습니다. 다시 시도해주세요.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-container">
                <h2>로그인</h2>

                {error && <div className="error-message">{error}</div>}

                <form onSubmit={handleSubmit} className="login-form">
                    <div className="form-group">
                        <label htmlFor="email">이메일</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            placeholder="이메일을 입력하세요"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">비밀번호</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            placeholder="비밀번호를 입력하세요"
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary btn-full"
                        disabled={loading}
                    >
                        {loading ? '로그인 중...' : '로그인'}
                    </button>
                </form>

                <div className="login-links">
                    <p>
                        계정이 없으신가요?
                        <Link to="/register" className="link"> 회원가입</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
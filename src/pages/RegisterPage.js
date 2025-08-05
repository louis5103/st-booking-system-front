import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';

const RegisterPage = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        name: '',
        phone: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError('');
        setSuccess('');
    };

    const validateForm = () => {
        if (formData.password !== formData.confirmPassword) {
            setError('비밀번호가 일치하지 않습니다.');
            return false;
        }

        if (formData.password.length < 6) {
            setError('비밀번호는 최소 6자 이상이어야 합니다.');
            return false;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            setError('유효한 이메일 주소를 입력해주세요.');
            return false;
        }

        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        setLoading(true);
        setError('');

        try {
            const registerData = {
                email: formData.email,
                password: formData.password,
                name: formData.name,
                phone: formData.phone,
                role: 'ROLE_USER' // 기본적으로 일반 사용자로 등록
            };

            await authAPI.register(registerData);

            setSuccess('회원가입이 완료되었습니다. 로그인 페이지로 이동합니다.');

            // 2초 후 로그인 페이지로 이동
            setTimeout(() => {
                navigate('/login');
            }, 2000);

        } catch (error) {
            console.error('Register error:', error);
            if (error.response?.status === 409) {
                setError('이미 존재하는 이메일입니다.');
            } else {
                setError('회원가입 중 오류가 발생했습니다. 다시 시도해주세요.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="register-page">
            <div className="register-container">
                <h2>회원가입</h2>

                {error && <div className="error-message">{error}</div>}
                {success && <div className="success-message">{success}</div>}

                <form onSubmit={handleSubmit} className="register-form">
                    <div className="form-group">
                        <label htmlFor="name">이름</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            placeholder="이름을 입력하세요"
                        />
                    </div>

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
                        <label htmlFor="phone">전화번호</label>
                        <input
                            type="tel"
                            id="phone"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            required
                            placeholder="전화번호를 입력하세요"
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
                            placeholder="비밀번호를 입력하세요 (최소 6자)"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="confirmPassword">비밀번호 확인</label>
                        <input
                            type="password"
                            id="confirmPassword"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                            placeholder="비밀번호를 다시 입력하세요"
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary btn-full"
                        disabled={loading}
                    >
                        {loading ? '가입 중...' : '회원가입'}
                    </button>
                </form>

                <div className="register-links">
                    <p>
                        이미 계정이 있으신가요?
                        <Link to="/login" className="link"> 로그인</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;
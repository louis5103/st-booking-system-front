import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Header = ({ user, onLogout }) => {
    const navigate = useNavigate();

    const handleLogout = () => {
        onLogout();
        navigate('/');
    };

    return (
        <header className="header">
            <div className="header-container">
                <Link to="/" className="logo">
                    <h1>ST 통합예매관리시스템</h1>
                </Link>

                <nav className="nav">
                    <Link to="/" className="nav-link">공연목록</Link>

                    {user?.isLoggedIn ? (
                        <>
                            <Link to="/my-bookings" className="nav-link">내 예매내역</Link>
                            {user.role === 'ROLE_ADMIN' && (
                                <Link to="/admin" className="nav-link">관리자</Link>
                            )}
                            <button onClick={handleLogout} className="nav-link logout-btn">
                                로그아웃
                            </button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="nav-link">로그인</Link>
                            <Link to="/register" className="nav-link">회원가입</Link>
                        </>
                    )}
                </nav>
            </div>
        </header>
    );
};

export default Header;
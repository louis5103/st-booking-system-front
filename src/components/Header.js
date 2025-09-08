import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Header = ({ user, onLogout }) => {
    const navigate = useNavigate();

    const handleLogout = () => {
        onLogout();
        navigate('/');
    };

    // CSS 디버깅을 위한 인라인 스타일 백업
    const headerStyle = {
        background: 'linear-gradient(135deg, #2c3e50, #3498db)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        borderBottom: '3px solid #e74c3c',
        width: '100%',
        margin: 0,
        padding: 0
    };

    const containerStyle = {
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '0 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        minHeight: '70px',
        width: '100%',
        boxSizing: 'border-box'
    };

    const logoStyle = {
        textDecoration: 'none',
        color: 'white'
    };

    const navStyle = {
        display: 'flex',
        alignItems: 'center',
        gap: '1.5rem'
    };

    const linkStyle = {
        color: 'white',
        textDecoration: 'none',
        padding: '0.75rem 1.25rem',
        borderRadius: '25px',
        fontWeight: '500',
        border: '2px solid transparent',
        background: 'none',
        cursor: 'pointer',
        fontSize: '1rem'
    };

    return (
        <header className="header" style={headerStyle}>
            <div className="header-container" style={containerStyle}>
                <Link to="/" className="logo" style={logoStyle}>
                    <h1 style={{margin: 0, fontSize: '1.8rem', fontWeight: 'bold', textShadow: '2px 2px 4px rgba(0,0,0,0.3)', color: 'white'}}>ST 통합예매관리시스템</h1>
                </Link>

                <nav className="nav" style={navStyle}>
                    <Link to="/" className="nav-link" style={linkStyle}>공연목록</Link>

                    {user?.isLoggedIn ? (
                        <>
                            <Link to="/my-bookings" className="nav-link" style={linkStyle}>내 예매내역</Link>
                            {user.role === 'ROLE_ADMIN' && (
                                <Link to="/admin" className="nav-link" style={linkStyle}>관리자</Link>
                            )}
                            <button 
                                onClick={handleLogout} 
                                className="nav-link logout-btn"
                                style={{...linkStyle, backgroundColor: '#e74c3c', border: '2px solid #c0392b'}}
                            >
                                로그아웃
                            </button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="nav-link" style={linkStyle}>로그인</Link>
                            <Link to="/register" className="nav-link" style={linkStyle}>회원가입</Link>
                        </>
                    )}
                </nav>
            </div>
        </header>
    );
};

export default Header;
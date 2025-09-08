import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Header = ({ user, onLogout }) => {
    const navigate = useNavigate();

    const handleLogout = () => {
        onLogout();
        navigate('/');
    };

    // 서울과학기술대학교 컴러 스키 인라인 스타일
    const headerStyle = {
        background: 'linear-gradient(135deg, #003876 0%, #1B5F96 50%, #003876 100%)',
        boxShadow: '0 4px 12px rgba(0,56,118,0.3)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        borderBottom: '4px solid #C41E3A',
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
                    <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
                        <img 
                            src="/assets/seoultech-logo.svg" 
                            alt="서울과학기술대학교 로고" 
                            style={{height: '50px', width: '50px'}}
                        />
                        <div>
                            <h1 style={{margin: 0, fontSize: '1.6rem', fontWeight: 'bold', textShadow: '2px 2px 4px rgba(0,0,0,0.3)', color: 'white', lineHeight: '1.2'}}>서울과학기술대학교</h1>
                            <p style={{margin: 0, fontSize: '0.9rem', color: '#E8F4FD', opacity: 0.9}}>통합예매관리시스템</p>
                        </div>
                    </div>
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
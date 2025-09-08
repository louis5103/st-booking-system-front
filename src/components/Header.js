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
                        {/* 서울과학기술대학교 공식 로고 Base64 */}
                        <img 
                            src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCAyMDAgMjAwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgogIDwhLS0g7Lik6rCdIOybkCDrsLDqsr0gLS0+CiAgPGNpcmNsZSBjeD0iMTAwIiBjeT0iMTAwIiByPSI5OCIgZmlsbD0id2hpdGUiIHN0cm9rZT0iIzAwMzg3NiIgc3Ryb2tlLXdpZHRoPSIzIi8+CiAgCiAgPCEtLSDsg4Hsm5Ag7ZWc6riAIO2fleuKpOu5hCAo6rOh7ISgKSAtLT4KICA8ZGVmcz4KICAgIDxwYXRoIGlkPSJ0b3AtY3VydmUiIGQ9Ik0gMzAgNjAgUSAxMDAgMjUgMTcwIDYwIi8+CiAgPC9kZWZzPgogIDx0ZXh0IGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxMiIgZmlsbD0iIzAwMzg3NiIgZm9udC13ZWlnaHQ9ImJvbGQiPgogICAgPHRleHRQYXRoIGhyZWY9IiN0b3AtY3VydmUiIHN0YXJ0T2Zmc2V0PSI1MCUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPgogICAgICDshJzsmrjqs7zthZnquLDsiKDrjIDtlZnqtZAKICAgIDwvdGV4dFBhdGg+CiAgPC90ZXh0PgogIAogIDwhLS0g7ZWY64uo7JWBIOusuO2FheuKpOu5hCAo6rOh7ISgKSAtLT4KICA8ZGVmcz4KICAgIDxwYXRoIGlkPSJib3R0b20tY3VydmUiIGQ9Ik0gMjUgMTQwIFEgMTAwIDE3NSAxNzUgMTQwIi8+CiAgPC9kZWZzPgogIDx0ZXh0IGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSI4IiBmaWxsPSIjMDAzODc2IiBmb250LXdlaWdodD0iYm9sZCI+CiAgICA8dGV4dFBhdGggaHJlZj0iI2JvdHRvbS1jdXJ2ZSIgc3RhcnRPZmZzZXQ9IjUwJSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+CiAgICAgIFNFT1VsIE5BVElPTkFsIFVOSVYuIE9GIFNDSUVOQ0UgJmFtcDsgVEVDSE5PTE9HWQogICAgPC90ZXh0UGF0aD4KICA8L3RleHQ+CiAgCiAgPCEtLSDspJnslZkg7Jes7J6Q6rCA6riAIOuhnOqzoCAtLT4KICA8ZyB0cmFuc2Zvcm09InRyYW5zbGF0ZSgxMDAsMTAwKSI+CiAgICA8IS0tIOu5qOqwhOyDiSDsg4Hsm5Ag67aA67aEIC0tPgogICAgPHJlY3QgeD0iLTIwIiB5PSItMjUiIHdpZHRoPSI0MCIgaGVpZ2h0PSIxNSIgZmlsbD0iI0M0MUUzQSIvPgogICAgCiAgICA8IS0tIO2MjOuCrOyDiSDsoJzsuKEg67aA67aEIC0tPgogICAgPHJlY3QgeD0iLTM1IiB5PSItMTAiIHdpZHRoPSIxNSIgaGVpZ2h0PSI0MCIgZmlsbD0iIzAwMzg3NiIvPgogICAgCiAgICA8IS0tIO2ajOyDiSDsmrDsuKEg67aA67aEIC0tPgogICAgPHJlY3QgeD0iMjAiIHk9Ii0xMCIgd2lkdGg9IjE1IiBoZWlnaHQ9IjQwIiBmaWxsPSIjOEI4QjhCIi8+CiAgICAKICAgIDwhLS0g7Z2w7IOJ7JqpIOykkeyCrSDrtoDrtoQgLS0+CiAgICA8cmVjdCB4PSItMjAiIHk9Ii0xMCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjE1IiBmaWxsPSJ3aGl0ZSIvPgogIDwvZz4KICA8IS0tIO2VmOuLqCDsl7DrhowgLS0+CiAgPHRleHQgeD0iMTAwIiB5PSIxNzAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNiIgZmlsbD0iIzAwMzg3NiIgZm9udC13ZWlnaHQ9ImJvbGQiPjE5MTA8L3RleHQ+Cjwvc3ZnPg==" 
                            alt="서울과학기술대학교 로고" 
                            style={{
                                height: '50px', 
                                width: '50px',
                                filter: 'drop-shadow(0 2px 8px rgba(0,56,118,0.3))'
                            }}
                            onError={(e) => {
                                // Base64 로딩 실패시 fallback
                                e.target.style.display = 'none';
                                const fallback = e.target.nextElementSibling;
                                if (fallback) fallback.style.display = 'flex';
                            }}
                        />
                        {/* Fallback CSS 로고 */}
                        <div style={{
                            width: '50px',
                            height: '50px',
                            position: 'relative',
                            background: 'white',
                            borderRadius: '50%',
                            display: 'none',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '3px solid #003876',
                            boxShadow: '0 3px 12px rgba(0,56,118,0.3)'
                        }}>
                            <div style={{
                                fontSize: '18px',
                                color: '#003876',
                                fontWeight: 'bold'
                            }}>ST</div>
                        </div>
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
                                style={{...linkStyle, backgroundColor: '#C41E3A', border: '2px solid #A0171F', color: 'white'}}
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
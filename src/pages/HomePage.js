import React, { useState, useEffect } from 'react';
import PerformanceCard from '../components/PerformanceCard';
import { performanceAPI } from '../services/api';
import '../styles/DemoInfo.css';

const HomePage = () => {
    const [performances, setPerformances] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('date'); // date, title, price

    useEffect(() => {
        fetchPerformances();
    }, []);

    const fetchPerformances = async () => {
        try {
            setLoading(true);
            const data = await performanceAPI.getAll();
            setPerformances(data);
        } catch (error) {
            console.error('Error fetching performances:', error);
            setError('공연 목록을 불러오는 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    // 검색 및 정렬 로직
    const filteredAndSortedPerformances = React.useMemo(() => {
        let filtered = performances.filter(performance =>
            performance.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            performance.venue.toLowerCase().includes(searchTerm.toLowerCase())
        );

        // 정렬
        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'title':
                    return a.title.localeCompare(b.title);
                case 'price':
                    return a.price - b.price;
                case 'date':
                default:
                    return new Date(a.performanceDate) - new Date(b.performanceDate);
            }
        });

        return filtered;
    }, [performances, searchTerm, sortBy]);

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading">공연 목록을 불러오는 중...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="error-container">
                <div className="error-message">{error}</div>
                <button onClick={fetchPerformances} className="btn btn-primary">
                    다시 시도
                </button>
            </div>
        );
    }

    return (
        <div className="home-page">
            <div className="hero-section">
                <h1>ST 통합예매관리시스템</h1>
                <p>다양한 공연을 한 곳에서 쉽고 빠르게 예매하세요</p>
            </div>

            {/* 시연용 정보 섹션 */}
            <div className="demo-info-section">
                <div className="demo-header">
                    <h2>🎭 시연용 프로젝트 정보</h2>
                    <p>이 프로젝트는 <strong>Spring Boot</strong> 백엔드와 <strong>React</strong> 프론트엔드로 구성된 통합 예매 관리 시스템입니다.</p>
                </div>
                
                <div className="demo-cards">
                    <div className="demo-card">
                        <h3>📋 프로젝트 개요</h3>
                        <ul>
                            <li><strong>백엔드:</strong> Spring Boot + JPA + MySQL</li>
                            <li><strong>프론트엔드:</strong> React + React Router</li>
                            <li><strong>인증:</strong> JWT 토큰 기반</li>
                            <li><strong>주요 기능:</strong> 공연 예매, 좌석 선택, 사용자 관리</li>
                        </ul>
                    </div>
                    
                    <div className="demo-card">
                        <h3>👤 일반 사용자 계정</h3>
                        <div className="login-info">
                            <p><strong>이메일:</strong> user1@test.com</p>
                            <p><strong>비밀번호:</strong> user123</p>
                            <p><strong>권한:</strong> 공연 조회, 예매, 내 예매 관리</p>
                        </div>
                        <div className="login-info">
                            <p><strong>이메일:</strong> user2@test.com</p>
                            <p><strong>비밀번호:</strong> user123</p>
                            <p><strong>권한:</strong> 공연 조회, 예매, 내 예매 관리</p>
                        </div>
                    </div>
                    
                    <div className="demo-card">
                        <h3>👨‍💼 관리자 계정</h3>
                        <div className="login-info admin">
                            <p><strong>이메일:</strong> admin@st-booking.com</p>
                            <p><strong>비밀번호:</strong> admin123</p>
                            <p><strong>권한:</strong> 전체 시스템 관리, 공연 등록/수정/삭제, 사용자 관리</p>
                        </div>
                    </div>
                    
                    <div className="demo-card">
                        <h3>🎯 테스트 시나리오</h3>
                        <ol>
                            <li>일반 사용자로 로그인하여 공연 목록 확인</li>
                            <li>원하는 공연 선택 후 좌석 선택 및 예매</li>
                            <li>'내 예매' 메뉴에서 예매 내역 확인</li>
                            <li>관리자 계정으로 로그인하여 관리 기능 확인</li>
                            <li>새로운 공연 등록 및 예매 현황 관리</li>
                        </ol>
                    </div>
                </div>
                
                <div className="demo-features">
                    <h3>🚀 주요 구현 기능</h3>
                    <div className="features-grid">
                        <div className="feature">
                            <h4>🔐 사용자 인증</h4>
                            <p>JWT 토큰 기반 로그인/로그아웃, 역할별 권한 관리</p>
                        </div>
                        <div className="feature">
                            <h4>🎪 공연 관리</h4>
                            <p>공연 등록/수정/삭제, 검색 및 정렬 기능</p>
                        </div>
                        <div className="feature">
                            <h4>🪑 좌석 예매</h4>
                            <p>실시간 좌석 현황 확인, 좌석 선택 및 예매</p>
                        </div>
                        <div className="feature">
                            <h4>📊 관리 대시보드</h4>
                            <p>예매 통계, 사용자 관리, 공연장 관리</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="search-and-sort">
                <div className="search-container">
                    <input
                        type="text"
                        placeholder="공연명 또는 장소로 검색..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                </div>

                <div className="sort-container">
                    <label>정렬:</label>
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="sort-select"
                    >
                        <option value="date">공연일순</option>
                        <option value="title">제목순</option>
                        <option value="price">가격순</option>
                    </select>
                </div>
            </div>

            <div className="performances-section">
                <h2>공연 목록</h2>

                {filteredAndSortedPerformances.length === 0 ? (
                    <div className="no-performances">
                        {searchTerm ? '검색 결과가 없습니다.' : '등록된 공연이 없습니다.'}
                    </div>
                ) : (
                    <div className="performances-grid">
                        {filteredAndSortedPerformances.map(performance => (
                            <PerformanceCard
                                key={performance.id}
                                performance={performance}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default HomePage;
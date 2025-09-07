import React, { useState, useEffect } from 'react';
import PerformanceCard from '../components/PerformanceCard';
import { performanceAPI } from '../services/api';

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
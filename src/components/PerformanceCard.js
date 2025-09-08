import React from 'react';
import { Link } from 'react-router-dom';

const PerformanceCard = ({ performance, showAdminButtons = false, onEdit, onDelete }) => {
    const formatDate = (dateString) => {
        if (!dateString) return '일정 미정';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return '일정 미정';
            return date.toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            return '일정 미정';
        }
    };

    const formatPrice = (price) => {
        if (!price || isNaN(price)) return '0';
        return new Intl.NumberFormat('ko-KR').format(price);
    };

    // 공연 타입에 따른 아이콘과 색상 결정
    const getPerformanceStyle = (title) => {
        const lowerTitle = (title || '').toLowerCase();
        if (lowerTitle.includes('교향곡') || lowerTitle.includes('클래식') || lowerTitle.includes('베토벤')) {
            return {
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                icon: '🎼'
            };
        } else if (lowerTitle.includes('뮤지컬') || lowerTitle.includes('레미제라블')) {
            return {
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                icon: '🎭'
            };
        } else if (lowerTitle.includes('발레') || lowerTitle.includes('백조')) {
            return {
                background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                icon: '🩰'
            };
        } else {
            return {
                background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
                icon: '🎪'
            };
        }
    };

    const performanceStyle = getPerformanceStyle(performance.title);

    // 안전한 데이터 처리
    const title = performance.title || '제목 없음';
    const venue = performance.venue || performance.venueName || '장소 미정';
    const price = performance.price || 0;
    const totalSeats = performance.totalSeats || 0;
    const bookedSeats = performance.bookedSeats || 0;

    return (
        <div className="performance-card">
            <div className="performance-image">
                {performance.imageUrl ? (
                    <img 
                        src={performance.imageUrl} 
                        alt={performance.title}
                        onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextElementSibling.style.display = 'flex';
                        }}
                    />
                ) : null}
                <div 
                    className="performance-placeholder"
                    style={{
                        background: performanceStyle.background,
                        display: performance.imageUrl ? 'none' : 'flex'
                    }}
                >
                    <div className="placeholder-content">
                        <span className="placeholder-icon">{performanceStyle.icon}</span>
                        <span className="placeholder-text">{title}</span>
                    </div>
                </div>
            </div>

            <div className="performance-info">
                <h3 className="performance-title">{title}</h3>
                <p className="performance-venue">{venue}</p>
                <p className="performance-date">{formatDate(performance.performanceDate)}</p>
                <p className="performance-price">{formatPrice(price)}원</p>
                <p className="performance-seats">
                    잔여석: {totalSeats - bookedSeats}/{totalSeats}
                </p>
            </div>

            <div className="performance-actions">
                {!showAdminButtons ? (
                    <Link
                        to={`/booking/${performance.id}`}
                        className="btn btn-primary"
                        style={{
                            opacity: totalSeats === bookedSeats ? 0.5 : 1,
                            pointerEvents: totalSeats === bookedSeats ? 'none' : 'auto'
                        }}
                    >
                        {totalSeats === bookedSeats ? '매진' : '예매하기'}
                    </Link>
                ) : (
                    <div className="admin-buttons">
                        <button
                            onClick={() => onEdit(performance)}
                            className="btn btn-secondary"
                        >
                            수정
                        </button>
                        <button
                            onClick={() => onDelete(performance.id)}
                            className="btn btn-danger"
                        >
                            삭제
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PerformanceCard;
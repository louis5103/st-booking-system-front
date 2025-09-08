import React from 'react';
import { Link } from 'react-router-dom';

const PerformanceCard = ({ performance, showAdminButtons = false, onEdit, onDelete }) => {
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('ko-KR').format(price);
    };

    // 공연 타입에 따른 아이콘과 색상 결정
    const getPerformanceStyle = (title) => {
        const lowerTitle = title.toLowerCase();
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
                        <span className="placeholder-text">{performance.title}</span>
                    </div>
                </div>
            </div>

            <div className="performance-info">
                <h3 className="performance-title">{performance.title}</h3>
                <p className="performance-venue">{performance.venue}</p>
                <p className="performance-date">{formatDate(performance.performanceDate)}</p>
                <p className="performance-price">{formatPrice(performance.price)}원</p>
                <p className="performance-seats">
                    잔여석: {performance.totalSeats - performance.bookedSeats}/{performance.totalSeats}
                </p>
            </div>

            <div className="performance-actions">
                {!showAdminButtons ? (
                    <Link
                        to={`/booking/${performance.id}`}
                        className="btn btn-primary"
                        style={{
                            opacity: performance.totalSeats === performance.bookedSeats ? 0.5 : 1,
                            pointerEvents: performance.totalSeats === performance.bookedSeats ? 'none' : 'auto'
                        }}
                    >
                        {performance.totalSeats === performance.bookedSeats ? '매진' : '예매하기'}
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
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

    return (
        <div className="performance-card">
            <div className="performance-image">
                {performance.imageUrl ? (
                    <img src={performance.imageUrl} alt={performance.title} />
                ) : (
                    <div className="no-image">이미지 없음</div>
                )}
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
import React, { useState, useEffect } from 'react';
import { bookingAPI } from '../services/api';

const MyBookingsPage = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchMyBookings();
    }, []);

    const fetchMyBookings = async () => {
        try {
            setLoading(true);
            const data = await bookingAPI.getMyBookings();
            setBookings(data);
        } catch (error) {
            console.error('Error fetching bookings:', error);
            setError('예매 내역을 불러오는 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleCancelBooking = async (bookingId, performanceTitle, seatNumber) => {
        const confirmMessage = `${performanceTitle} - ${seatNumber} 예매를 취소하시겠습니까?`;

        if (!window.confirm(confirmMessage)) {
            return;
        }

        try {
            await bookingAPI.cancel(bookingId);
            alert('예매가 취소되었습니다.');
            fetchMyBookings(); // 목록 새로고침
        } catch (error) {
            console.error('Cancel booking error:', error);
            if (error.response?.status === 400) {
                alert('취소 기간이 지나거나 취소할 수 없는 예매입니다.');
            } else {
                alert('예매 취소 중 오류가 발생했습니다.');
            }
        }
    };

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

    const getStatusColor = (status) => {
        switch (status) {
            case 'CONFIRMED': return 'status-confirmed';
            case 'CANCELLED': return 'status-cancelled';
            default: return 'status-pending';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'CONFIRMED': return '예매 확정';
            case 'CANCELLED': return '예매 취소';
            default: return '처리 중';
        }
    };

    const canCancel = (booking) => {
        // 공연 시작 24시간 전까지만 취소 가능
        const performanceDate = new Date(booking.performance.performanceDate);
        const now = new Date();
        const timeDiff = performanceDate.getTime() - now.getTime();
        const hoursDiff = timeDiff / (1000 * 3600);

        return booking.status === 'CONFIRMED' && hoursDiff > 24;
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading">예매 내역을 불러오는 중...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="error-container">
                <div className="error-message">{error}</div>
                <button onClick={fetchMyBookings} className="btn btn-primary">
                    다시 시도
                </button>
            </div>
        );
    }

    return (
        <div className="my-bookings-page">
            <div className="page-header">
                <h1>내 예매내역</h1>
                <p>예매하신 공연 목록을 확인하실 수 있습니다.</p>
            </div>

            {bookings.length === 0 ? (
                <div className="no-bookings">
                    <p>예매 내역이 없습니다.</p>
                    <button onClick={() => window.location.href = '/'} className="btn btn-primary">
                        공연 보러 가기
                    </button>
                </div>
            ) : (
                <div className="bookings-list">
                    {bookings.map(booking => (
                        <div key={booking.id} className="booking-card">
                            <div className="booking-header">
                                <h3>{booking.performance.title}</h3>
                                <span className={`status ${getStatusColor(booking.status)}`}>
                  {getStatusText(booking.status)}
                </span>
                            </div>

                            <div className="booking-details">
                                <div className="detail-row">
                                    <span className="label">장소:</span>
                                    <span>{booking.performance.venue}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="label">공연일시:</span>
                                    <span>{formatDate(booking.performance.performanceDate)}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="label">좌석:</span>
                                    <span>{booking.seat.seatNumber}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="label">가격:</span>
                                    <span>{formatPrice(booking.performance.price)}원</span>
                                </div>
                                <div className="detail-row">
                                    <span className="label">예매일:</span>
                                    <span>{formatDate(booking.bookingDate)}</span>
                                </div>
                            </div>

                            <div className="booking-actions">
                                {canCancel(booking) && (
                                    <button
                                        onClick={() => handleCancelBooking(
                                            booking.id,
                                            booking.performance.title,
                                            booking.seat.seatNumber
                                        )}
                                        className="btn btn-danger"
                                    >
                                        예매 취소
                                    </button>
                                )}

                                {booking.status === 'CONFIRMED' && !canCancel(booking) && (
                                    <span className="cancel-notice">
                    공연 24시간 전까지만 취소 가능합니다.
                  </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MyBookingsPage;
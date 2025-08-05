import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SeatMap from '../components/SeatMap';
import { performanceAPI, seatAPI, bookingAPI } from '../services/api';

const BookingPage = () => {
    const { performanceId } = useParams();
    const navigate = useNavigate();

    const [performance, setPerformance] = useState(null);
    const [seats, setSeats] = useState([]);
    const [selectedSeats, setSelectedSeats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [bookingLoading, setBookingLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchPerformanceAndSeats();
    }, [performanceId]);

    const fetchPerformanceAndSeats = async () => {
        try {
            setLoading(true);

            // 공연 정보와 좌석 정보를 동시에 가져오기
            const [performanceData, seatsData] = await Promise.all([
                performanceAPI.getById(performanceId),
                seatAPI.getByPerformance(performanceId)
            ]);

            setPerformance(performanceData);
            setSeats(seatsData);
        } catch (error) {
            console.error('Error fetching data:', error);
            setError('공연 정보를 불러오는 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleBooking = async () => {
        if (selectedSeats.length === 0) {
            alert('좌석을 선택해주세요.');
            return;
        }

        const confirmMessage = `선택하신 좌석: ${selectedSeats.map(seat => seat.seatNumber).join(', ')}\n총 금액: ${(selectedSeats.length * performance.price).toLocaleString()}원\n\n예매하시겠습니까?`;

        if (!window.confirm(confirmMessage)) {
            return;
        }

        try {
            setBookingLoading(true);

            // 각 좌석에 대해 예매 요청
            const bookingPromises = selectedSeats.map(seat =>
                bookingAPI.create({
                    performanceId: parseInt(performanceId),
                    seatId: seat.id
                })
            );

            await Promise.all(bookingPromises);

            alert('예매가 완료되었습니다!');
            navigate('/my-bookings');

        } catch (error) {
            console.error('Booking error:', error);
            if (error.response?.status === 409) {
                alert('선택하신 좌석 중 이미 예매된 좌석이 있습니다. 페이지를 새로고침합니다.');
                window.location.reload();
            } else {
                alert('예매 중 오류가 발생했습니다. 다시 시도해주세요.');
            }
        } finally {
            setBookingLoading(false);
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

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading">공연 정보를 불러오는 중...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="error-container">
                <div className="error-message">{error}</div>
                <button onClick={() => navigate('/')} className="btn btn-primary">
                    메인으로 돌아가기
                </button>
            </div>
        );
    }

    if (!performance) {
        return (
            <div className="error-container">
                <div className="error-message">공연을 찾을 수 없습니다.</div>
                <button onClick={() => navigate('/')} className="btn btn-primary">
                    메인으로 돌아가기
                </button>
            </div>
        );
    }

    const totalPrice = selectedSeats.length * performance.price;

    return (
        <div className="booking-page">
            <div className="performance-info-section">
                <button onClick={() => navigate('/')} className="back-button">
                    ← 목록으로 돌아가기
                </button>

                <div className="performance-details">
                    <h1>{performance.title}</h1>
                    <div className="performance-meta">
                        <p><strong>장소:</strong> {performance.venue}</p>
                        <p><strong>일시:</strong> {formatDate(performance.performanceDate)}</p>
                        <p><strong>가격:</strong> {formatPrice(performance.price)}원</p>
                        <p><strong>잔여석:</strong> {performance.totalSeats - performance.bookedSeats}석</p>
                    </div>
                </div>
            </div>

            <div className="booking-content">
                <div className="seat-selection">
                    <h2>좌석 선택</h2>
                    <SeatMap
                        seats={seats}
                        selectedSeats={selectedSeats}
                        onSeatSelect={setSelectedSeats}
                        maxSelection={4}
                    />
                </div>

                <div className="booking-summary">
                    <h3>예매 정보</h3>
                    <div className="summary-content">
                        <div className="summary-row">
                            <span>선택 좌석:</span>
                            <span>
                {selectedSeats.length > 0
                    ? selectedSeats.map(seat => seat.seatNumber).join(', ')
                    : '선택된 좌석이 없습니다'
                }
              </span>
                        </div>
                        <div className="summary-row">
                            <span>좌석 수:</span>
                            <span>{selectedSeats.length}석</span>
                        </div>
                        <div className="summary-row">
                            <span>좌석당 가격:</span>
                            <span>{formatPrice(performance.price)}원</span>
                        </div>
                        <div className="summary-row total">
                            <span>총 결제 금액:</span>
                            <span>{formatPrice(totalPrice)}원</span>
                        </div>
                    </div>

                    <button
                        onClick={handleBooking}
                        disabled={selectedSeats.length === 0 || bookingLoading}
                        className="btn btn-primary btn-full"
                    >
                        {bookingLoading ? '예매 중...' : '예매하기'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BookingPage;
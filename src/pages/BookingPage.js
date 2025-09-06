import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SeatMap from '../components/SeatMap';
import { performanceAPI, seatAPI, bookingAPI, seatLayoutAPI } from '../services/api';

const BookingPage = () => {
    const { performanceId } = useParams();
    const navigate = useNavigate();

    const [performance, setPerformance] = useState(null);
    const [seats, setSeats] = useState([]);
    const [selectedSeats, setSelectedSeats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [bookingLoading, setBookingLoading] = useState(false);
    const [error, setError] = useState('');
    const [venueSeatMap, setVenueSeatMap] = useState(null);
    const [useVenueLayout, setUseVenueLayout] = useState(false);

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

            // 공연에 연결된 공연장이 있다면 공연장 좌석 맵 가져오기
            if (performanceData.venue?.id) {
                try {
                    const seatMapData = await seatLayoutAPI.getSeatMap(performanceData.venue.id);
                    setVenueSeatMap(seatMapData);
                    setUseVenueLayout(true); // 공연장 좌석 맵이 있으면 새로운 방식 사용
                } catch (venueError) {
                    console.warn('공연장 좌석 맵을 불러올 수 없어 기본 좌석 배치를 사용합니다:', venueError);
                    setUseVenueLayout(false); // 실패시 기존 방식 사용
                }
            } else {
                console.warn('공연에 연결된 공연장 정보가 없어 기본 좌석 배치를 사용합니다.');
                setUseVenueLayout(false);
            }

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

        // 선택된 좌석의 타입별 가격 계산 (향후 좌석 타입별 가격 차등화를 위해)
        const totalPrice = calculateTotalPrice(selectedSeats);
        
        const seatDetails = selectedSeats.map(seat => {
            const seatLayout = venueSeatMap?.seatMatrix?.flat()?.find(s => s.seatLabel === seat.seatNumber);
            return `${seat.seatNumber}${seatLayout ? ` (${seatLayout.seatType})` : ''}`;
        }).join(', ');

        const confirmMessage = `선택하신 좌석: ${seatDetails}\n총 금액: ${formatPrice(totalPrice)}원\n\n예매하시겠습니까?`;

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

    const calculateTotalPrice = (selectedSeats) => {
        // 기본적으로는 동일 가격, 향후 좌석 타입별 가격 차등화 시 확장 가능
        return selectedSeats.length * performance.price;
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

    const getVenueDisplayName = () => {
        if (performance.venue?.name) {
            return performance.venue.name;
        }
        return performance.venueName || performance.venue || '알 수 없는 공연장';
    };

    const getVenueInfo = () => {
        if (!performance.venue) return null;
        
        return (
            <div className="venue-info">
                <h4>공연장 정보</h4>
                <div className="venue-details">
                    <p><strong>위치:</strong> {performance.venue.location}</p>
                    {performance.venue.description && (
                        <p><strong>설명:</strong> {performance.venue.description}</p>
                    )}
                    {performance.venue.facilities && (
                        <p><strong>편의시설:</strong> {performance.venue.facilities}</p>
                    )}
                    {performance.venue.contactInfo && (
                        <p><strong>연락처:</strong> {performance.venue.contactInfo}</p>
                    )}
                    <div className="venue-layout-info">
                        <span><strong>좌석 구조:</strong> {performance.venue.totalRows}행 × {performance.venue.seatsPerRow}석</span>
                        <span><strong>총 좌석:</strong> {performance.venue.totalSeats}석</span>
                    </div>
                </div>
            </div>
        );
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

    const totalPrice = calculateTotalPrice(selectedSeats);

    return (
        <div className="booking-page">
            <div className="performance-info-section">
                <button onClick={() => navigate('/')} className="back-button">
                    ← 목록으로 돌아가기
                </button>

                <div className="performance-details">
                    <h1>{performance.title}</h1>
                    <div className="performance-meta">
                        <p><strong>장소:</strong> {getVenueDisplayName()}</p>
                        <p><strong>일시:</strong> {formatDate(performance.performanceDate)}</p>
                        <p><strong>가격:</strong> {formatPrice(performance.price)}원</p>
                        <p><strong>잔여석:</strong> {performance.totalSeats - (performance.bookedSeats || 0)}석</p>
                        {useVenueLayout && (
                            <p className="venue-layout-indicator">
                                <span className="layout-badge">🎭 공연장 전용 좌석배치</span>
                            </p>
                        )}
                    </div>
                    
                    {performance.description && (
                        <div className="performance-description">
                            <h3>공연 소개</h3>
                            <p>{performance.description}</p>
                        </div>
                    )}

                    {getVenueInfo()}
                </div>
            </div>

            <div className="booking-content">
                <div className="seat-selection">
                    <div className="seat-selection-header">
                        <h2>좌석 선택</h2>
                        {useVenueLayout && venueSeatMap && (
                            <div className="seat-map-switch">
                                <button 
                                    onClick={() => setUseVenueLayout(!useVenueLayout)}
                                    className="btn btn-secondary btn-sm"
                                    title="좌석 보기 방식 변경"
                                >
                                    {useVenueLayout ? '기본 보기로 전환' : '공연장 보기로 전환'}
                                </button>
                            </div>
                        )}
                    </div>
                    
                    <SeatMap
                        seats={seats}
                        selectedSeats={selectedSeats}
                        onSeatSelect={setSelectedSeats}
                        maxSelection={4}
                        performance={useVenueLayout ? {
                            ...performance,
                            venue: {
                                ...performance.venue,
                                seatMap: venueSeatMap
                            }
                        } : performance}
                        useVenueLayout={useVenueLayout}
                    />
                </div>

                <div className="booking-summary">
                    <h3>예매 정보</h3>
                    <div className="summary-content">
                        <div className="summary-row">
                            <span>선택 좌석:</span>
                            <span>
                                {selectedSeats.length > 0
                                    ? selectedSeats.map(seat => {
                                        const seatLayout = venueSeatMap?.seatMatrix?.flat()?.find(s => s.seatLabel === seat.seatNumber);
                                        return seatLayout ? 
                                            `${seat.seatNumber} (${seatLayout.seatType})` : 
                                            seat.seatNumber;
                                    }).join(', ')
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
                        {selectedSeats.length > 0 && useVenueLayout && (
                            <div className="seat-type-breakdown">
                                {/* 좌석 타입별 분류 표시 */}
                                {Object.entries(
                                    selectedSeats.reduce((acc, seat) => {
                                        const seatLayout = venueSeatMap?.seatMatrix?.flat()?.find(s => s.seatLabel === seat.seatNumber);
                                        const seatType = seatLayout?.seatType || 'REGULAR';
                                        acc[seatType] = (acc[seatType] || 0) + 1;
                                        return acc;
                                    }, {})
                                ).map(([type, count]) => (
                                    <div key={type} className="summary-row seat-type-row">
                                        <span>{type}석:</span>
                                        <span>{count}석</span>
                                    </div>
                                ))}
                            </div>
                        )}
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

                    {selectedSeats.length === 0 && (
                        <p className="booking-notice">
                            좌석을 선택하신 후 예매하실 수 있습니다.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BookingPage;
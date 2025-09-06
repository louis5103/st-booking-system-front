import React from 'react';

const SeatMap = ({ 
    seats, 
    selectedSeats, 
    onSeatSelect, 
    maxSelection = 4,
    performance = null, // 공연 정보
    useVenueLayout = false // 공연장 좌석 구조 사용 여부
}) => {
    // 기존 방식: 좌석을 행별로 그룹화 (A1, A2, A3... B1, B2, B3... 형태)
    const groupSeatsByRow = (seats) => {
        const rows = {};
        seats.forEach(seat => {
            const row = seat.seatNumber.charAt(0); // A, B, C 등
            if (!rows[row]) {
                rows[row] = [];
            }
            rows[row].push(seat);
        });

        // 각 행의 좌석을 번호순으로 정렬
        Object.keys(rows).forEach(row => {
            rows[row].sort((a, b) => {
                const numA = parseInt(a.seatNumber.slice(1));
                const numB = parseInt(b.seatNumber.slice(1));
                return numA - numB;
            });
        });

        return rows;
    };

    // 새로운 방식: 공연장 좌석 맵을 사용한 렌더링
    const renderVenueSeatMap = (seatMapData) => {
        if (!seatMapData || !seatMapData.seatMatrix) {
            return <div className="error-message">좌석 맵 데이터를 불러올 수 없습니다.</div>;
        }

        return (
            <div className="venue-seat-map">
                <div className="venue-info">
                    <h4>{seatMapData.venueName}</h4>
                    <div className="seat-info">
                        <span>총 {seatMapData.statistics?.totalSeats || 0}석</span>
                        <span>예매 가능 {seatMapData.statistics?.bookableSeats || 0}석</span>
                    </div>
                </div>

                <div className="stage">
                    <div className="stage-label">무대</div>
                </div>

                <div className="seats-container">
                    {seatMapData.seatMatrix.map((row, rowIndex) => (
                        <div key={rowIndex} className="seat-row">
                            <div className="row-label">
                                {String.fromCharCode(65 + rowIndex)}
                            </div>
                            <div className="seats">
                                {row.map((seatLayout, seatIndex) => {
                                    // 해당 좌석 레이아웃에 대응하는 실제 좌석 찾기
                                    const actualSeat = seats?.find(seat => 
                                        seat.seatNumber === seatLayout.seatLabel
                                    );

                                    // 통로나 무대 등 실제 좌석이 아닌 경우
                                    if (seatLayout.seatType === 'AISLE' || 
                                        seatLayout.seatType === 'STAGE' ||
                                        seatLayout.seatType === 'BLOCKED') {
                                        return (
                                            <div
                                                key={`${rowIndex}-${seatIndex}`}
                                                className={`seat ${seatLayout.seatType.toLowerCase()} non-selectable`}
                                                title={seatLayout.seatType}
                                            >
                                                {seatLayout.seatType === 'AISLE' ? '' : 'X'}
                                            </div>
                                        );
                                    }

                                    // 실제 예매 가능한 좌석
                                    if (actualSeat) {
                                        const isSelected = selectedSeats.some(s => s.id === actualSeat.id);
                                        const seatClass = getSeatClass(actualSeat, seatLayout.seatType);

                                        return (
                                            <button
                                                key={`${rowIndex}-${seatIndex}`}
                                                className={`${seatClass} ${seatLayout.seatType.toLowerCase()}`}
                                                onClick={() => handleSeatClick(actualSeat)}
                                                disabled={actualSeat.isBooked || !seatLayout.isActive}
                                                title={`${actualSeat.seatNumber} (${seatLayout.seatType}) ${actualSeat.isBooked ? '- 예매완료' : ''}`}
                                            >
                                                {seatLayout.seatNumber}
                                            </button>
                                        );
                                    }

                                    // 좌석 레이아웃은 있지만 실제 좌석이 없는 경우 (비활성)
                                    return (
                                        <div
                                            key={`${rowIndex}-${seatIndex}`}
                                            className={`seat ${seatLayout.seatType.toLowerCase()} inactive`}
                                            title={`${seatLayout.seatLabel} (비활성)`}
                                        >
                                            {seatLayout.seatNumber}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="seat-legend venue-legend">
                    <div className="legend-item">
                        <div className="seat-sample vip"></div>
                        <span>VIP석</span>
                    </div>
                    <div className="legend-item">
                        <div className="seat-sample premium"></div>
                        <span>프리미엄석</span>
                    </div>
                    <div className="legend-item">
                        <div className="seat-sample regular"></div>
                        <span>일반석</span>
                    </div>
                    <div className="legend-item">
                        <div className="seat-sample wheelchair"></div>
                        <span>휠체어석</span>
                    </div>
                    <div className="legend-item">
                        <div className="seat-sample aisle"></div>
                        <span>통로</span>
                    </div>
                    <div className="legend-item">
                        <div className="seat selected"></div>
                        <span>선택됨</span>
                    </div>
                    <div className="legend-item">
                        <div className="seat booked"></div>
                        <span>예매완료</span>
                    </div>
                </div>
            </div>
        );
    };

    // 기존 방식: 행별 그룹화된 좌석 렌더링
    const renderTraditionalSeatMap = () => {
        const seatRows = groupSeatsByRow(seats);
        const rowNames = Object.keys(seatRows).sort();

        return (
            <div className="traditional-seat-map">
                <div className="stage">
                    <div className="stage-label">무대</div>
                </div>

                <div className="seats-container">
                    {rowNames.map(rowName => (
                        <div key={rowName} className="seat-row">
                            <div className="row-label">{rowName}</div>
                            <div className="seats">
                                {seatRows[rowName].map(seat => (
                                    <button
                                        key={seat.id}
                                        className={getSeatClass(seat)}
                                        onClick={() => handleSeatClick(seat)}
                                        disabled={seat.isBooked}
                                        title={`${seat.seatNumber} ${seat.isBooked ? '(예매완료)' : ''}`}
                                    >
                                        {seat.seatNumber.slice(1)} {/* 숫자 부분만 표시 */}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="seat-legend">
                    <div className="legend-item">
                        <div className="seat available"></div>
                        <span>선택가능</span>
                    </div>
                    <div className="legend-item">
                        <div className="seat selected"></div>
                        <span>선택됨</span>
                    </div>
                    <div className="legend-item">
                        <div className="seat booked"></div>
                        <span>예매완료</span>
                    </div>
                </div>
            </div>
        );
    };

    const handleSeatClick = (seat) => {
        if (seat.isBooked) return; // 이미 예매된 좌석은 선택 불가

        const isSelected = selectedSeats.some(s => s.id === seat.id);

        if (isSelected) {
            // 선택 해제
            onSeatSelect(selectedSeats.filter(s => s.id !== seat.id));
        } else {
            // 새로 선택
            if (selectedSeats.length < maxSelection) {
                onSeatSelect([...selectedSeats, seat]);
            } else {
                alert(`최대 ${maxSelection}석까지 선택 가능합니다.`);
            }
        }
    };

    const getSeatClass = (seat, seatType = 'REGULAR') => {
        if (seat.isBooked) return 'seat booked';
        if (selectedSeats.some(s => s.id === seat.id)) return 'seat selected';
        return 'seat available';
    };

    // 메인 렌더링 로직
    return (
        <div className="seat-map">
            {useVenueLayout && performance?.venue?.seatMap ? 
                renderVenueSeatMap(performance.venue.seatMap) : 
                renderTraditionalSeatMap()
            }

            {selectedSeats.length > 0 && (
                <div className="selected-info">
                    <h4>선택된 좌석</h4>
                    <p>{selectedSeats.map(seat => seat.seatNumber).join(', ')}</p>
                    <p>총 {selectedSeats.length}석</p>
                    {useVenueLayout && selectedSeats.length > 0 && (
                        <div className="selected-seat-details">
                            {selectedSeats.map(seat => {
                                const seatLayout = performance?.venue?.seatMap?.seatMatrix
                                    ?.flat()
                                    ?.find(s => s.seatLabel === seat.seatNumber);
                                return (
                                    <div key={seat.id} className="selected-seat-detail">
                                        <span className="seat-number">{seat.seatNumber}</span>
                                        {seatLayout && (
                                            <span className="seat-type">
                                                ({seatLayout.seatType})
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default SeatMap;
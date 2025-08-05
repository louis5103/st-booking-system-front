import React from 'react';

const SeatMap = ({ seats, selectedSeats, onSeatSelect, maxSelection = 4 }) => {
    // 좌석을 행별로 그룹화 (A1, A2, A3... B1, B2, B3... 형태로 가정)
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

    const seatRows = groupSeatsByRow(seats);
    const rowNames = Object.keys(seatRows).sort();

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

    const getSeatClass = (seat) => {
        if (seat.isBooked) return 'seat booked';
        if (selectedSeats.some(s => s.id === seat.id)) return 'seat selected';
        return 'seat available';
    };

    return (
        <div className="seat-map">
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

            {selectedSeats.length > 0 && (
                <div className="selected-info">
                    <h4>선택된 좌석</h4>
                    <p>{selectedSeats.map(seat => seat.seatNumber).join(', ')}</p>
                    <p>총 {selectedSeats.length}석</p>
                </div>
            )}
        </div>
    );
};

export default SeatMap;
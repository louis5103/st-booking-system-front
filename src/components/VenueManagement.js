import React, { useState, useEffect } from 'react';
import { venueAPI, seatLayoutAPI } from '../services/api';
import FlexibleVenueEditor from './FlexibleVenueEditor';

const VenueManagement = () => {
    const [venues, setVenues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingVenue, setEditingVenue] = useState(null);
    const [showSeatLayout, setShowSeatLayout] = useState(null);
    const [showFlexibleEditor, setShowFlexibleEditor] = useState(null);
    const [seatMap, setSeatMap] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        location: '',
        description: '',
        totalSeats: '',
        totalRows: '',
        seatsPerRow: '',
        facilities: '',
        contactInfo: ''
    });

    useEffect(() => {
        fetchVenues();
    }, []);

    const fetchVenues = async () => {
        try {
            setLoading(true);
            const data = await venueAPI.getAll();
            setVenues(data);
        } catch (error) {
            console.error('Error fetching venues:', error);
            setError('공연장 목록을 불러오는 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            location: '',
            description: '',
            totalSeats: '',
            totalRows: '',
            seatsPerRow: '',
            facilities: '',
            contactInfo: ''
        });
        setEditingVenue(null);
        setShowAddForm(false);
    };

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleAddVenue = () => {
        resetForm();
        setShowAddForm(true);
    };

    const handleEditVenue = (venue) => {
        setFormData({
            name: venue.name,
            location: venue.location,
            description: venue.description || '',
            totalSeats: venue.totalSeats.toString(),
            totalRows: venue.totalRows.toString(),
            seatsPerRow: venue.seatsPerRow.toString(),
            facilities: venue.facilities || '',
            contactInfo: venue.contactInfo || ''
        });
        setEditingVenue(venue);
        setShowAddForm(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const venueData = {
                ...formData,
                totalSeats: parseInt(formData.totalSeats),
                totalRows: parseInt(formData.totalRows),
                seatsPerRow: parseInt(formData.seatsPerRow)
            };

            if (editingVenue) {
                await venueAPI.update(editingVenue.id, venueData);
                alert('공연장이 수정되었습니다.');
            } else {
                await venueAPI.create(venueData);
                alert('공연장이 등록되었습니다.');
            }

            resetForm();
            fetchVenues();
        } catch (error) {
            console.error('Error saving venue:', error);
            alert('공연장 저장 중 오류가 발생했습니다.');
        }
    };

    const handleDeleteVenue = async (venueId) => {
        if (!window.confirm('이 공연장을 삭제하시겠습니까? 진행 중인 공연이 있는 경우 삭제할 수 없습니다.')) {
            return;
        }

        try {
            await venueAPI.delete(venueId);
            alert('공연장이 삭제되었습니다.');
            fetchVenues();
        } catch (error) {
            console.error('Error deleting venue:', error);
            if (error.response?.status === 400) {
                alert('진행 중인 공연이 있어 삭제할 수 없습니다.');
            } else {
                alert('공연장 삭제 중 오류가 발생했습니다.');
            }
        }
    };

    const handleViewSeatLayout = async (venue) => {
        try {
            const seatMapData = await seatLayoutAPI.getSeatMap(venue.id);
            setSeatMap(seatMapData);
            setShowSeatLayout(venue);
        } catch (error) {
            console.error('Error fetching seat layout:', error);
            alert('좌석 배치를 불러오는 중 오류가 발생했습니다.');
        }
    };

    const handleAutoGenerateSeats = async (venueId) => {
        if (!window.confirm('이 공연장의 기본 좌석 배치를 자동 생성하시겠습니까? 기존 좌석 배치는 삭제됩니다.')) {
            return;
        }

        try {
            await seatLayoutAPI.autoGenerate(venueId);
            alert('좌석 배치가 자동 생성되었습니다.');
            
            // 좌석 맵 다시 로드
            if (showSeatLayout && showSeatLayout.id === venueId) {
                const seatMapData = await seatLayoutAPI.getSeatMap(venueId);
                setSeatMap(seatMapData);
            }
        } catch (error) {
            console.error('Error auto-generating seats:', error);
            alert('좌석 배치 자동 생성 중 오류가 발생했습니다.');
        }
    };

    const handleOpenFlexibleEditor = (venue) => {
        setShowFlexibleEditor(venue);
    };

    const renderSeatMap = () => {
        if (!seatMap) return null;

        return (
            <div className="seat-map-display">
                <h3>{seatMap.venueName} 좌석 배치</h3>
                <div className="seat-map-info">
                    <p>총 행 수: {seatMap.totalRows}행</p>
                    <p>행당 좌석 수: {seatMap.seatsPerRow}석</p>
                    <p>총 좌석 수: {seatMap.statistics?.totalSeats || 0}석</p>
                    <p>예매 가능 좌석: {seatMap.statistics?.bookableSeats || 0}석</p>
                </div>

                <div className="seat-legend">
                    <div className="legend-item">
                        <span className="seat-sample vip"></span>
                        <span>VIP석</span>
                    </div>
                    <div className="legend-item">
                        <span className="seat-sample premium"></span>
                        <span>프리미엄석</span>
                    </div>
                    <div className="legend-item">
                        <span className="seat-sample regular"></span>
                        <span>일반석</span>
                    </div>
                    <div className="legend-item">
                        <span className="seat-sample aisle"></span>
                        <span>통로</span>
                    </div>
                </div>

                <div className="seat-map-container">
                    <div className="stage">무대</div>
                    <div className="seats-grid">
                        {seatMap.seatMatrix.map((row, rowIndex) => (
                            <div key={rowIndex} className="seat-row">
                                <div className="row-label">{String.fromCharCode(65 + rowIndex)}</div>
                                <div className="seats">
                                    {row.map((seat, seatIndex) => (
                                        <div
                                            key={`${rowIndex}-${seatIndex}`}
                                            className={`seat ${seat.seatType.toLowerCase()} ${seat.isActive ? 'active' : 'inactive'}`}
                                            title={`${seat.seatLabel} (${seat.seatType})`}
                                        >
                                            {seat.seatType === 'AISLE' ? '' : seat.seatNumber}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="seat-map-actions">
                    <button
                        onClick={() => handleAutoGenerateSeats(showSeatLayout.id)}
                        className="btn btn-warning"
                    >
                        좌석 배치 재생성
                    </button>
                    <button
                        onClick={() => setShowSeatLayout(null)}
                        className="btn btn-secondary"
                    >
                        닫기
                    </button>
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading">공연장 목록을 불러오는 중...</div>
            </div>
        );
    }

    return (
        <div className="venue-management">
            <div className="venue-header">
                <h2>공연장 관리</h2>
                <button
                    onClick={handleAddVenue}
                    className="btn btn-primary"
                >
                    새 공연장 등록
                </button>
            </div>

            {error && <div className="error-message">{error}</div>}

            {showAddForm && (
                <div className="modal-overlay">
                    <div className="modal large">
                        <div className="modal-header">
                            <h3>{editingVenue ? '공연장 수정' : '새 공연장 등록'}</h3>
                            <button onClick={resetForm} className="close-button">×</button>
                        </div>

                        <form onSubmit={handleSubmit} className="venue-form">
                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="name">공연장명 *</label>
                                    <input
                                        type="text"
                                        id="name"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="location">주소 *</label>
                                    <input
                                        type="text"
                                        id="location"
                                        name="location"
                                        value={formData.location}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="totalSeats">총 좌석 수 *</label>
                                    <input
                                        type="number"
                                        id="totalSeats"
                                        name="totalSeats"
                                        value={formData.totalSeats}
                                        onChange={handleInputChange}
                                        min="1"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="totalRows">행 수 *</label>
                                    <input
                                        type="number"
                                        id="totalRows"
                                        name="totalRows"
                                        value={formData.totalRows}
                                        onChange={handleInputChange}
                                        min="1"
                                        max="26"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="seatsPerRow">행당 좌석 수 *</label>
                                    <input
                                        type="number"
                                        id="seatsPerRow"
                                        name="seatsPerRow"
                                        value={formData.seatsPerRow}
                                        onChange={handleInputChange}
                                        min="1"
                                        max="50"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="facilities">편의시설</label>
                                    <input
                                        type="text"
                                        id="facilities"
                                        name="facilities"
                                        value={formData.facilities}
                                        onChange={handleInputChange}
                                        placeholder="주차장, 레스토랑, 카페 등"
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="contactInfo">연락처</label>
                                    <input
                                        type="text"
                                        id="contactInfo"
                                        name="contactInfo"
                                        value={formData.contactInfo}
                                        onChange={handleInputChange}
                                        placeholder="02-000-0000"
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="description">공연장 설명</label>
                                <textarea
                                    id="description"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    rows="4"
                                    placeholder="공연장에 대한 설명을 입력하세요..."
                                />
                            </div>

                            <div className="form-actions">
                                <button type="button" onClick={resetForm} className="btn btn-secondary">
                                    취소
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    {editingVenue ? '수정' : '등록'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showSeatLayout && (
                <div className="modal-overlay">
                    <div className="modal extra-large">
                        <div className="modal-header">
                            <button onClick={() => setShowSeatLayout(null)} className="close-button">×</button>
                        </div>
                        {renderSeatMap()}
                    </div>
                </div>
            )}

            {showFlexibleEditor && (
                <FlexibleVenueEditor 
                    venueId={showFlexibleEditor.id}
                    onClose={() => setShowFlexibleEditor(null)}
                />
            )}

            <div className="venues-section">
                <h3>등록된 공연장 목록</h3>

                {venues.length === 0 ? (
                    <div className="no-venues">등록된 공연장이 없습니다.</div>
                ) : (
                    <div className="venues-grid">
                        {venues.map(venue => (
                            <div key={venue.id} className="venue-card">
                                <div className="venue-info">
                                    <h4>{venue.name}</h4>
                                    <p className="venue-location">{venue.location}</p>
                                    <p className="venue-description">{venue.description}</p>
                                    
                                    <div className="venue-stats">
                                        <div className="stat">
                                            <span className="label">총 좌석:</span>
                                            <span className="value">{venue.totalSeats}석</span>
                                        </div>
                                        <div className="stat">
                                            <span className="label">구조:</span>
                                            <span className="value">{venue.totalRows}행 × {venue.seatsPerRow}석</span>
                                        </div>
                                        {venue.facilities && (
                                            <div className="stat">
                                                <span className="label">편의시설:</span>
                                                <span className="value">{venue.facilities}</span>
                                            </div>
                                        )}
                                        {venue.contactInfo && (
                                            <div className="stat">
                                                <span className="label">연락처:</span>
                                                <span className="value">{venue.contactInfo}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="venue-actions">
                                    <button
                                        onClick={() => handleViewSeatLayout(venue)}
                                        className="btn btn-info btn-sm"
                                    >
                                        기본 배치 보기
                                    </button>
                                    <button
                                        onClick={() => handleOpenFlexibleEditor(venue)}
                                        className="btn btn-success btn-sm"
                                    >
                                        유연한 편집
                                    </button>
                                    <button
                                        onClick={() => handleEditVenue(venue)}
                                        className="btn btn-warning btn-sm"
                                    >
                                        수정
                                    </button>
                                    <button
                                        onClick={() => handleDeleteVenue(venue.id)}
                                        className="btn btn-danger btn-sm"
                                    >
                                        삭제
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default VenueManagement;

import React, { useState, useEffect } from 'react';
import PerformanceCard from '../components/PerformanceCard';
import { performanceAPI } from '../services/api';

const AdminPage = () => {
    const [performances, setPerformances] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingPerformance, setEditingPerformance] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        venue: '',
        performanceDate: '',
        price: '',
        totalSeats: '',
        description: '',
        imageUrl: ''
    });

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

    const resetForm = () => {
        setFormData({
            title: '',
            venue: '',
            performanceDate: '',
            price: '',
            totalSeats: '',
            description: '',
            imageUrl: ''
        });
        setEditingPerformance(null);
        setShowAddForm(false);
    };

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleAddPerformance = () => {
        resetForm();
        setShowAddForm(true);
    };

    const handleEditPerformance = (performance) => {
        setFormData({
            title: performance.title,
            venue: performance.venue,
            performanceDate: performance.performanceDate.slice(0, 16), // datetime-local 형식
            price: performance.price.toString(),
            totalSeats: performance.totalSeats.toString(),
            description: performance.description || '',
            imageUrl: performance.imageUrl || ''
        });
        setEditingPerformance(performance);
        setShowAddForm(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const performanceData = {
                ...formData,
                price: parseInt(formData.price),
                totalSeats: parseInt(formData.totalSeats),
                performanceDate: new Date(formData.performanceDate).toISOString()
            };

            if (editingPerformance) {
                await performanceAPI.update(editingPerformance.id, performanceData);
                alert('공연이 수정되었습니다.');
            } else {
                await performanceAPI.create(performanceData);
                alert('공연이 등록되었습니다.');
            }

            resetForm();
            fetchPerformances();
        } catch (error) {
            console.error('Error saving performance:', error);
            alert('공연 저장 중 오류가 발생했습니다.');
        }
    };

    const handleDeletePerformance = async (performanceId) => {
        if (!window.confirm('이 공연을 삭제하시겠습니까? 삭제된 공연은 복구할 수 없습니다.')) {
            return;
        }

        try {
            await performanceAPI.delete(performanceId);
            alert('공연이 삭제되었습니다.');
            fetchPerformances();
        } catch (error) {
            console.error('Error deleting performance:', error);
            if (error.response?.status === 400) {
                alert('예매된 공연은 삭제할 수 없습니다.');
            } else {
                alert('공연 삭제 중 오류가 발생했습니다.');
            }
        }
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading">공연 목록을 불러오는 중...</div>
            </div>
        );
    }

    return (
        <div className="admin-page">
            <div className="admin-header">
                <h1>관리자 페이지</h1>
                <button
                    onClick={handleAddPerformance}
                    className="btn btn-primary"
                >
                    새 공연 등록
                </button>
            </div>

            {error && <div className="error-message">{error}</div>}

            {showAddForm && (
                <div className="modal-overlay">
                    <div className="modal">
                        <div className="modal-header">
                            <h2>{editingPerformance ? '공연 수정' : '새 공연 등록'}</h2>
                            <button onClick={resetForm} className="close-button">×</button>
                        </div>

                        <form onSubmit={handleSubmit} className="performance-form">
                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="title">공연명 *</label>
                                    <input
                                        type="text"
                                        id="title"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="venue">공연장 *</label>
                                    <input
                                        type="text"
                                        id="venue"
                                        name="venue"
                                        value={formData.venue}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="performanceDate">공연일시 *</label>
                                    <input
                                        type="datetime-local"
                                        id="performanceDate"
                                        name="performanceDate"
                                        value={formData.performanceDate}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="price">가격 *</label>
                                    <input
                                        type="number"
                                        id="price"
                                        name="price"
                                        value={formData.price}
                                        onChange={handleInputChange}
                                        min="0"
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
                                    <label htmlFor="imageUrl">이미지 URL</label>
                                    <input
                                        type="url"
                                        id="imageUrl"
                                        name="imageUrl"
                                        value={formData.imageUrl}
                                        onChange={handleInputChange}
                                        placeholder="https://..."
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="description">공연 설명</label>
                                <textarea
                                    id="description"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    rows="4"
                                    placeholder="공연에 대한 설명을 입력하세요..."
                                />
                            </div>

                            <div className="form-actions">
                                <button type="button" onClick={resetForm} className="btn btn-secondary">
                                    취소
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    {editingPerformance ? '수정' : '등록'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="performances-section">
                <h2>등록된 공연 목록</h2>

                {performances.length === 0 ? (
                    <div className="no-performances">등록된 공연이 없습니다.</div>
                ) : (
                    <div className="performances-grid">
                        {performances.map(performance => (
                            <PerformanceCard
                                key={performance.id}
                                performance={performance}
                                showAdminButtons={true}
                                onEdit={handleEditPerformance}
                                onDelete={handleDeletePerformance}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminPage;
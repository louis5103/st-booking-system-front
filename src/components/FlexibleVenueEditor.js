import React, { useState, useCallback, useRef, useEffect } from 'react';
import { venueAPI, seatLayoutAPI } from '../services/api';
import '../styles/FlexibleVenueEditor.css';

const FlexibleVenueEditor = ({ venueId, onClose }) => {
  // 기본 상태
  const [seats, setSeats] = useState([]);
  const [sections, setSections] = useState({
    1: { name: '1구역', color: '#FF6B6B' },
    2: { name: '2구역', color: '#4ECDC4' },
    3: { name: '3구역', color: '#45B7D1' },
    4: { name: '4구역', color: '#96CEB4' },
    5: { name: '5구역', color: '#FECA57' }
  });
  const [stage, setStage] = useState({ x: 0, y: 0, width: 200, height: 60 });
  const [selectedSeatType, setSelectedSeatType] = useState('REGULAR');
  const [selectedSection, setSelectedSection] = useState(1);
  const [loading, setLoading] = useState(true);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  
  const venueRef = useRef(null);
  const containerRef = useRef(null);

  const seatTypes = {
    REGULAR: { color: '#3B82F6', name: '일반석', price: 50000 },
    VIP: { color: '#F59E0B', name: 'VIP석', price: 100000 },
    PREMIUM: { color: '#8B5CF6', name: '프리미엄석', price: 75000 },
    WHEELCHAIR: { color: '#10B981', name: '휠체어석', price: 50000 }
  };

  // 기본 템플릿 생성 (새 API와 호환)
  const createDefaultTemplate = useCallback(() => {
    const defaultSeats = [];
    let counter = 1;
    
    const stageY = 50;
    const firstRowY = stageY + 120;
    const rows = 5;
    const cols = 8;
    const seatSpacing = 50;
    const rowSpacing = 60;
    const totalWidth = (cols - 1) * seatSpacing;
    const startX = (canvasSize.width - totalWidth) / 2;
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = startX + (col * seatSpacing);
        const y = firstRowY + (row * rowSpacing);
        const sectionId = row < 2 ? 1 : 2;
        const seatType = row < 2 ? 'PREMIUM' : 'REGULAR';
        const rowLabel = String.fromCharCode(65 + row);
        
        defaultSeats.push({
          id: `seat-default-${row}-${col}`,
          x: x - 20,
          y: y - 20,
          type: seatType, // 새 API 호환
          seatType: seatType, // 레거시 호환
          rotation: 0,
          section: sectionId, // 새 API 호환
          sectionId: sectionId, // 레거시 호환
          sectionName: sections[sectionId]?.name || `${sectionId}구역`,
          sectionColor: sections[sectionId]?.color || '#FF6B6B',
          price: seatTypes[seatType]?.price || 50000,
          label: `${rowLabel}${col + 1}`, // 새 API 호환
          seatLabel: `${rowLabel}${col + 1}`, // 레거시 호환
          isActive: true
        });
        counter++;
      }
    }
    
    return { seats: defaultSeats, counter };
  }, [canvasSize.width, sections, seatTypes]);

  // 데이터 로드 (새 API 사용)
  useEffect(() => {
    if (venueId) {
      loadFlexibleSeatMap();
    } else {
      setLoading(false);
    }
  }, [venueId]);

  const loadFlexibleSeatMap = async () => {
    try {
      setLoading(true);
      
      // 새 통합 API 사용
      const response = await seatLayoutAPI.getVenueLayout(venueId);
      
      if (response?.success && response.data?.seats && response.data.seats.length > 0) {
        // 새 API 데이터를 레거시 포맷으로 변환
        const adjustedSeats = response.data.seats.map((seat, index) => ({
          ...seat,
          id: seat.id || `seat-${Date.now()}-${index}`,
          // 좌표 안전성 체크
          x: Math.max(0, Math.min(seat.x || seat.xPosition || Math.random() * (canvasSize.width - 100) + 50, canvasSize.width - 40)),
          y: Math.max(0, Math.min(seat.y || seat.yPosition || Math.random() * (canvasSize.height - 200) + 100, canvasSize.height - 40)),
          // 타입 호환성
          seatType: seat.type || seat.seatType || 'REGULAR',
          type: seat.type || seat.seatType || 'REGULAR',
          // 섹션 호환성
          sectionId: seat.section || seat.sectionId || 1,
          section: seat.section || seat.sectionId || 1,
          // 라벨 호환성
          seatLabel: seat.label || seat.seatLabel || `${seat.sectionName || '1구역'}-${index + 1}`,
          label: seat.label || seat.seatLabel || `${seat.sectionName || '1구역'}-${index + 1}`,
          isActive: seat.isActive !== undefined ? seat.isActive : true
        }));
        
        setSeats(adjustedSeats);
        
        // 섹션 정보 업데이트
        if (response.data.sections && response.data.sections.length > 0) {
          const sectionsMap = {};
          response.data.sections.forEach(section => {
            sectionsMap[section.id] = {
              name: section.name,
              color: section.color
            };
          });
          setSections(sectionsMap);
        }
      } else {
        // 데이터가 없는 경우 기본 템플릿 생성
        const { seats: defaultSeats } = createDefaultTemplate();
        setSeats(defaultSeats);
      }
    } catch (error) {
      console.error('유연한 좌석 배치 로드 실패:', error);
      // 오류 발생 시에도 기본 템플릿 생성
      const { seats: defaultSeats } = createDefaultTemplate();
      setSeats(defaultSeats);
    } finally {
      setLoading(false);
    }
  };

  // 저장 (새 API 사용)
  const saveLayout = async () => {
    try {
      setLoading(true);
      
      // 레거시 데이터를 새 API 포맷으로 변환
      const layoutData = {
        seats: seats.map(seat => ({
          id: seat.id,
          x: Math.round(seat.x),
          y: Math.round(seat.y),
          type: seat.type || seat.seatType,
          section: seat.section || seat.sectionId,
          label: seat.label || seat.seatLabel,
          price: seat.price,
          isActive: seat.isActive,
          rotation: seat.rotation || 0
        })),
        sections: Object.entries(sections).map(([id, section]) => ({
          id: parseInt(id),
          name: section.name,
          color: section.color
        })),
        canvas: {
          width: canvasSize.width,
          height: canvasSize.height,
          gridSize: 40
        },
        editMode: 'flexible'
      };

      const response = await seatLayoutAPI.saveVenueLayout(venueId, layoutData);
      
      if (response?.success) {
        alert('좌석 배치가 저장되었습니다!');
      } else {
        throw new Error(response?.error || '저장 실패');
      }
    } catch (error) {
      console.error('좌석 배치 저장 실패:', error);
      alert('저장 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  // 간단한 UI 제공 (기본 기능만)
  if (loading) {
    return (
      <div className="flexible-venue-editor">
        <div className="loading-container">
          <div className="loading">
            <div className="loading-spinner"></div>
            <span>좌석 배치를 불러오는 중...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flexible-venue-editor">
      <div className="editor-header">
        <div className="header-left">
          <h2>유연한 공연장 좌석 배치 (레거시)</h2>
          <div className="canvas-info">
            좌석: {seats.length}개 | 새 통합 API로 업그레이드되었습니다
          </div>
        </div>
        <div className="header-right">
          <button 
            onClick={saveLayout} 
            className="btn btn-primary" 
            disabled={loading}
            style={{
              padding: '10px 20px',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              opacity: loading ? 0.6 : 1
            }}
          >
            {loading ? '💾 저장 중...' : '💾 저장'}
          </button>
          <button 
            onClick={onClose} 
            className="btn btn-secondary"
            style={{
              padding: '10px 20px',
              backgroundColor: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              marginLeft: '10px'
            }}
          >
            ✖️ 닫기
          </button>
        </div>
      </div>

      <div className="editor-content">
        <div className="upgrade-notice" style={{
          backgroundColor: '#fef3c7',
          border: '1px solid #f59e0b',
          borderRadius: '8px',
          padding: '16px',
          margin: '20px',
          textAlign: 'center'
        }}>
          <h3 style={{ color: '#92400e', marginBottom: '8px' }}>🚀 새 버전으로 업그레이드되었습니다!</h3>
          <p style={{ color: '#92400e', margin: '0 0 12px 0' }}>
            더 나은 성능과 사용자 경험을 위해 새로운 통합 좌석 배치 에디터를 사용해주세요.
          </p>
          <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>
            현재 화면은 기존 데이터와의 호환성을 위해 제공됩니다. 새 기능을 사용하려면 관리자에게 문의하세요.
          </p>
        </div>

        {/* 기본 캔버스 (읽기 전용) */}
        <div className="editor-canvas" ref={containerRef}>
          <div className="canvas-container">
            <svg
              ref={venueRef}
              width={canvasSize.width}
              height={canvasSize.height}
              className="venue-canvas preview-mode"
              style={{
                border: '2px solid #d1d5db',
                borderRadius: '8px',
                backgroundColor: 'white'
              }}
            >
              {/* 무대 */}
              <rect
                x={stage.x + 50}
                y={stage.y + 30}
                width={stage.width}
                height={stage.height}
                fill="#1f2937"
                stroke="#374151"
                strokeWidth="2"
                rx="8"
              />
              <text
                x={stage.x + 50 + stage.width/2}
                y={stage.y + 30 + stage.height/2}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="white"
                fontSize="14"
                fontWeight="bold"
              >
                STAGE
              </text>

              {/* 좌석들 */}
              {seats.map((seat) => (
                <g key={seat.id}>
                  {/* 섹션 표시를 위한 배경 */}
                  <circle
                    cx={seat.x + 20}
                    cy={seat.y + 20}
                    r="22"
                    fill="none"
                    stroke={seat.sectionColor}
                    strokeWidth="2"
                    opacity="0.4"
                  />
                  
                  {/* 좌석 */}
                  <circle
                    cx={seat.x + 20}
                    cy={seat.y + 20}
                    r="20"
                    fill={seatTypes[seat.type || seat.seatType]?.color || '#3B82F6'}
                    stroke="#fff"
                    strokeWidth="3"
                  />
                  
                  {/* 좌석 번호 */}
                  <text
                    x={seat.x + 20}
                    y={seat.y + 20}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="white"
                    fontSize="11"
                    fontWeight="bold"
                  >
                    {seat.label || seat.seatLabel || '1'}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </div>

        {/* 통계 정보 */}
        <div className="stats-panel" style={{
          margin: '20px',
          padding: '16px',
          backgroundColor: 'white',
          borderRadius: '8px',
          border: '1px solid #e5e7eb'
        }}>
          <h3 style={{ margin: '0 0 12px 0', color: '#1f2937' }}>📊 현재 배치 통계</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            <div>
              <strong>총 좌석:</strong> {seats.length}개
            </div>
            <div>
              <strong>섹션 수:</strong> {Object.keys(sections).length}개
            </div>
            <div>
              <strong>예상 수익:</strong> {seats.reduce((sum, seat) => sum + (seat.price || 0), 0).toLocaleString()}원
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlexibleVenueEditor;
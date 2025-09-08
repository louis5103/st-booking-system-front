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

  // 기본 템플릿 생성 (새 API와 호환) - 안전한 버전
  const createDefaultTemplate = useCallback(() => {
    const defaultSeats = [];
    
    const stageY = 50;
    const firstRowY = stageY + 120;
    const rows = 5;
    const cols = 8;
    const seatSpacing = 50;
    const rowSpacing = 60;
    const totalWidth = (cols - 1) * seatSpacing;
    const startX = Math.max(50, (canvasSize.width - totalWidth) / 2);
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = startX + (col * seatSpacing);
        const y = firstRowY + (row * rowSpacing);
        const sectionId = row < 2 ? 1 : row < 4 ? 2 : 3;
        const seatType = row < 1 ? 'VIP' : row < 3 ? 'PREMIUM' : 'REGULAR';
        const rowLabel = String.fromCharCode(65 + row); // A, B, C, D, E
        const colLabel = col + 1; // 1, 2, 3, ...
        const seatPrice = seatType === 'VIP' ? 100000 : seatType === 'PREMIUM' ? 75000 : 50000;
        const seatIndex = row * cols + col;
        
        const seatData = {
          id: `seat-default-${row}-${col}-${Date.now()}`,
          // 백엔드 필수 필드들 - 모두 명시적으로 설정
          x: Math.round(Math.max(20, x - 20)),
          y: Math.round(Math.max(20, y - 20)),
          type: seatType,
          section: sectionId,
          label: `${rowLabel}${colLabel}`,
          price: seatPrice,
          isActive: true,
          rotation: 0,
          // 레거시 호환 필드들
          seatType: seatType,
          sectionId: sectionId,
          seatLabel: `${rowLabel}${colLabel}`,
          sectionName: sections[sectionId]?.name || `${sectionId}구역`,
          sectionColor: sections[sectionId]?.color || ['#FF6B6B', '#4ECDC4', '#45B7D1'][sectionId - 1] || '#FF6B6B',
          xPosition: Math.round(Math.max(20, x - 20)),
          yPosition: Math.round(Math.max(20, y - 20))
        };
        
        // 데이터 무결성 검증
        if (!seatData.type) seatData.type = 'REGULAR';
        if (!seatData.label) seatData.label = `A${seatIndex + 1}`;
        if (seatData.section === null || seatData.section === undefined) seatData.section = 1;
        if (seatData.price === null || seatData.price === undefined) seatData.price = 50000;
        
        defaultSeats.push(seatData);
      }
    }
    
    console.log('기본 템플릿 생성 완료:', {
      총좌석수: defaultSeats.length,
      첫번째좌석: defaultSeats[0],
      마지막좌석: defaultSeats[defaultSeats.length - 1]
    });
    
    return { seats: defaultSeats, counter: defaultSeats.length };
  }, [canvasSize.width, sections]);

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
        const adjustedSeats = response.data.seats.map((seat, index) => {
          // 좌표 안전성 체크 및 기본값 설정
          const x = seat.x !== undefined && seat.x !== null ? Math.max(0, Math.min(Number(seat.x), canvasSize.width - 40)) : 100 + (index % 10) * 50;
          const y = seat.y !== undefined && seat.y !== null ? Math.max(0, Math.min(Number(seat.y), canvasSize.height - 40)) : 150 + Math.floor(index / 10) * 60;
          const seatType = seat.type || seat.seatType || 'REGULAR';
          const sectionId = seat.section !== undefined && seat.section !== null ? Number(seat.section) : 
                          seat.sectionId !== undefined && seat.sectionId !== null ? Number(seat.sectionId) : 1;
          const label = seat.label || seat.seatLabel || `${String.fromCharCode(65 + Math.floor(index / 8))}${(index % 8) + 1}`;
          const price = seat.price !== undefined && seat.price !== null ? Number(seat.price) : 
                       seatType === 'VIP' ? 100000 : seatType === 'PREMIUM' ? 75000 : 50000;
          
          const processedSeat = {
            ...seat,
            id: seat.id || `seat-${Date.now()}-${index}`,
            // 백엔드 필수 필드들
            x: Math.round(x),
            y: Math.round(y),
            type: seatType,
            section: sectionId,
            label: label,
            price: price,
            isActive: seat.isActive !== undefined ? Boolean(seat.isActive) : true,
            rotation: seat.rotation !== undefined && seat.rotation !== null ? Number(seat.rotation) : 0,
            // 레거시 호환 필드들
            seatType: seatType,
            sectionId: sectionId,
            seatLabel: label,
            xPosition: Math.round(x),
            yPosition: Math.round(y)
          };
          
          // 섹션 색상 정보 추가
          if (sections[sectionId]) {
            processedSeat.sectionName = sections[sectionId].name;
            processedSeat.sectionColor = sections[sectionId].color;
          } else {
            processedSeat.sectionName = `${sectionId}구역`;
            processedSeat.sectionColor = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57'][sectionId % 5];
          }
          
          return processedSeat;
        });
        
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
        
        // 캔버스 정보 업데이트
        if (response.data.canvas) {
          setCanvasSize({
            width: response.data.canvas.width || 800,
            height: response.data.canvas.height || 600
          });
        }
        
        // 무대 정보 업데이트
        if (response.data.stage) {
          setStage({
            x: response.data.stage.x || 0,
            y: response.data.stage.y || 0,
            width: response.data.stage.width || 200,
            height: response.data.stage.height || 60
          });
        }
      } else {
        // 데이터가 없는 경우 기본 템플릿 생성
        const { seats: defaultSeats } = createDefaultTemplate();
        setSeats(defaultSeats);
      }
    } catch (error) {
      console.error('유연한 좌석 배치 로드 실패:', error);
      console.error('오류 상세:', error.response?.data);
      // 오류 발생 시에도 기본 템플릿 생성
      const { seats: defaultSeats } = createDefaultTemplate();
      setSeats(defaultSeats);
    } finally {
      setLoading(false);
    }
  };

  // 저장 (새 API 사용) - 디버깅 강화 버전
  const saveLayout = async () => {
    try {
      setLoading(true);
      
      console.log('=== 저장 시작 ===');
      console.log('현재 좌석 개수:', seats.length);
      console.log('첫 번째 좌석 원본:', seats[0]);
      console.log('마지막 좌석 원본:', seats[seats.length - 1]);
      
      // 백엔드 DTO 형식에 맞게 데이터 변환 - 모든 필수 필드 보장
      const layoutData = {
        seats: seats.map((seat, index) => {
          // 각 필드에 대해 안전한 기본값 제공
          const seatData = {
            id: seat.id || `seat-${Date.now()}-${index}`,
            x: seat.x !== undefined && seat.x !== null ? Math.round(Number(seat.x)) : 100 + (index % 10) * 50,
            y: seat.y !== undefined && seat.y !== null ? Math.round(Number(seat.y)) : 150 + Math.floor(index / 10) * 60,
            type: seat.type || seat.seatType || 'REGULAR',
            section: seat.section !== undefined && seat.section !== null ? Number(seat.section) : 
                    seat.sectionId !== undefined && seat.sectionId !== null ? Number(seat.sectionId) : 1,
            label: seat.label || seat.seatLabel || `A${index + 1}`,
            price: seat.price !== undefined && seat.price !== null ? Number(seat.price) : 50000,
            isActive: seat.isActive !== undefined ? Boolean(seat.isActive) : true,
            rotation: seat.rotation !== undefined && seat.rotation !== null ? Number(seat.rotation) : 0
          };
          
          // 추가 검증 및 정리
          if (!seatData.type || seatData.type === 'undefined' || typeof seatData.type !== 'string') {
            seatData.type = 'REGULAR';
          }
          if (!seatData.label || seatData.label === 'undefined' || typeof seatData.label !== 'string') {
            seatData.label = `A${index + 1}`;
          }
          if (isNaN(seatData.section) || seatData.section < 1) {
            seatData.section = 1;
          }
          if (isNaN(seatData.price) || seatData.price < 0) {
            seatData.price = 50000;
          }
          if (isNaN(seatData.x) || seatData.x < 0) {
            seatData.x = 100 + (index % 10) * 50;
          }
          if (isNaN(seatData.y) || seatData.y < 0) {
            seatData.y = 150 + Math.floor(index / 10) * 60;
          }
          
          return seatData;
        }),
        sections: Object.entries(sections).map(([id, section]) => ({
          id: parseInt(id) || 1,
          name: section?.name || `${id}구역`,
          color: section?.color || '#FF6B6B'
        })),
        stage: {
          x: stage?.x !== undefined ? Math.round(Number(stage.x + 50)) : 200,
          y: stage?.y !== undefined ? Math.round(Number(stage.y + 30)) : 50,
          width: stage?.width !== undefined ? Math.round(Number(stage.width)) : 200,
          height: stage?.height !== undefined ? Math.round(Number(stage.height)) : 60,
          rotation: 0
        },
        canvas: {
          width: canvasSize?.width || 800,
          height: canvasSize?.height || 600,
          gridSize: 40
        },
        editMode: 'flexible'
      };

      // 상세 로깅
      console.log('=== 전송할 데이터 분석 ===');
      console.log('총 좌석 수:', layoutData.seats.length);
      console.log('첫 번째 좌석:', layoutData.seats[0]);
      console.log('마지막 좌석:', layoutData.seats[layoutData.seats.length - 1]);
      console.log('섹션 정보:', layoutData.sections);
      console.log('무대 정보:', layoutData.stage);
      console.log('캔버스 정보:', layoutData.canvas);
      
      // 데이터 유효성 사전 검사
      const invalidSeats = layoutData.seats.filter((seat, index) => {
        const issues = [];
        if (!seat.type || typeof seat.type !== 'string') issues.push('type');
        if (!seat.label || typeof seat.label !== 'string') issues.push('label');
        if (seat.section === null || seat.section === undefined || isNaN(seat.section)) issues.push('section');
        if (seat.price === null || seat.price === undefined || isNaN(seat.price)) issues.push('price');
        if (seat.x === null || seat.x === undefined || isNaN(seat.x)) issues.push('x');
        if (seat.y === null || seat.y === undefined || isNaN(seat.y)) issues.push('y');
        
        if (issues.length > 0) {
          console.log(`좌석 ${index} 문제:`, seat, '누락된 필드:', issues);
          return true;
        }
        return false;
      });
      
      if (invalidSeats.length > 0) {
        console.error('=== 유효하지 않은 좌석 데이터 ===');
        console.error('개수:', invalidSeats.length);
        console.error('처음 5개:', invalidSeats.slice(0, 5));
        alert(`저장할 수 없습니다. ${invalidSeats.length}개의 좌석에 필수 정보가 누락되었습니다.\n\n콘솔을 확인하여 상세 정보를 확인하세요.`);
        return;
      }
      
      console.log('=== 유효성 검사 통과, API 호출 시작 ===');
      console.log('전송할 JSON:', JSON.stringify(layoutData, null, 2));

      const response = await seatLayoutAPI.saveVenueLayout(venueId, layoutData);
      
      console.log('=== API 응답 ===');
      console.log('응답 전체:', response);
      
      if (response?.success) {
        alert('좌석 배치가 저장되었습니다!');
      } else {
        console.error('저장 응답 오류:', response);
        alert(`저장에 실패했습니다: ${response?.error || response?.message || '알 수 없는 오류'}`);
      }
    } catch (error) {
      console.error('=== 저장 중 예외 발생 ===');
      console.error('에러 객체:', error);
      console.error('에러 응답:', error.response);
      console.error('에러 응답 데이터:', error.response?.data);
      
      let errorMessage = '저장 중 오류가 발생했습니다.';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // 백엔드 유효성 검사 세부 오류가 있다면 표시
      if (error.response?.data?.data && typeof error.response.data.data === 'object') {
        console.error('=== 백엔드 유효성 검사 오류 세부사항 ===');
        const validationErrors = error.response.data.data;
        Object.keys(validationErrors).forEach(key => {
          console.error(`${key}: ${validationErrors[key]}`);
        });
        
        const errorCount = Object.keys(validationErrors).length;
        errorMessage += `\n\n총 ${errorCount}개의 유효성 검사 오류가 있습니다. 콘솔을 확인하세요.`;
      }
      
      alert(`저장 실패: ${errorMessage}`);
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
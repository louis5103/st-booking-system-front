import React, { useState, useCallback, useEffect } from 'react';
import { venueAPI, seatLayoutAPI } from '../services/api';

// 좌석 타입 정의
const SEAT_TYPES = {
  REGULAR: { color: '#3B82F6', name: '일반석', price: 50000 },
  VIP: { color: '#F59E0B', name: 'VIP석', price: 100000 },
  PREMIUM: { color: '#8B5CF6', name: '프리미엄석', price: 75000 },
  WHEELCHAIR: { color: '#10B981', name: '휠체어석', price: 50000 },
  BLOCKED: { color: '#6B7280', name: '막힌 좌석', price: 0 }
};

// 섹션 색상 팔레트
const SECTION_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', 
  '#FF8A80', '#82B1FF', '#B39DDB', '#A5D6A7', '#FFCC80'
];

// 좌석 컴포넌트
const SeatComponent = ({ seat, isSelected, onSelect, onContextMenu, gridSize = 40 }) => {
  const seatType = SEAT_TYPES[seat.type] || SEAT_TYPES.REGULAR;
  
  return (
    <div
      className={`seat ${isSelected ? 'selected' : ''} ${seat.type.toLowerCase()}`}
      style={{
        left: seat.x * gridSize,
        top: seat.y * gridSize,
        backgroundColor: seatType.color,
        border: `3px solid ${isSelected ? '#FF6600' : '#FFFFFF'}`,
        color: 'white',
        width: gridSize - 4,
        height: gridSize - 4,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '8px',
        fontSize: '10px',
        fontWeight: 'bold',
        cursor: 'pointer',
        userSelect: 'none',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        transition: 'all 0.2s ease',
        position: 'absolute',
        zIndex: isSelected ? 10 : 1
      }}
      onClick={onSelect}
      onContextMenu={onContextMenu}
      title={`${seat.label} (${seatType.name})`}
    >
      {seat.label}
    </div>
  );
};

// 그리드 헬퍼 컴포넌트
const GridOverlay = ({ width, height, gridSize = 40, showGrid = true }) => {
  if (!showGrid) return null;
  
  const cols = Math.floor(width / gridSize);
  const rows = Math.floor(height / gridSize);
  
  return (
    <svg
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0
      }}
    >
      {/* 세로선 */}
      {Array.from({ length: cols + 1 }, (_, i) => (
        <line
          key={`v-${i}`}
          x1={i * gridSize}
          y1={0}
          x2={i * gridSize}
          y2={height}
          stroke="#E5E7EB"
          strokeWidth="1"
          opacity="0.5"
        />
      ))}
      {/* 가로선 */}
      {Array.from({ length: rows + 1 }, (_, i) => (
        <line
          key={`h-${i}`}
          x1={0}
          y1={i * gridSize}
          x2={width}
          y2={i * gridSize}
          stroke="#E5E7EB"
          strokeWidth="1"
          opacity="0.5"
        />
      ))}
    </svg>
  );
};

// 무대 컴포넌트
const Stage = ({ stage }) => {
  return (
    <div
      style={{
        position: 'absolute',
        left: stage.x,
        top: stage.y,
        width: stage.width,
        height: stage.height,
        backgroundColor: '#1F2937',
        border: '2px solid #374151',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontSize: '16px',
        fontWeight: 'bold',
        zIndex: 5,
        boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
      }}
    >
      STAGE
    </div>
  );
};

// 섹션 관리 패널
const SectionPanel = ({ sections, selectedSection, onSectionSelect, onSectionUpdate, onSectionAdd }) => {
  const [editingSection, setEditingSection] = useState(null);
  const [tempName, setTempName] = useState('');
  const [tempColor, setTempColor] = useState('');

  const handleEdit = (sectionId) => {
    const section = sections.find(s => s.id === sectionId);
    setEditingSection(sectionId);
    setTempName(section.name);
    setTempColor(section.color);
  };

  const handleSave = () => {
    onSectionUpdate(editingSection, tempName, tempColor);
    setEditingSection(null);
  };

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ margin: 0, color: '#2C3E50' }}>🏛️ 섹션 관리</h3>
        <button
          onClick={onSectionAdd}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#007BFF',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.875rem'
          }}
        >
          + 추가
        </button>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {sections.map((section) => (
          <div
            key={section.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem',
              border: selectedSection === section.id ? '2px solid #007BFF' : '2px solid #E9ECEF',
              borderRadius: '8px',
              backgroundColor: selectedSection === section.id ? '#E3F2FD' : '#FFFFFF',
              cursor: 'pointer'
            }}
            onClick={() => onSectionSelect(section.id)}
          >
            <div
              style={{
                width: '16px',
                height: '16px',
                backgroundColor: section.color,
                borderRadius: '4px',
                border: '2px solid white',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }}
            />
            {editingSection === section.id ? (
              <div style={{ display: 'flex', gap: '0.5rem', flex: 1 }}>
                <input
                  type="text"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  style={{ flex: 1, padding: '0.25rem', border: '1px solid #CED4DA', borderRadius: '4px' }}
                />
                <input
                  type="color"
                  value={tempColor}
                  onChange={(e) => setTempColor(e.target.value)}
                  style={{ width: '40px', height: '30px', border: 'none', borderRadius: '4px' }}
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSave();
                  }}
                  style={{
                    padding: '0.25rem 0.5rem',
                    backgroundColor: '#28A745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.75rem'
                  }}
                >
                  저장
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingSection(null);
                  }}
                  style={{
                    padding: '0.25rem 0.5rem',
                    backgroundColor: '#6C757D',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.75rem'
                  }}
                >
                  취소
                </button>
              </div>
            ) : (
              <>
                <span style={{ flex: 1, fontWeight: '600', color: '#2C3E50' }}>
                  {section.name} ({section.seatCount}석)
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(section.id);
                  }}
                  style={{
                    padding: '0.25rem 0.5rem',
                    backgroundColor: '#6C757D',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.75rem'
                  }}
                >
                  편집
                </button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// 메인 좌석 배치 에디터
const SeatLayoutEditor = ({ venueId, onClose }) => {
  const [seats, setSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [sections, setSections] = useState([]);
  const [selectedSection, setSelectedSection] = useState(1);
  const [selectedSeatType, setSelectedSeatType] = useState('REGULAR');
  const [stage, setStage] = useState({ x: 200, y: 50, width: 200, height: 60 });
  const [currentTool, setCurrentTool] = useState('add'); // add, select, delete
  const [showGrid, setShowGrid] = useState(true);
  const [canvasSize] = useState({ width: 800, height: 600 });
  const [gridSize] = useState(40);
  const [loading, setLoading] = useState(false);
  const [statistics, setStatistics] = useState(null);

  // 데이터 로드
  useEffect(() => {
    if (venueId) {
      loadSeatLayout();
    } else {
      // 기본 섹션 설정
      setSections([
        { id: 1, name: '1구역', color: '#FF6B6B', seatCount: 0 },
        { id: 2, name: '2구역', color: '#4ECDC4', seatCount: 0 },
        { id: 3, name: '3구역', color: '#45B7D1', seatCount: 0 }
      ]);
    }
  }, [venueId]);

  const loadSeatLayout = async () => {
    try {
      setLoading(true);
      const response = await seatLayoutAPI.getVenueLayout(venueId);
      
      setSeats(response.seats || []);
      setSections(response.sections || []);
      setStage(response.stage || { x: 200, y: 50, width: 200, height: 60 });
      setStatistics(response.statistics);
      
      if (response.sections && response.sections.length > 0) {
        setSelectedSection(response.sections[0].id);
      }
    } catch (error) {
      console.error('좌석 배치 로드 실패:', error);
      // 기본 섹션 설정
      setSections([
        { id: 1, name: '1구역', color: '#FF6B6B', seatCount: 0 },
        { id: 2, name: '2구역', color: '#4ECDC4', seatCount: 0 },
        { id: 3, name: '3구역', color: '#45B7D1', seatCount: 0 }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // 템플릿 적용
  const applyTemplate = useCallback(async (templateName) => {
    try {
      setLoading(true);
      const response = await seatLayoutAPI.applyTemplate(venueId, templateName);
      
      setSeats(response.seats || []);
      setSections(response.sections || []);
      setStatistics(response.statistics);
      setSelectedSeats([]);
    } catch (error) {
      console.error('템플릿 적용 실패:', error);
      alert('템플릿 적용 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [venueId]);

  // 캔버스 클릭 핸들러
  const handleCanvasClick = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / gridSize);
    const y = Math.floor((e.clientY - rect.top) / gridSize);

    if (currentTool === 'add') {
      // 좌석 추가
      const existingSeat = seats.find(seat => seat.x === x && seat.y === y);
      if (existingSeat) return;

      const currentSection = sections.find(s => s.id === selectedSection);
      if (!currentSection) return;

      const newSeat = {
        id: `seat-${Date.now()}`,
        x,
        y,
        type: selectedSeatType,
        section: selectedSection,
        label: `${currentSection.name}-${seats.length + 1}`,
        price: SEAT_TYPES[selectedSeatType].price,
        isActive: true
      };

      setSeats(prev => [...prev, newSeat]);
    }
  }, [currentTool, seats, selectedSeatType, selectedSection, sections, gridSize]);

  // 좌석 선택 핸들러
  const handleSeatSelect = useCallback((seat) => {
    if (currentTool === 'select') {
      setSelectedSeats(prev => {
        const isSelected = prev.some(s => s.id === seat.id);
        if (isSelected) {
          return prev.filter(s => s.id !== seat.id);
        } else {
          return [...prev, seat];
        }
      });
    } else if (currentTool === 'delete') {
      setSeats(prev => prev.filter(s => s.id !== seat.id));
      setSelectedSeats(prev => prev.filter(s => s.id !== seat.id));
    }
  }, [currentTool]);

  // 좌석 컨텍스트 메뉴
  const handleSeatContextMenu = useCallback((e, seat) => {
    e.preventDefault();
    // 우클릭으로 좌석 삭제
    setSeats(prev => prev.filter(s => s.id !== seat.id));
    setSelectedSeats(prev => prev.filter(s => s.id !== seat.id));
  }, []);

  // 선택된 좌석들 업데이트
  const updateSelectedSeats = useCallback((updates) => {
    setSeats(prev => prev.map(seat => {
      if (selectedSeats.some(s => s.id === seat.id)) {
        return { ...seat, ...updates };
      }
      return seat;
    }));
    
    // 선택된 좌석들의 라벨 업데이트
    if (updates.section) {
      const targetSection = sections.find(s => s.id === updates.section);
      if (targetSection) {
        setSeats(prev => prev.map(seat => {
          if (selectedSeats.some(s => s.id === seat.id)) {
            return { 
              ...seat, 
              ...updates,
              label: `${targetSection.name}-${Math.floor(Math.random() * 1000)}`
            };
          }
          return seat;
        }));
      }
    }
  }, [selectedSeats, sections]);

  // 섹션 추가
  const addSection = useCallback(() => {
    const newId = Math.max(...sections.map(s => s.id)) + 1;
    const newColor = SECTION_COLORS[newId % SECTION_COLORS.length];
    const newSection = { 
      id: newId, 
      name: `${newId}구역`, 
      color: newColor, 
      seatCount: 0 
    };
    setSections(prev => [...prev, newSection]);
    setSelectedSection(newId);
  }, [sections]);

  // 섹션 업데이트
  const updateSection = useCallback((sectionId, name, color) => {
    setSections(prev => prev.map(section => 
      section.id === sectionId 
        ? { ...section, name, color }
        : section
    ));
  }, []);

  // 저장 기능
  const saveLayout = useCallback(async () => {
    setLoading(true);
    try {
      const layoutData = {
        seats: seats,
        sections: sections,
        stage: stage,
        canvas: { width: canvasSize.width, height: canvasSize.height, gridSize: gridSize }
      };

      await seatLayoutAPI.saveVenueLayout(venueId, layoutData);
      alert('좌석 배치가 저장되었습니다!');
    } catch (error) {
      console.error('저장 실패:', error);
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [venueId, seats, sections, stage, canvasSize, gridSize]);

  // 전체 삭제
  const clearAllSeats = useCallback(() => {
    if (window.confirm('모든 좌석을 삭제하시겠습니까?')) {
      setSeats([]);
      setSelectedSeats([]);
    }
  }, []);

  if (loading && seats.length === 0) {
    return (
      <div style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0, 
        backgroundColor: '#F8F9FA', 
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            width: '48px', 
            height: '48px', 
            border: '4px solid #e9ecef', 
            borderTop: '4px solid #007bff', 
            borderRadius: '50%', 
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }} />
          <p>좌석 배치를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      right: 0, 
      bottom: 0, 
      backgroundColor: '#F8F9FA', 
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* 헤더 */}
      <div style={{
        padding: '1rem 2rem',
        backgroundColor: 'white',
        borderBottom: '2px solid #E9ECEF',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div>
          <h2 style={{ margin: 0, color: '#2C3E50' }}>🎭 좌석 배치 에디터</h2>
          <p style={{ margin: '0.25rem 0 0 0', color: '#6C757D', fontSize: '0.875rem' }}>
            총 {seats.length}개 좌석 | 선택된 좌석: {selectedSeats.length}개
            {statistics && ` | 예상 수익: ${statistics.totalRevenue?.toLocaleString()}원`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button
            onClick={saveLayout}
            disabled={loading}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#007BFF',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '0.875rem',
              fontWeight: '600'
            }}
          >
            {loading ? '💾 저장 중...' : '💾 저장'}
          </button>
          <button
            onClick={onClose}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#6C757D',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '600'
            }}
          >
            ✖️ 닫기
          </button>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* 사이드바 */}
        <div style={{
          width: '320px',
          backgroundColor: 'white',
          padding: '1.5rem',
          overflowY: 'auto',
          borderRight: '1px solid #E9ECEF'
        }}>
          {/* 도구 선택 */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ margin: '0 0 1rem 0', color: '#2C3E50' }}>🔧 도구</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {[
                { key: 'add', label: '➕ 좌석 추가', color: '#28A745' },
                { key: 'select', label: '🎯 좌석 선택', color: '#FFC107' },
                { key: 'delete', label: '🗑️ 좌석 삭제', color: '#DC3545' }
              ].map(tool => (
                <button
                  key={tool.key}
                  onClick={() => setCurrentTool(tool.key)}
                  style={{
                    padding: '0.75rem',
                    backgroundColor: currentTool === tool.key ? tool.color : '#F8F9FA',
                    color: currentTool === tool.key ? 'white' : '#495057',
                    border: `2px solid ${currentTool === tool.key ? tool.color : '#E9ECEF'}`,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    textAlign: 'left'
                  }}
                >
                  {tool.label}
                </button>
              ))}
            </div>
          </div>

          {/* 템플릿 */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ margin: '0 0 1rem 0', color: '#2C3E50' }}>🏛️ 템플릿</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {[
                { key: 'small_theater', name: '소형 극장 (10행 8열)' },
                { key: 'medium_theater', name: '중형 극장 (15행 12열)' },
                { key: 'large_theater', name: '대형 극장 (20행 16열)' },
                { key: 'concert_hall', name: '콘서트홀 (25행 20열)' }
              ].map(template => (
                <button
                  key={template.key}
                  onClick={() => applyTemplate(template.key)}
                  disabled={loading}
                  style={{
                    padding: '0.75rem',
                    backgroundColor: '#F8F9FA',
                    color: '#495057',
                    border: '2px solid #E9ECEF',
                    borderRadius: '8px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontSize: '0.875rem',
                    textAlign: 'left',
                    opacity: loading ? 0.6 : 1
                  }}
                >
                  {template.name}
                </button>
              ))}
            </div>
          </div>

          {/* 섹션 관리 */}
          <SectionPanel
            sections={sections}
            selectedSection={selectedSection}
            onSectionSelect={setSelectedSection}
            onSectionUpdate={updateSection}
            onSectionAdd={addSection}
          />

          {/* 좌석 타입 */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ margin: '0 0 1rem 0', color: '#2C3E50' }}>🪑 좌석 타입</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {Object.entries(SEAT_TYPES).map(([type, info]) => (
                <button
                  key={type}
                  onClick={() => setSelectedSeatType(type)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem',
                    backgroundColor: selectedSeatType === type ? info.color : '#F8F9FA',
                    color: selectedSeatType === type ? 'white' : '#495057',
                    border: `2px solid ${selectedSeatType === type ? info.color : '#E9ECEF'}`,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    textAlign: 'left'
                  }}
                >
                  <div
                    style={{
                      width: '16px',
                      height: '16px',
                      backgroundColor: info.color,
                      borderRadius: '4px'
                    }}
                  />
                  <div>
                    <div style={{ fontWeight: '600' }}>{info.name}</div>
                    <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>
                      {info.price.toLocaleString()}원
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 선택된 좌석 편집 */}
          {selectedSeats.length > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ margin: '0 0 1rem 0', color: '#2C3E50' }}>
                ✏️ 선택된 좌석 편집 ({selectedSeats.length}개)
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <button
                  onClick={() => updateSelectedSeats({ section: selectedSection })}
                  style={{
                    padding: '0.5rem',
                    backgroundColor: '#17A2B8',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.8rem'
                  }}
                >
                  선택된 섹션으로 이동
                </button>
                <button
                  onClick={() => updateSelectedSeats({ type: selectedSeatType })}
                  style={{
                    padding: '0.5rem',
                    backgroundColor: '#8B5CF6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.8rem'
                  }}
                >
                  선택된 타입으로 변경
                </button>
                <button
                  onClick={() => {
                    setSeats(prev => prev.filter(seat => !selectedSeats.some(s => s.id === seat.id)));
                    setSelectedSeats([]);
                  }}
                  style={{
                    padding: '0.5rem',
                    backgroundColor: '#DC3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.8rem'
                  }}
                >
                  선택된 좌석 삭제
                </button>
              </div>
            </div>
          )}

          {/* 관리 기능 */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ margin: '0 0 1rem 0', color: '#2C3E50' }}>🔧 관리</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <button
                onClick={clearAllSeats}
                style={{
                  padding: '0.5rem',
                  backgroundColor: '#DC3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.8rem'
                }}
              >
                🗑️ 전체 삭제
              </button>
            </div>
          </div>

          {/* 옵션 */}
          <div>
            <h3 style={{ margin: '0 0 1rem 0', color: '#2C3E50' }}>⚙️ 옵션</h3>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={showGrid}
                onChange={(e) => setShowGrid(e.target.checked)}
                style={{ accentColor: '#007BFF' }}
              />
              <span style={{ fontSize: '0.875rem', color: '#495057' }}>격자 표시</span>
            </label>
          </div>
        </div>

        {/* 캔버스 영역 */}
        <div style={{ 
          flex: 1, 
          padding: '2rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#F8F9FA'
        }}>
          <div style={{
            position: 'relative',
            width: canvasSize.width,
            height: canvasSize.height,
            backgroundColor: 'white',
            border: '3px solid #DEE2E6',
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            cursor: currentTool === 'add' ? 'crosshair' : 'default'
          }}
          onClick={handleCanvasClick}
          >
            {/* 격자 */}
            <GridOverlay 
              width={canvasSize.width} 
              height={canvasSize.height} 
              gridSize={gridSize} 
              showGrid={showGrid} 
            />
            
            {/* 무대 */}
            <Stage stage={stage} />
            
            {/* 좌석들 */}
            {seats.map(seat => (
              <SeatComponent
                key={seat.id}
                seat={seat}
                isSelected={selectedSeats.some(s => s.id === seat.id)}
                onSelect={() => handleSeatSelect(seat)}
                onContextMenu={(e) => handleSeatContextMenu(e, seat)}
                gridSize={gridSize}
              />
            ))}
          </div>
          
          {/* 도움말 */}
          <div style={{
            marginTop: '1rem',
            padding: '1rem',
            backgroundColor: 'white',
            border: '1px solid #E9ECEF',
            borderRadius: '8px',
            fontSize: '0.875rem',
            color: '#6C757D',
            textAlign: 'center',
            maxWidth: '600px'
          }}>
            <strong>사용법:</strong> 
            {currentTool === 'add' && " 캔버스를 클릭하여 좌석을 추가하세요."}
            {currentTool === 'select' && " 좌석을 클릭하여 선택하세요. 다중 선택 가능합니다."}
            {currentTool === 'delete' && " 좌석을 클릭하거나 우클릭하여 삭제하세요."}
          </div>
        </div>
      </div>

      {/* CSS 애니메이션 */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default SeatLayoutEditor;

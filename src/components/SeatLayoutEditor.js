import React, { useState, useCallback, useEffect, useRef } from 'react';
import { venueAPI, seatLayoutAPI } from '../services/api';

// 좌석 타입 정의 (가격과 아이콘 포함)
const SEAT_TYPES = {
  REGULAR: { color: '#3B82F6', name: '일반석', price: 50000, icon: '💺' },
  VIP: { color: '#F59E0B', name: 'VIP석', price: 100000, icon: '👑' },
  PREMIUM: { color: '#8B5CF6', name: '프리미엄석', price: 75000, icon: '⭐' },
  WHEELCHAIR: { color: '#10B981', name: '휠체어석', price: 50000, icon: '♿' },
  BLOCKED: { color: '#6B7280', name: '막힌 좌석', price: 0, icon: '❌' }
};

// 편집 도구
const EDIT_TOOLS = {
  SELECT: 'select',
  ADD_SEAT: 'add_seat', 
  DELETE: 'delete',
  MOVE: 'move'
};

// 템플릿 목록 (백엔드와 일치하는 이름으로 수정)
const TEMPLATES = {
  THEATER: { name: '극장형', rows: 20, cols: 30, description: '전통적인 극장 배치', backendKey: 'theater' },
  CONCERT: { name: '콘서트홀', rows: 15, cols: 40, description: '콘서트에 최적화', backendKey: 'concert_hall' },
  CLASSROOM: { name: '강의실', rows: 10, cols: 20, description: '교육용 배치', backendKey: 'classroom' },
  STADIUM: { name: '스타디움', rows: 50, cols: 60, description: '대규모 경기장', backendKey: 'stadium' },
  SMALL_THEATER: { name: '소형 극장', rows: 10, cols: 15, description: '소규모 공연장', backendKey: 'small_theater' },
  LARGE_THEATER: { name: '대형 극장', rows: 25, cols: 40, description: '대규모 극장', backendKey: 'large_theater' }
};

const SeatLayoutEditor = ({ venueId = 1 }) => {
  // 상태 관리
  const [seats, setSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [currentTool, setCurrentTool] = useState(EDIT_TOOLS.SELECT);
  const [currentSeatType, setCurrentSeatType] = useState('REGULAR');
  const [canvas, setCanvas] = useState({ width: 1000, height: 700, gridSize: 40 });
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const [editMode, setEditMode] = useState('grid'); // 'grid' 또는 'flexible'
  const [showGrid, setShowGrid] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [statistics, setStatistics] = useState({});
  const [showHelp, setShowHelp] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 }); // 마우스 위치
  const [showCoordinates, setShowCoordinates] = useState(true); // 좌표 표시
  const [previewSeat, setPreviewSeat] = useState(null); // 좌석 미리보기

  // 참조
  const canvasRef = useRef(null);

  // 그리드 스냅 함수
  const snapToGrid = useCallback((x, y) => {
    if (editMode === 'flexible') return { x, y };
    const { gridSize } = canvas;
    return {
      x: Math.round(x / gridSize) * gridSize,
      y: Math.round(y / gridSize) * gridSize
    };
  }, [canvas.gridSize, editMode]);

  // 좌석 라벨 생성 (올바른 행/열 계산)
  const generateSeatLabel = useCallback((x, y) => {
    const { gridSize } = canvas;
    const row = Math.floor(y / gridSize);
    const col = Math.floor(x / gridSize);
    
    // 행은 A, B, C... 형식으로, 열은 1, 2, 3... 형식으로
    const rowLabel = String.fromCharCode(65 + row); // A=65
    const colLabel = col + 1;
    
    return `${rowLabel}${colLabel}`;
  }, [canvas.gridSize]);

  // 좌석 추가
  const addSeat = useCallback((x, y, type = currentSeatType) => {
    const snapped = snapToGrid(x, y);
    
    // 이미 해당 위치에 좌석이 있는지 확인
    const existingSeat = seats.find(seat => 
      Math.abs(seat.x - snapped.x) < 20 && Math.abs(seat.y - snapped.y) < 20
    );
    if (existingSeat) return;

    const newSeat = {
      id: `seat_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
      x: snapped.x,
      y: snapped.y,
      type: type,
      label: generateSeatLabel(snapped.x, snapped.y),
      price: SEAT_TYPES[type]?.price || 50000,
      isAvailable: true,
      rotation: 0
    };

    setSeats(prev => {
      const updated = [...prev, newSeat];
      return updated;
    });
  }, [seats, currentSeatType, snapToGrid, generateSeatLabel]);

  // 좌석 삭제
  const deleteSeat = useCallback((seatId) => {
    setSeats(prev => prev.filter(seat => seat.id !== seatId));
    setSelectedSeats(prev => prev.filter(id => id !== seatId));
  }, []);

  // 여러 좌석 삭제
  const deleteSelectedSeats = useCallback(() => {
    if (selectedSeats.length === 0) return;
    
    if (window.confirm(`선택된 ${selectedSeats.length}개의 좌석을 삭제하시겠습니까?`)) {
      setSeats(prev => prev.filter(seat => !selectedSeats.includes(seat.id)));
      setSelectedSeats([]);
    }
  }, [selectedSeats]);

  // 좌석 이동
  const moveSeat = useCallback((seatId, newX, newY) => {
    const snapped = snapToGrid(newX, newY);
    
    setSeats(prev => prev.map(seat => 
      seat.id === seatId 
        ? { ...seat, x: snapped.x, y: snapped.y, label: generateSeatLabel(snapped.x, snapped.y) }
        : seat
    ));
  }, [snapToGrid, generateSeatLabel]);

  // 좌석 선택
  const selectSeat = useCallback((seatId, multiSelect = false) => {
    if (multiSelect) {
      setSelectedSeats(prev => 
        prev.includes(seatId) 
          ? prev.filter(id => id !== seatId)
          : [...prev, seatId]
      );
    } else {
      setSelectedSeats([seatId]);
    }
  }, []);

  // 선택된 좌석의 타입 변경
  const changeSelectedSeatsType = useCallback((type) => {
    setSeats(prev => prev.map(seat => 
      selectedSeats.includes(seat.id)
        ? { ...seat, type, price: SEAT_TYPES[type]?.price || 50000 }
        : seat
    ));
  }, [selectedSeats]);

  // 캔버스 마우스 이동 처리
  const handleCanvasMouseMove = useCallback((e) => {
    if (!canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setMousePosition({ x, y });
    
    if (currentTool === EDIT_TOOLS.ADD_SEAT && !isDragging) {
      const snapped = snapToGrid(x, y);
      const existingSeat = seats.find(seat => 
        Math.abs(seat.x - snapped.x) < 20 && Math.abs(seat.y - snapped.y) < 20
      );
      
      if (!existingSeat) {
        setPreviewSeat({
          x: snapped.x,
          y: snapped.y,
          label: generateSeatLabel(snapped.x, snapped.y),
          type: currentSeatType
        });
      } else {
        setPreviewSeat(null);
      }
    } else {
      setPreviewSeat(null);
    }
  }, [currentTool, isDragging, seats, snapToGrid, generateSeatLabel, currentSeatType]);
  
  // 캔버스 마우스 나가기 처리
  const handleCanvasMouseLeave = useCallback(() => {
    setPreviewSeat(null);
  }, []);
  
  // 캔버스 클릭 처리
  const handleCanvasClick = useCallback((e) => {
    if (isLoading || currentTool !== EDIT_TOOLS.ADD_SEAT) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    addSeat(x, y);
  }, [currentTool, addSeat, isLoading]);

  // 좌석 클릭 처리
  const handleSeatClick = useCallback((e, seat) => {
    e.stopPropagation();
    
    switch (currentTool) {
      case EDIT_TOOLS.SELECT:
        selectSeat(seat.id, e.ctrlKey || e.metaKey);
        break;
      case EDIT_TOOLS.DELETE:
        deleteSeat(seat.id);
        break;
      case EDIT_TOOLS.ADD_SEAT:
        // 기존 좌석 위에 다른 타입으로 변경
        if (seat.type !== currentSeatType) {
          setSeats(prev => prev.map(s => 
            s.id === seat.id ? { ...s, type: currentSeatType, price: SEAT_TYPES[currentSeatType]?.price || 50000 } : s
          ));
        }
        break;
    }
  }, [currentTool, selectSeat, deleteSeat, currentSeatType]);

  // 드래그 시작
  const handleMouseDown = useCallback((e, seat) => {
    if (currentTool === EDIT_TOOLS.MOVE) {
      setIsDragging(true);
      const rect = canvasRef.current.getBoundingClientRect();
      setDragStart({ 
        x: e.clientX - rect.left, 
        y: e.clientY - rect.top, 
        seatX: seat.x, 
        seatY: seat.y,
        seatId: seat.id 
      });
    }
  }, [currentTool]);

  // 드래그 중
  const handleMouseMove = useCallback((e) => {
    if (!isDragging || !dragStart) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const newX = dragStart.seatX + (e.clientX - rect.left - dragStart.x);
    const newY = dragStart.seatY + (e.clientY - rect.top - dragStart.y);

    moveSeat(dragStart.seatId, newX, newY);
  }, [isDragging, dragStart, moveSeat]);

  // 드래그 끝
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDragStart(null);
  }, []);

  // 템플릿 적용
  const applyTemplate = useCallback(async (templateName) => {
    const template = TEMPLATES[templateName];
    if (!template) return;

    setIsLoading(true);
    
    try {
      // API 호출 시도 (백엔드 키 사용)
      const response = await seatLayoutAPI.applyTemplate(venueId, template.backendKey, {
        rows: template.rows,
        cols: template.cols,
        editMode: editMode
      });
      
      if (response && response.success && response.data) {
        setSeats(response.data.seats || []);
        setCanvas(prev => ({
          ...prev,
          width: template.cols * prev.gridSize,
          height: template.rows * prev.gridSize
        }));
        alert('템플릿이 적용되었습니다.');
      } else {
        throw new Error('백엔드 템플릿 적용 실패');
      }
    } catch (error) {
      console.error('템플릿 적용 실패:', error);
      
      // 로컬 템플릿 생성 (백엔드 실패 시)
      const newSeats = [];
      const { gridSize } = canvas;
      
      for (let row = 0; row < template.rows; row++) {
        for (let col = 0; col < template.cols; col++) {
          // 통로 생성 (가운데와 양쪽)
          if (col === Math.floor(template.cols / 2) || (col > 0 && col % 10 === 0)) continue;
          if (row > 0 && row % 15 === 0) continue; // 섹션별 통로

          const x = col * gridSize;
          const y = row * gridSize;
          
          // 앞 5행은 프리미엄, 중간은 VIP, 뒤는 일반석
          let seatType = 'REGULAR';
          if (row < 5) seatType = 'PREMIUM';
          else if (row < 10) seatType = 'VIP';

          newSeats.push({
            id: `seat_${row}_${col}_${Date.now()}`,
            x,
            y,
            type: seatType,
            label: generateSeatLabel(x, y),
            price: SEAT_TYPES[seatType].price,
            isAvailable: true,
            rotation: 0
          });
        }
      }

      setSeats(newSeats);
      setCanvas(prev => ({
        ...prev,
        width: template.cols * prev.gridSize,
        height: template.rows * prev.gridSize
      }));
      alert(`로컬 템플릿이 적용되었습니다. (${newSeats.length}개 좌석)`);
    } finally {
      setIsLoading(false);
    }
  }, [venueId, editMode, canvas, generateSeatLabel]);

  // 통계 업데이트
  const updateStatistics = useCallback((seatList) => {
    const currentSeats = seatList || [];
    const stats = {
      total: currentSeats.length,
      byType: {},
      totalRevenue: 0
    };

    Object.keys(SEAT_TYPES).forEach(type => {
      const typeSeats = currentSeats.filter(seat => seat.type === type);
      stats.byType[type] = {
        count: typeSeats.length,
        revenue: typeSeats.reduce((sum, seat) => sum + (seat.price || 0), 0)
      };
      stats.totalRevenue += stats.byType[type].revenue;
    });

    setStatistics(stats);
  }, []);

  // 좌석 정렬
  const alignSeats = useCallback((alignType) => {
    if (selectedSeats.length < 2) return;
    
    const selectedSeatObjects = seats.filter(seat => selectedSeats.includes(seat.id));
    
    switch (alignType) {
      case 'horizontal':
        const avgY = selectedSeatObjects.reduce((sum, seat) => sum + seat.y, 0) / selectedSeatObjects.length;
        setSeats(prev => prev.map(seat => 
          selectedSeats.includes(seat.id) ? { ...seat, y: avgY } : seat
        ));
        break;
      case 'vertical':
        const avgX = selectedSeatObjects.reduce((sum, seat) => sum + seat.x, 0) / selectedSeatObjects.length;
        setSeats(prev => prev.map(seat => 
          selectedSeats.includes(seat.id) ? { ...seat, x: avgX } : seat
        ));
        break;
      case 'grid':
        setSeats(prev => prev.map(seat => 
          selectedSeats.includes(seat.id) 
            ? { 
                ...seat, 
                x: Math.round(seat.x / canvas.gridSize) * canvas.gridSize,
                y: Math.round(seat.y / canvas.gridSize) * canvas.gridSize
              } 
            : seat
        ));
        break;
    }
  }, [selectedSeats, seats, canvas.gridSize]);

  // 좌석 배치 저장
  const saveSeatLayout = useCallback(async () => {
    setIsLoading(true);
    try {
      const layoutData = {
        venueId,
        seats,
        canvas,
        editMode,
        statistics
      };
      
      const response = await seatLayoutAPI.saveSeatLayout(venueId, layoutData);
      
      if (response && response.success) {
        alert('좌석 배치가 저장되었습니다.');
      } else {
        throw new Error(response?.error || '저장 실패');
      }
    } catch (error) {
      console.error('저장 실패:', error);
      alert('저장에 실패했습니다: ' + (error.message || '알 수 없는 오류'));
    } finally {
      setIsLoading(false);
    }
  }, [venueId, seats, canvas, editMode, statistics]);

  // 좌석 배치 불러오기
  const loadSeatLayout = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await seatLayoutAPI.getSeatLayout(venueId);
      
      if (response && response.success && response.data) {
        setSeats(response.data.seats || []);
        setCanvas(response.data.canvas || canvas);
        setEditMode(response.data.editMode || 'grid');
        // updateStatistics는 여기서 호출하지 않음 (useEffect에서 처리)
      } else {
        console.log('좌석 배치 데이터가 없습니다. 빈 상태로 시작합니다.');
      }
    } catch (error) {
      console.error('불러오기 실패:', error);
    } finally {
      setIsLoading(false);
    }
  }, [venueId]); // canvas 제거

  // 이벤트 리스너 등록
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // 키보드 단축키
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Delete' && selectedSeats.length > 0) {
        deleteSelectedSeats();
      } else if (e.key === 'Escape') {
        setSelectedSeats([]);
        setCurrentTool(EDIT_TOOLS.SELECT);
      } else if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 's':
            e.preventDefault();
            saveSeatLayout();
            break;
          case 'a':
            e.preventDefault();
            setSelectedSeats(seats.map(seat => seat.id));
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedSeats, deleteSelectedSeats, saveSeatLayout, seats]);

  // 초기 로드 (venueId가 변경될 때만)
  useEffect(() => {
    if (venueId) {
      loadSeatLayout();
    }
  }, [venueId]); // loadSeatLayout 제거
  
  // 통계 업데이트 (seats가 변경될 때만)
  useEffect(() => {
    if (seats.length >= 0) {
      updateStatistics(seats);
    }
  }, [seats]); // updateStatistics 제거

  return (
    <div style={{ 
      fontFamily: 'system-ui, -apple-system, sans-serif', 
      padding: '20px',
      backgroundColor: '#f8fafc',
      minHeight: 'auto', // 100vh에서 auto로 변경
      width: '100%'
    }}>
      {/* 헤더 */}
      <div style={{ 
        marginBottom: '20px', 
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <div>
            <h1 style={{ margin: '0 0 8px 0', color: '#1f2937', fontSize: '28px', fontWeight: '700' }}>
              🎭 좌석 배치 에디터
            </h1>
            <p style={{ margin: 0, color: '#6b7280', fontSize: '16px' }}>
              직관적인 드래그 앤 드롭으로 완벽한 좌석 배치를 만들어보세요
            </p>
          </div>
          <button
            onClick={() => setShowHelp(!showHelp)}
            style={{
              padding: '12px 20px',
              backgroundColor: showHelp ? '#3b82f6' : '#e5e7eb',
              color: showHelp ? 'white' : '#374151',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.2s'
            }}
          >
            {showHelp ? '❌ 도움말 닫기' : '❓ 도움말'}
          </button>
        </div>

        {/* 도움말 패널 */}
        {showHelp && (
          <div style={{
            backgroundColor: '#f0f9ff',
            border: '1px solid #0ea5e9',
            borderRadius: '8px',
            padding: '16px',
            marginTop: '16px'
          }}>
            <h3 style={{ margin: '0 0 12px 0', color: '#0369a1', fontSize: '18px' }}>📖 사용법 가이드</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '12px' }}>
              <div><strong>🖱️ 좌석 추가:</strong> '좌석 추가' 도구 선택 후 빈 공간 클릭</div>
              <div><strong>🎯 좌석 선택:</strong> '선택' 도구로 좌석 클릭 (Ctrl+클릭으로 다중 선택)</div>
              <div><strong>🔄 좌석 이동:</strong> '이동' 도구로 좌석을 드래그</div>
              <div><strong>🗑️ 좌석 삭제:</strong> '삭제' 도구로 좌석 클릭 또는 Delete 키</div>
              <div><strong>📐 정렬:</strong> 여러 좌석 선택 후 정렬 버튼 사용</div>
              <div><strong>⌨️ 단축키:</strong> Ctrl+A (전체 선택), Delete (선택 삭제), Esc (선택 해제)</div>
            </div>
          </div>
        )}
      </div>

      {/* 툴바 */}
      <div style={{ 
        display: 'flex', 
        gap: '20px', 
        marginBottom: '20px', 
        flexWrap: 'wrap',
        alignItems: 'center',
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '16px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        {/* 편집 도구 */}
        <div style={{ display: 'flex', gap: '4px', border: '1px solid #d1d5db', borderRadius: '8px', padding: '4px' }}>
          {Object.entries(EDIT_TOOLS).map(([key, tool]) => (
            <button
              key={tool}
              onClick={() => setCurrentTool(tool)}
              style={{
                padding: '10px 16px',
                border: 'none',
                borderRadius: '6px',
                backgroundColor: currentTool === tool ? '#3b82f6' : 'transparent',
                color: currentTool === tool ? 'white' : '#374151',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.2s'
              }}
            >
              {key === 'SELECT' && '🎯 선택'}
              {key === 'ADD_SEAT' && '➕ 좌석 추가'}
              {key === 'DELETE' && '🗑️ 삭제'}
              {key === 'MOVE' && '↔️ 이동'}
            </button>
          ))}
        </div>

        {/* 좌석 타입 선택 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>좌석 타입:</label>
          <select
            value={currentSeatType}
            onChange={(e) => setCurrentSeatType(e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              backgroundColor: 'white'
            }}
          >
            {Object.entries(SEAT_TYPES).map(([key, type]) => (
              <option key={key} value={key}>
                {type.icon} {type.name} ({type.price.toLocaleString()}원)
              </option>
            ))}
          </select>
        </div>

        {/* 편집 모드 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>모드:</label>
          <select
            value={editMode}
            onChange={(e) => setEditMode(e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              backgroundColor: 'white'
            }}
          >
            <option value="grid">🔲 그리드</option>
            <option value="flexible">🔄 자유배치</option>
          </select>
        </div>

        {/* 템플릿 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>템플릿:</label>
          <select
            onChange={(e) => e.target.value && applyTemplate(e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              backgroundColor: 'white'
            }}
            defaultValue=""
          >
            <option value="">템플릿 선택</option>
            {Object.entries(TEMPLATES).map(([key, template]) => (
              <option key={key} value={key}>
                🏛️ {template.name} ({template.rows}×{template.cols})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 선택된 좌석 관리 */}
      {selectedSeats.length > 0 && (
        <div style={{
          backgroundColor: '#fef3c7',
          border: '1px solid #f59e0b',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '14px', fontWeight: '600', color: '#92400e' }}>
              ✨ {selectedSeats.length}개 좌석 선택됨
            </span>
            
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={deleteSelectedSeats}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '500'
                }}
              >
                🗑️ 삭제
              </button>
              
              {selectedSeats.length > 1 && (
                <>
                  <button
                    onClick={() => alignSeats('horizontal')}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}
                  >
                    ↔️ 수평정렬
                  </button>
                  <button
                    onClick={() => alignSeats('vertical')}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}
                  >
                    ↕️ 수직정렬
                  </button>
                  <button
                    onClick={() => alignSeats('grid')}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}
                  >
                    📐 격자정렬
                  </button>
                </>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', color: '#92400e' }}>타입 변경:</span>
              {Object.entries(SEAT_TYPES).map(([key, type]) => (
                <button
                  key={key}
                  onClick={() => changeSelectedSeatsType(key)}
                  style={{
                    padding: '4px 8px',
                    backgroundColor: type.color,
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: '500'
                  }}
                  title={type.name}
                >
                  {type.icon}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 메인 컨테이너 */}
      <div style={{ 
        display: 'flex', 
        gap: '20px', 
        alignItems: 'flex-start',
        width: '100%',
        flexWrap: 'wrap', // 반응형 지원
        marginBottom: '40px' // 하단 여백 추가
      }}>
        {/* 캔버스 영역 */}
        <div style={{ 
          flex: 1,
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          minHeight: 'auto' // 고정 높이 제거
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px'
          }}>
            <h3 style={{ margin: 0, color: '#1f2937', fontSize: '18px' }}>🎪 무대 및 좌석 배치</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px' }}>
                <input
                  type="checkbox"
                  checked={showGrid}
                  onChange={(e) => setShowGrid(e.target.checked)}
                />
                그리드 표시
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px' }}>
                <input
                  type="checkbox"
                  checked={showLabels}
                  onChange={(e) => setShowLabels(e.target.checked)}
                />
                라벨 표시
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px' }}>
                <input
                  type="checkbox"
                  checked={showCoordinates}
                  onChange={(e) => setShowCoordinates(e.target.checked)}
                />
                좌표 표시
              </label>
            </div>
          </div>

          {/* 무대 */}
          <div style={{
            width: '100%',
            height: '60px',
            backgroundColor: '#1f2937',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '16px',
            fontWeight: '600',
            marginBottom: '40px',
            position: 'relative'
          }}>
            🎭 STAGE
            <div style={{
              position: 'absolute',
              bottom: '-20px',
              left: '50%',
              transform: 'translateX(-50%)',
              fontSize: '12px',
              color: '#6b7280'
            }}>
              무대
            </div>
          </div>

          {/* 캔버스 */}
          <div style={{ 
            position: 'relative', 
            border: '2px solid #e5e7eb', 
            borderRadius: '8px',
            maxHeight: '80vh', // 뷰포트 높이의 80%로 조정
            overflow: 'auto', // 스크롤 가능하도록
            backgroundColor: '#ffffff'
          }}>
            {isLoading && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ 
                    width: '40px', 
                    height: '40px', 
                    border: '4px solid #f3f4f6',
                    borderTop: '4px solid #3b82f6',
                    borderRadius: '50%',
                    margin: '0 auto 12px',
                    animation: 'spin 1s linear infinite'
                  }} />
                  <div style={{ color: '#374151', fontSize: '14px' }}>처리 중...</div>
                </div>
              </div>
            )}

            <div
              ref={canvasRef}
              onClick={handleCanvasClick}
              onMouseMove={handleCanvasMouseMove}
              onMouseLeave={handleCanvasMouseLeave}
              style={{
                width: Math.max(canvas.width, 800), // 최소 너비 보장
                height: Math.max(canvas.height, 500), // 최소 높이 보장
                position: 'relative',
                background: showGrid ? 
                  `radial-gradient(circle, #d1d5db 1px, transparent 1px)` : '#ffffff',
                backgroundSize: showGrid ? `${canvas.gridSize}px ${canvas.gridSize}px` : 'auto',
                cursor: currentTool === EDIT_TOOLS.ADD_SEAT ? 'crosshair' : 'default',
                minWidth: '100%', // 컴테이너 너비에 맞춤
                paddingBottom: '20px', // 하단 여백 추가
                border: showGrid ? '1px solid #e5e7eb' : 'none'
              }}
            >
              {/* 좌석들 렌더링 */}
              {seats.map(seat => {
                const seatType = SEAT_TYPES[seat.type] || SEAT_TYPES.REGULAR;
                const isSelected = selectedSeats.includes(seat.id);
                const seatSize = Math.min(canvas.gridSize - 4, 36); // 그리드 크기에 맞추되 최대 36px
                
                return (
                  <div
                    key={seat.id}
                    onClick={(e) => handleSeatClick(e, seat)}
                    onMouseDown={(e) => handleMouseDown(e, seat)}
                    style={{
                      position: 'absolute',
                      left: seat.x + (canvas.gridSize - seatSize) / 2, // 그리드 중앙에 배치
                      top: seat.y + (canvas.gridSize - seatSize) / 2,
                      width: `${seatSize}px`,
                      height: `${seatSize}px`,
                      backgroundColor: seatType.color,
                      border: `3px solid ${isSelected ? '#fbbf24' : 'rgba(255,255,255,0.8)'}`,
                      borderRadius: '8px',
                      cursor: currentTool === EDIT_TOOLS.MOVE ? 'grab' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: Math.max(10, seatSize / 3), // 크기에 비례하는 폰트
                      color: 'white',
                      fontWeight: '600',
                      boxShadow: isSelected ? '0 0 0 3px rgba(251, 191, 36, 0.3)' : '0 2px 4px rgba(0,0,0,0.1)',
                      transition: 'all 0.2s ease',
                      transform: isSelected ? 'scale(1.1)' : 'scale(1)',
                      zIndex: isSelected ? 100 : 1
                    }}
                    title={`${seat.label} (${seatType.name}) - ${seatType.price.toLocaleString()}원`}
                  >
                    <div style={{ textAlign: 'center', lineHeight: '1' }}>
                      <div style={{ fontSize: Math.max(8, seatSize / 4) }}>
                        {seatType.icon}
                      </div>
                      {showLabels && seatSize > 20 && (
                        <div style={{ fontSize: Math.max(6, seatSize / 6), marginTop: '1px' }}>
                          {seat.label}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              
              {/* 좌석 미리보기 */}
              {previewSeat && (
                <div
                  style={{
                    position: 'absolute',
                    left: previewSeat.x + (canvas.gridSize - Math.min(canvas.gridSize - 4, 36)) / 2,
                    top: previewSeat.y + (canvas.gridSize - Math.min(canvas.gridSize - 4, 36)) / 2,
                    width: `${Math.min(canvas.gridSize - 4, 36)}px`,
                    height: `${Math.min(canvas.gridSize - 4, 36)}px`,
                    backgroundColor: SEAT_TYPES[previewSeat.type]?.color || '#3B82F6',
                    border: '3px dashed #fbbf24',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: Math.max(10, Math.min(canvas.gridSize - 4, 36) / 3),
                    color: 'white',
                    fontWeight: '600',
                    opacity: 0.8,
                    pointerEvents: 'none',
                    zIndex: 200
                  }}
                >
                  <div style={{ textAlign: 'center', lineHeight: '1' }}>
                    <div style={{ fontSize: Math.max(8, Math.min(canvas.gridSize - 4, 36) / 4) }}>
                      {SEAT_TYPES[previewSeat.type]?.icon || '💺'}
                    </div>
                    {showLabels && Math.min(canvas.gridSize - 4, 36) > 20 && (
                      <div style={{ fontSize: Math.max(6, Math.min(canvas.gridSize - 4, 36) / 6), marginTop: '1px' }}>
                        {previewSeat.label}
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* 좌표 표시 */}
              {showCoordinates && (
                <div style={{
                  position: 'absolute',
                  top: '10px',
                  left: '10px',
                  background: 'rgba(0, 0, 0, 0.7)',
                  color: 'white',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  pointerEvents: 'none',
                  zIndex: 150
                }}>
                  마우스: ({Math.round(mousePosition.x)}, {Math.round(mousePosition.y)})
                  {currentTool === EDIT_TOOLS.ADD_SEAT && previewSeat && (
                    <div>
                      그리드: ({previewSeat.x}, {previewSeat.y}) | {previewSeat.label}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 도구 안내 */}
          <div style={{
            marginTop: '16px',
            padding: '12px',
            backgroundColor: '#f8fafc',
            borderRadius: '6px',
            fontSize: '13px',
            color: '#6b7280',
            textAlign: 'center'
          }}>
            {currentTool === EDIT_TOOLS.SELECT && "🎯 좌석을 클릭하여 선택하세요. Ctrl+클릭으로 다중 선택이 가능합니다."}
            {currentTool === EDIT_TOOLS.ADD_SEAT && "➕ 빈 공간을 클릭하여 좌석을 추가하세요. 노란색 점선으로 미리보기를 확인할 수 있습니다."}
            {currentTool === EDIT_TOOLS.DELETE && "🗑️ 삭제할 좌석을 클릭하세요."}
            {currentTool === EDIT_TOOLS.MOVE && "↔️ 좌석을 드래그하여 이동하세요."}
          </div>
        </div>

        {/* 사이드 패널 */}
        <div style={{ width: '320px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* 통계 패널 */}
          <div style={{ 
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', color: '#1f2937', display: 'flex', alignItems: 'center', gap: '8px' }}>
              📊 통계 현황
            </h3>
            <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                marginBottom: '12px',
                padding: '12px',
                backgroundColor: '#f0f9ff',
                borderRadius: '6px'
              }}>
                <span style={{ fontWeight: '600' }}>총 좌석:</span>
                <span style={{ color: '#3b82f6', fontWeight: '600' }}>{statistics.total || 0}개</span>
              </div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                marginBottom: '16px',
                padding: '12px',
                backgroundColor: '#ecfdf5',
                borderRadius: '6px'
              }}>
                <span style={{ fontWeight: '600' }}>예상 수익:</span>
                <span style={{ color: '#10b981', fontWeight: '600' }}>
                  {(statistics.totalRevenue || 0).toLocaleString()}원
                </span>
              </div>
              
              <div style={{ marginBottom: '12px', fontSize: '13px', color: '#6b7280', fontWeight: '600' }}>
                좌석 타입별 분포:
              </div>
              {Object.entries(SEAT_TYPES).map(([key, type]) => {
                const count = statistics.byType?.[key]?.count || 0;
                const revenue = statistics.byType?.[key]?.revenue || 0;
                return (
                  <div key={key} style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: '8px',
                    padding: '8px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '4px'
                  }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{ 
                        width: '14px', 
                        height: '14px', 
                        backgroundColor: type.color, 
                        borderRadius: '3px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '8px'
                      }}>
                        {type.icon}
                      </div>
                      <span style={{ fontSize: '13px' }}>{type.name}</span>
                    </span>
                    <span style={{ color: '#6b7280', fontSize: '12px' }}>
                      {count}개 ({revenue.toLocaleString()}원)
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 캔버스 설정 */}
          <div style={{ 
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', color: '#1f2937' }}>⚙️ 설정</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '13px', 
                  marginBottom: '8px', 
                  color: '#374151',
                  fontWeight: '500'
                }}>
                  그리드 크기: {canvas.gridSize}px
                </label>
                <input
                  type="range"
                  min="20"
                  max="60"
                  value={canvas.gridSize}
                  onChange={(e) => setCanvas(prev => ({ ...prev, gridSize: parseInt(e.target.value) }))}
                  style={{ 
                    width: '100%',
                    height: '6px',
                    borderRadius: '3px',
                    background: '#e5e7eb',
                    outline: 'none'
                  }}
                />
              </div>
              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '13px', 
                  marginBottom: '8px', 
                  color: '#374151',
                  fontWeight: '500'
                }}>
                  캔버스 너비: {canvas.width}px
                </label>
                <input
                  type="range"
                  min="800"
                  max="1400"
                  step="50"
                  value={canvas.width}
                  onChange={(e) => setCanvas(prev => ({ ...prev, width: parseInt(e.target.value) }))}
                  style={{ 
                    width: '100%',
                    height: '6px',
                    borderRadius: '3px',
                    background: '#e5e7eb',
                    outline: 'none'
                  }}
                />
              </div>
              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '13px', 
                  marginBottom: '8px', 
                  color: '#374151',
                  fontWeight: '500'
                }}>
                  캔버스 높이: {canvas.height}px
                </label>
                <input
                  type="range"
                  min="600"
                  max="1200"
                  step="50"
                  value={canvas.height}
                  onChange={(e) => setCanvas(prev => ({ ...prev, height: parseInt(e.target.value) }))}
                  style={{ 
                    width: '100%',
                    height: '6px',
                    borderRadius: '3px',
                    background: '#e5e7eb',
                    outline: 'none'
                  }}
                />
              </div>
            </div>
          </div>

          {/* 빠른 액션 */}
          <div style={{ 
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', color: '#1f2937' }}>⚡ 빠른 액션</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                onClick={() => {
                  if (window.confirm('모든 좌석을 삭제하시겠습니까?')) {
                    setSeats([]);
                    setSelectedSeats([]);
                  }
                }}
                style={{
                  padding: '12px 16px',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'all 0.2s'
                }}
              >
                🗑️ 전체 삭제
              </button>
              <button
                onClick={() => setSelectedSeats(seats.map(seat => seat.id))}
                style={{
                  padding: '12px 16px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'all 0.2s'
                }}
              >
                🎯 전체 선택
              </button>
              <button
                onClick={saveSeatLayout}
                disabled={isLoading}
                style={{
                  padding: '12px 16px',
                  backgroundColor: isLoading ? '#6b7280' : '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'all 0.2s',
                  opacity: isLoading ? 0.6 : 1
                }}
              >
                {isLoading ? '💾 저장 중...' : '💾 저장하기'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* CSS 애니메이션 */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.15);
        }
        
        button:active:not(:disabled) {
          transform: translateY(0);
        }
        
        input[type="range"]::-webkit-slider-thumb {
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        
        input[type="range"]::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
      `}</style>
    </div>
  );
};

export default SeatLayoutEditor;
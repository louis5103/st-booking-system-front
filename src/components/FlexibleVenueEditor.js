import React, { useState, useCallback, useRef, useEffect } from 'react';
import { venueAPI, seatLayoutAPI } from '../services/api';
import '../styles/FlexibleVenueEditor.css';

const FlexibleVenueEditor = ({ venueId, onClose }) => {
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
  const [draggedSeat, setDraggedSeat] = useState(null);
  const [viewMode, setViewMode] = useState('edit');
  const [groupMode, setGroupMode] = useState(false);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [showGrid, setShowGrid] = useState(true);
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [editingSectionId, setEditingSectionId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });
  const [seatCounter, setSeatCounter] = useState(1);
  const [isStageMovable, setIsStageMovable] = useState(false);
  const [draggedStage, setDraggedStage] = useState(null);
  const [showHelp, setShowHelp] = useState(false);
  const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 });
  
  // 드래그 선택 관련 상태
  const [isDragSelecting, setIsDragSelecting] = useState(false);
  const [dragSelectStart, setDragSelectStart] = useState({ x: 0, y: 0 });
  const [dragSelectEnd, setDragSelectEnd] = useState({ x: 0, y: 0 });
  const [dragSelectRect, setDragSelectRect] = useState(null);
  
  const venueRef = useRef(null);
  const containerRef = useRef(null);
  const resizeObserverRef = useRef(null);

  const seatTypes = {
    REGULAR: { color: '#3B82F6', name: '일반석', price: 50000 },
    VIP: { color: '#F59E0B', name: 'VIP석', price: 100000 },
    PREMIUM: { color: '#8B5CF6', name: '프리미엄석', price: 75000 },
    WHEELCHAIR: { color: '#10B981', name: '휠체어석', price: 50000 }
  };

  // 기본 템플릿 생성 함수
  const createDefaultTemplate = useCallback((canvasWidth, canvasHeight) => {
    const defaultSeats = [];
    let counter = 1;
    
    // 무대 위치 설정
    const stageY = 50;
    const firstRowY = stageY + 120; // 무대에서 적당한 거리
    
    // 5행 8열 기본 배치
    const rows = 5;
    const cols = 8;
    const seatSpacing = 50; // 좌석 간격
    const rowSpacing = 60;  // 행 간격
    
    // 중앙 정렬을 위한 시작 X 좌표 계산
    const totalWidth = (cols - 1) * seatSpacing;
    const startX = (canvasWidth - totalWidth) / 2;
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = startX + (col * seatSpacing);
        const y = firstRowY + (row * rowSpacing);
        
        // 행별로 다른 섹션 할당 (앞 2행은 프리미엄, 나머지는 일반)
        const sectionId = row < 2 ? 1 : 2;
        const seatType = row < 2 ? 'PREMIUM' : 'REGULAR';
        const rowLabel = String.fromCharCode(65 + row); // A, B, C, D, E
        
        defaultSeats.push({
          id: `seat-default-${row}-${col}`,
          x: x - 20, // 좌석 중심 조정
          y: y - 20,
          seatType: seatType,
          rotation: 0,
          sectionId: sectionId,
          sectionName: sections[sectionId]?.name || `${sectionId}구역`,
          sectionColor: sections[sectionId]?.color || '#FF6B6B',
          price: seatTypes[seatType]?.price || 50000,
          seatLabel: `${rowLabel}${col + 1}`,
          isActive: true
        });
        counter++;
      }
    }
    
    return { seats: defaultSeats, counter };
  }, [sections, seatTypes]);

  // 화면 크기 감지 및 캔버스 크기 자동 조절
  useEffect(() => {
    const updateCanvasSize = () => {
      if (containerRef.current) {
        const container = containerRef.current;
        const rect = container.getBoundingClientRect();
        const padding = 40;
        const headerHeight = 80;
        const helpHeight = showHelp ? 120 : 60;
        
        const availableWidth = Math.max(600, rect.width - padding);
        const availableHeight = Math.max(400, window.innerHeight - headerHeight - helpHeight - padding);
        
        setContainerDimensions({ width: rect.width, height: rect.height });
        setCanvasSize({ width: availableWidth, height: availableHeight });
        
        // 무대 위치를 캔버스 중앙 상단으로 조정
        setStage(prev => ({
          ...prev,
          x: (availableWidth / 2) - (prev.width / 2),
          y: 30
        }));
      }
    };

    if (containerRef.current) {
      resizeObserverRef.current = new ResizeObserver(() => {
        requestAnimationFrame(updateCanvasSize);
      });
      resizeObserverRef.current.observe(containerRef.current);
    }

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    
    return () => {
      window.removeEventListener('resize', updateCanvasSize);
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
    };
  }, [showHelp]);

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
      const response = await seatLayoutAPI.getFlexibleSeatMap(venueId);
      
      if (response?.seats && response.seats.length > 0) {
        // 기존 좌석 데이터가 있는 경우
        const adjustedSeats = response.seats.map((seat, index) => ({
          ...seat,
          id: seat.id || `seat-${Date.now()}-${index}`,
          x: Math.max(0, Math.min(seat.xPosition || Math.random() * (canvasSize.width - 100) + 50, canvasSize.width - 40)),
          y: Math.max(0, Math.min(seat.yPosition || Math.random() * (canvasSize.height - 200) + 100, canvasSize.height - 40)),
          seatLabel: seat.seatLabel || `${seat.sectionName || '1구역'}-${index + 1}`,
          isActive: seat.isActive !== undefined ? seat.isActive : true
        }));
        setSeats(adjustedSeats);
        setSeatCounter(adjustedSeats.length + 1);
      } else {
        // 기존 데이터가 없는 경우 기본 템플릿 생성
        const { seats: defaultSeats, counter } = createDefaultTemplate(canvasSize.width, canvasSize.height);
        setSeats(defaultSeats);
        setSeatCounter(counter);
      }
      
      if (response?.sections && response.sections.length > 0) {
        const sectionsMap = {};
        response.sections.forEach(section => {
          sectionsMap[section.sectionId] = {
            name: section.sectionName,
            color: section.sectionColor
          };
        });
        setSections(sectionsMap);
      }
    } catch (error) {
      console.error('유연한 좌석 배치 로드 실패:', error);
      // 오류 발생 시에도 기본 템플릿 생성
      const { seats: defaultSeats, counter } = createDefaultTemplate(canvasSize.width, canvasSize.height);
      setSeats(defaultSeats);
      setSeatCounter(counter);
    } finally {
      setLoading(false);
    }
  };

  // 캔버스 크기가 변경될 때 기본 템플릿 재생성
  useEffect(() => {
    if (canvasSize.width > 0 && canvasSize.height > 0 && seats.length === 0 && !loading) {
      const { seats: defaultSeats, counter } = createDefaultTemplate(canvasSize.width, canvasSize.height);
      setSeats(defaultSeats);
      setSeatCounter(counter);
    }
  }, [canvasSize, seats.length, loading, createDefaultTemplate]);

  const getMousePosition = useCallback((e) => {
    if (!venueRef.current) return { x: 0, y: 0 };
    
    const rect = venueRef.current.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left - pan.x) / zoom,
      y: (e.clientY - rect.top - pan.y) / zoom
    };
  }, [pan, zoom]);

  const addSeat = useCallback((e) => {
    if (viewMode === 'preview' || groupMode || isPanning || draggedSeat || draggedStage || isDragSelecting) return;
    
    const pos = getMousePosition(e);
    
    // 경계 체크 - 좌석 크기를 고려해서 더 큰 마진 적용
    if (pos.x < 20 || pos.x > canvasSize.width - 60 || pos.y < 20 || pos.y > canvasSize.height - 60) {
      return;
    }
    
    const newSeat = {
      id: `seat-${Date.now()}-${Math.random()}`,
      x: pos.x - 20, // 좌석 크기를 고려한 중앙 배치
      y: pos.y - 20,
      seatType: selectedSeatType,
      rotation: 0,
      sectionId: selectedSection,
      sectionName: sections[selectedSection]?.name || `${selectedSection}구역`,
      sectionColor: sections[selectedSection]?.color || '#FF6B6B',
      price: seatTypes[selectedSeatType]?.price || 50000,
      seatLabel: `${sections[selectedSection]?.name || selectedSection}-${seatCounter}`,
      isActive: true
    };
    
    setSeats(prev => [...prev, newSeat]);
    setSeatCounter(prev => prev + 1);
  }, [viewMode, groupMode, isPanning, draggedSeat, draggedStage, isDragSelecting, getMousePosition, canvasSize, selectedSeatType, selectedSection, sections, seatTypes, seatCounter]);

  const getSectionSeats = useCallback((sectionId) => {
    return seats.filter(seat => seat.sectionId === sectionId);
  }, [seats]);

  const deleteSeat = useCallback((seatId) => {
    setSeats(prev => prev.filter(seat => seat.id !== seatId));
    setSelectedSeats(prev => prev.filter(id => id !== seatId));
  }, []);

  const deleteSelectedSeats = useCallback(() => {
    if (selectedSeats.length === 0) return;
    
    if (window.confirm(`선택된 ${selectedSeats.length}개의 좌석을 삭제하시겠습니까?`)) {
      setSeats(prev => prev.filter(seat => !selectedSeats.includes(seat.id)));
      setSelectedSeats([]);
    }
  }, [selectedSeats]);

  // 섹션 삭제 기능 추가
  const deleteSection = useCallback((sectionId) => {
    const sectionSeats = getSectionSeats(parseInt(sectionId));
    const confirmMessage = sectionSeats.length > 0 
      ? `${sections[sectionId]?.name} 섹션을 삭제하면 ${sectionSeats.length}개의 좌석도 함께 삭제됩니다. 계속하시겠습니까?`
      : `${sections[sectionId]?.name} 섹션을 삭제하시겠습니까?`;
    
    if (window.confirm(confirmMessage)) {
      // 해당 섹션의 좌석들도 함께 삭제
      setSeats(prev => prev.filter(seat => seat.sectionId !== parseInt(sectionId)));
      setSelectedSeats(prev => prev.filter(id => !sectionSeats.some(seat => seat.id === id)));
      
      // 섹션 삭제
      setSections(prev => {
        const newSections = { ...prev };
        delete newSections[sectionId];
        return newSections;
      });
      
      // 삭제된 섹션이 현재 선택된 섹션이면 다른 섹션으로 변경
      if (selectedSection === parseInt(sectionId)) {
        const remainingSections = Object.keys(sections).filter(id => id !== sectionId);
        if (remainingSections.length > 0) {
          setSelectedSection(parseInt(remainingSections[0]));
        }
      }
    }
  }, [sections, selectedSection, getSectionSeats]);

  // 템플릿 리셋 기능 추가
  const resetToDefaultTemplate = useCallback(() => {
    if (window.confirm('현재 배치를 삭제하고 기본 템플릿으로 리셋하시겠습니까?')) {
      const { seats: defaultSeats, counter } = createDefaultTemplate(canvasSize.width, canvasSize.height);
      setSeats(defaultSeats);
      setSeatCounter(counter);
      setSelectedSeats([]);
    }
  }, [canvasSize, createDefaultTemplate]);

  const rotateSeat = useCallback((seatId) => {
    setSeats(prev => prev.map(seat => 
      seat.id === seatId 
        ? { ...seat, rotation: (seat.rotation + 45) % 360 }
        : seat
    ));
  }, []);

  const rotateSelectedSeats = useCallback(() => {
    setSeats(prev => prev.map(seat => 
      selectedSeats.includes(seat.id)
        ? { ...seat, rotation: (seat.rotation + 45) % 360 }
        : seat
    ));
  }, [selectedSeats]);

  const changeSelectedSeatsType = useCallback((newType) => {
    setSeats(prev => prev.map(seat => 
      selectedSeats.includes(seat.id) 
        ? { ...seat, seatType: newType, price: seatTypes[newType]?.price || 50000 } 
        : seat
    ));
  }, [selectedSeats, seatTypes]);

  const changeSelectedSeatsSection = useCallback((newSection) => {
    setSeats(prev => prev.map(seat => {
      if (selectedSeats.includes(seat.id)) {
        return { 
          ...seat, 
          sectionId: newSection, 
          sectionName: sections[newSection]?.name || `${newSection}구역`,
          sectionColor: sections[newSection]?.color || '#FF6B6B'
        };
      }
      return seat;
    }));
  }, [selectedSeats, sections]);

  const selectSeatsBySection = useCallback((sectionId) => {
    const sectionSeatIds = seats
      .filter(seat => seat.sectionId === sectionId)
      .map(seat => seat.id);
    setSelectedSeats(sectionSeatIds);
    setGroupMode(true);
  }, [seats]);

  const handleSeatClick = useCallback((seat, e) => {
    e.stopPropagation();
    
    if (viewMode === 'preview') return;
    
    if (groupMode) {
      setSelectedSeats(prev => {
        if (prev.includes(seat.id)) {
          return prev.filter(id => id !== seat.id);
        } else {
          return [...prev, seat.id];
        }
      });
    }
  }, [viewMode, groupMode]);

  const handleMouseDown = useCallback((e, seat) => {
    if (viewMode === 'preview' || isPanning) return;
    
    if (groupMode) {
      // 그룹 모드에서는 드래그 선택 시작
      if (e.button === 0 && !e.shiftKey) { // 좌클릭이고 Shift 키를 누르지 않았을 때
        const pos = getMousePosition(e);
        setIsDragSelecting(true);
        setDragSelectStart(pos);
        setDragSelectEnd(pos);
        setDragSelectRect({ x: pos.x, y: pos.y, width: 0, height: 0 });
        e.stopPropagation();
        return;
      }
    } else {
      // 편집 모드에서는 좌석 드래그 시작
      e.stopPropagation();
      const pos = getMousePosition(e);
      setDraggedSeat({ 
        ...seat, 
        offsetX: pos.x - seat.x, 
        offsetY: pos.y - seat.y 
      });
    }
  }, [viewMode, groupMode, isPanning, getMousePosition]);

  const handleStageMouseDown = useCallback((e) => {
    if (viewMode === 'preview' || !isStageMovable) return;
    e.stopPropagation();
    
    const pos = getMousePosition(e);
    setDraggedStage({
      offsetX: pos.x - stage.x,
      offsetY: pos.y - stage.y
    });
  }, [viewMode, isStageMovable, getMousePosition, stage]);

  const handleMouseMove = useCallback((e) => {
    if (isPanning) {
      const deltaX = e.clientX - lastPanPoint.x;
      const deltaY = e.clientY - lastPanPoint.y;
      setPan(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }));
      setLastPanPoint({ x: e.clientX, y: e.clientY });
      return;
    }

    if (isDragSelecting) {
      const pos = getMousePosition(e);
      setDragSelectEnd(pos);
      
      const minX = Math.min(dragSelectStart.x, pos.x);
      const minY = Math.min(dragSelectStart.y, pos.y);
      const maxX = Math.max(dragSelectStart.x, pos.x);
      const maxY = Math.max(dragSelectStart.y, pos.y);
      
      setDragSelectRect({
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY
      });
      return;
    }

    if (draggedStage && isStageMovable) {
      const pos = getMousePosition(e);
      const newX = Math.max(0, Math.min(pos.x - draggedStage.offsetX, canvasSize.width - stage.width));
      const newY = Math.max(0, Math.min(pos.y - draggedStage.offsetY, canvasSize.height - stage.height));
      
      setStage(prev => ({ ...prev, x: newX, y: newY }));
      return;
    }

    if (draggedSeat && !groupMode) {
      const pos = getMousePosition(e);
      const newX = Math.max(0, Math.min(pos.x - draggedSeat.offsetX, canvasSize.width - 40));
      const newY = Math.max(0, Math.min(pos.y - draggedSeat.offsetY, canvasSize.height - 40));
      
      setSeats(prev => prev.map(seat => 
        seat.id === draggedSeat.id 
          ? { ...seat, x: newX, y: newY }
          : seat
      ));
    }
  }, [isPanning, lastPanPoint, isDragSelecting, dragSelectStart, draggedStage, isStageMovable, draggedSeat, groupMode, getMousePosition, canvasSize, stage]);

  const handleMouseUp = useCallback(() => {
    if (isDragSelecting && dragSelectRect) {
      // 드래그 선택 영역 내의 좌석들 선택
      const selectedSeatIds = seats
        .filter(seat => {
          const seatCenterX = seat.x + 20; // 좌석 중심점
          const seatCenterY = seat.y + 20;
          return (
            seatCenterX >= dragSelectRect.x &&
            seatCenterX <= dragSelectRect.x + dragSelectRect.width &&
            seatCenterY >= dragSelectRect.y &&
            seatCenterY <= dragSelectRect.y + dragSelectRect.height
          );
        })
        .map(seat => seat.id);
      
      setSelectedSeats(prev => {
        // 기존 선택과 새로운 선택을 합침 (중복 제거)
        const combined = [...new Set([...prev, ...selectedSeatIds])];
        return combined;
      });
    }
    
    setDraggedSeat(null);
    setDraggedStage(null);
    setIsPanning(false);
    setIsDragSelecting(false);
    setDragSelectRect(null);
  }, [isDragSelecting, dragSelectRect, seats]);

  const handleCanvasMouseDown = useCallback((e) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      // 휠 클릭 또는 Alt + 좌클릭으로 패닝
      e.preventDefault();
      setIsPanning(true);
      setLastPanPoint({ x: e.clientX, y: e.clientY });
    } else if (groupMode && e.button === 0 && !e.altKey) {
      // 그룹 모드에서 드래그 선택 시작
      const pos = getMousePosition(e);
      setIsDragSelecting(true);
      setDragSelectStart(pos);
      setDragSelectEnd(pos);
      setDragSelectRect({ x: pos.x, y: pos.y, width: 0, height: 0 });
    }
  }, [groupMode, getMousePosition]);

  useEffect(() => {
    if (draggedSeat || isPanning || draggedStage || isDragSelecting) {
      const handleGlobalMouseMove = (e) => handleMouseMove(e);
      const handleGlobalMouseUp = () => handleMouseUp();
      
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleGlobalMouseMove);
        document.removeEventListener('mouseup', handleGlobalMouseUp);
      };
    }
  }, [draggedSeat, isPanning, draggedStage, isDragSelecting, handleMouseMove, handleMouseUp]);

  // 정렬 기능들
  const alignSelectedSeats = useCallback((alignType) => {
    if (selectedSeats.length < 2) return;
    
    const selectedSeatObjects = seats.filter(seat => selectedSeats.includes(seat.id));
    
    switch (alignType) {
      case 'horizontal':
        // 수평 정렬 (Y 좌표를 평균으로)
        const avgY = selectedSeatObjects.reduce((sum, seat) => sum + seat.y, 0) / selectedSeatObjects.length;
        setSeats(prev => prev.map(seat => 
          selectedSeats.includes(seat.id) ? { ...seat, y: avgY } : seat
        ));
        break;
      
      case 'vertical':
        // 수직 정렬 (X 좌표를 평균으로)
        const avgX = selectedSeatObjects.reduce((sum, seat) => sum + seat.x, 0) / selectedSeatObjects.length;
        setSeats(prev => prev.map(seat => 
          selectedSeats.includes(seat.id) ? { ...seat, x: avgX } : seat
        ));
        break;
      
      case 'grid':
        // 격자 정렬 (20px 단위로)
        setSeats(prev => prev.map(seat => 
          selectedSeats.includes(seat.id) 
            ? { 
                ...seat, 
                x: Math.round(seat.x / 20) * 20,
                y: Math.round(seat.y / 20) * 20
              } 
            : seat
        ));
        break;
      
      case 'distribute-horizontal':
        // 수평 균등 분배
        const sortedByX = [...selectedSeatObjects].sort((a, b) => a.x - b.x);
        if (sortedByX.length > 2) {
          const leftMost = sortedByX[0].x;
          const rightMost = sortedByX[sortedByX.length - 1].x;
          const spacing = (rightMost - leftMost) / (sortedByX.length - 1);
          
          setSeats(prev => prev.map(seat => {
            const index = sortedByX.findIndex(s => s.id === seat.id);
            if (index !== -1) {
              return { ...seat, x: leftMost + (spacing * index) };
            }
            return seat;
          }));
        }
        break;
      
      case 'distribute-vertical':
        // 수직 균등 분배
        const sortedByY = [...selectedSeatObjects].sort((a, b) => a.y - b.y);
        if (sortedByY.length > 2) {
          const topMost = sortedByY[0].y;
          const bottomMost = sortedByY[sortedByY.length - 1].y;
          const spacing = (bottomMost - topMost) / (sortedByY.length - 1);
          
          setSeats(prev => prev.map(seat => {
            const index = sortedByY.findIndex(s => s.id === seat.id);
            if (index !== -1) {
              return { ...seat, y: topMost + (spacing * index) };
            }
            return seat;
          }));
        }
        break;
    }
  }, [selectedSeats, seats]);

  const createSeatRow = useCallback((startX, startY, count, spacing = 45) => {
    const newSeats = [];
    
    for (let i = 0; i < count; i++) {
      const x = startX + (i * spacing);
      const y = startY;
      
      // 경계 체크
      if (x >= 0 && x <= canvasSize.width - 40 && y >= 0 && y <= canvasSize.height - 40) {
        newSeats.push({
          id: `seat-${Date.now()}-${i}-${Math.random()}`,
          x,
          y,
          seatType: selectedSeatType,
          rotation: 0,
          sectionId: selectedSection,
          sectionName: sections[selectedSection]?.name || `${selectedSection}구역`,
          sectionColor: sections[selectedSection]?.color || '#FF6B6B',
          price: seatTypes[selectedSeatType]?.price || 50000,
          seatLabel: `${sections[selectedSection]?.name || selectedSection}-${seatCounter + i}`,
          isActive: true
        });
      }
    }
    
    if (newSeats.length > 0) {
      setSeats(prev => [...prev, ...newSeats]);
      setSeatCounter(prev => prev + newSeats.length);
    }
  }, [canvasSize, selectedSeatType, selectedSection, sections, seatTypes, seatCounter]);

  const createCurvedSection = useCallback((centerX, centerY, radius, seatCount, startAngle = 0) => {
    const newSeats = [];
    const angleStep = Math.PI / Math.max(1, seatCount - 1);
    
    for (let i = 0; i < seatCount; i++) {
      const angle = startAngle + (i * angleStep);
      const x = centerX + Math.cos(angle) * radius - 20;
      const y = centerY + Math.sin(angle) * radius - 20;
      
      // 경계 체크
      if (x >= 0 && x <= canvasSize.width - 40 && y >= 0 && y <= canvasSize.height - 40) {
        newSeats.push({
          id: `seat-${Date.now()}-${i}-${Math.random()}`,
          x,
          y,
          seatType: selectedSeatType,
          rotation: (angle * 180 / Math.PI) + 90,
          sectionId: selectedSection,
          sectionName: sections[selectedSection]?.name || `${selectedSection}구역`,
          sectionColor: sections[selectedSection]?.color || '#FF6B6B',
          price: seatTypes[selectedSeatType]?.price || 50000,
          seatLabel: `${sections[selectedSection]?.name || selectedSection}-${seatCounter + i}`,
          isActive: true
        });
      }
    }
    
    if (newSeats.length > 0) {
      setSeats(prev => [...prev, ...newSeats]);
      setSeatCounter(prev => prev + newSeats.length);
    }
  }, [canvasSize, selectedSeatType, selectedSection, sections, seatTypes, seatCounter]);

  const updateSection = useCallback((sectionId, name, color) => {
    setSections(prev => ({
      ...prev,
      [sectionId]: { name, color }
    }));
    
    setSeats(prev => prev.map(seat => 
      seat.sectionId === sectionId 
        ? { ...seat, sectionName: name, sectionColor: color }
        : seat
    ));
  }, []);

  const addNewSection = useCallback(() => {
    const newId = Math.max(...Object.keys(sections).map(Number), 0) + 1;
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#FF8A80', '#82B1FF', '#B39DDB'];
    const newColor = colors[newId % colors.length];
    
    setSections(prev => ({
      ...prev,
      [newId]: { name: `${newId}구역`, color: newColor }
    }));
    setSelectedSection(newId);
  }, [sections]);

  const clearAllSeats = useCallback(() => {
    if (window.confirm('모든 좌석을 삭제하시겠습니까?')) {
      setSeats([]);
      setSelectedSeats([]);
      setSeatCounter(1);
    }
  }, []);

  const saveLayout = async () => {
    try {
      setLoading(true);
      const updateRequest = {
        venueId: venueId,
        seats: seats.map(seat => ({
          id: seat.originalId || null,
          x: Math.round(seat.x),
          y: Math.round(seat.y),
          sectionId: seat.sectionId,
          sectionName: seat.sectionName,
          sectionColor: seat.sectionColor,
          rotation: seat.rotation || 0,
          price: seat.price,
          seatType: seat.seatType,
          isActive: seat.isActive,
          seatLabel: seat.seatLabel
        })),
        stage: stage,
        canvasSize: canvasSize
      };

      await seatLayoutAPI.updateFlexibleLayout(updateRequest);
      alert('좌석 배치가 저장되었습니다!');
    } catch (error) {
      console.error('좌석 배치 저장 실패:', error);
      alert('저장 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const handleZoom = useCallback((delta) => {
    const newZoom = Math.max(0.5, Math.min(3, zoom + delta));
    setZoom(newZoom);
  }, [zoom]);

  const resetView = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const getSeatStats = useCallback(() => {
    const stats = {};
    Object.keys(seatTypes).forEach(type => {
      stats[type] = seats.filter(seat => seat.seatType === type).length;
    });
    return stats;
  }, [seats, seatTypes]);

  const getSectionStats = useCallback(() => {
    const stats = {};
    Object.keys(sections).forEach(sectionId => {
      const sectionSeats = getSectionSeats(parseInt(sectionId));
      stats[sectionId] = {
        count: sectionSeats.length,
        revenue: sectionSeats.reduce((sum, seat) => sum + (seat.price || 0), 0)
      };
    });
    return stats;
  }, [sections, getSectionSeats]);

  const totalRevenue = seats.reduce((sum, seat) => sum + (seat.price || 0), 0);

  const SectionModal = () => {
    const [tempName, setTempName] = useState(sections[editingSectionId]?.name || '');
    const [tempColor, setTempColor] = useState(sections[editingSectionId]?.color || '#FF6B6B');

    return (
      <div className="modal-overlay" onClick={() => setShowSectionModal(false)}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3>섹션 편집</h3>
            <button onClick={() => setShowSectionModal(false)} className="close-button">×</button>
          </div>
          <div className="modal-body">
            <div className="form-group">
              <label>섹션 이름</label>
              <input
                type="text"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                className="form-control"
                placeholder="섹션 이름을 입력하세요"
                maxLength={15}
              />
            </div>
            <div className="form-group">
              <label>섹션 색상</label>
              <input
                type="color"
                value={tempColor}
                onChange={(e) => setTempColor(e.target.value)}
                className="form-control"
              />
            </div>
          </div>
          <div className="modal-footer">
            <button
              onClick={() => setShowSectionModal(false)}
              className="btn btn-secondary"
            >
              취소
            </button>
            <button
              onClick={() => {
                if (tempName.trim()) {
                  updateSection(editingSectionId, tempName.trim(), tempColor);
                  setShowSectionModal(false);
                } else {
                  alert('섹션 이름을 입력해주세요.');
                }
              }}
              className="btn btn-primary"
            >
              저장
            </button>
          </div>
        </div>
      </div>
    );
  };

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
          <h2>유연한 공연장 좌석 배치</h2>
          <div className="canvas-info">
            {canvasSize.width} × {canvasSize.height} | 줌: {Math.round(zoom * 100)}% | 좌석: {seats.length}개
          </div>
        </div>
        <div className="header-center">
          <div className="mode-toggle">
            <button
              onClick={() => setViewMode(viewMode === 'edit' ? 'preview' : 'edit')}
              className={`btn ${viewMode === 'preview' ? 'btn-success' : 'btn-info'}`}
            >
              {viewMode === 'edit' ? '🔧 편집모드' : '👁️ 미리보기'}
            </button>
            <button
              onClick={() => {
                setGroupMode(!groupMode);
                setSelectedSeats([]);
              }}
              className={`btn ${groupMode ? 'btn-warning' : 'btn-secondary'}`}
            >
              {groupMode ? '🔓 개별선택' : '🔒 그룹선택'}
            </button>
          </div>
        </div>
        <div className="header-right">
          <div className="zoom-controls">
            <button 
              onClick={() => handleZoom(-0.2)} 
              className="btn btn-sm btn-secondary"
              disabled={zoom <= 0.5}
              title="축소"
            >
              －
            </button>
            <span className="zoom-display">{Math.round(zoom * 100)}%</span>
            <button 
              onClick={() => handleZoom(0.2)} 
              className="btn btn-sm btn-secondary"
              disabled={zoom >= 3}
              title="확대"
            >
              ＋
            </button>
            <button onClick={resetView} className="btn btn-sm btn-info" title="뷰 리셋">
              🔄
            </button>
          </div>
          <button 
            onClick={() => setShowHelp(!showHelp)} 
            className="btn btn-sm btn-secondary"
            title="도움말"
          >
            ❓
          </button>
          <button onClick={resetToDefaultTemplate} className="btn btn-success" title="기본 템플릿으로 리셋">
            🏛️ 템플릿 리셋
          </button>
          <button onClick={clearAllSeats} className="btn btn-warning" title="전체 삭제">
            🗑️ 전체삭제
          </button>
          <button onClick={saveLayout} className="btn btn-primary" disabled={loading}>
            {loading ? '💾 저장 중...' : '💾 저장'}
          </button>
          <button onClick={onClose} className="btn btn-secondary">
            ✖️ 닫기
          </button>
        </div>
      </div>

      {showHelp && (
        <div className="help-panel">
          <div className="help-content">
            <h4>📖 사용법 가이드</h4>
            <div className="help-grid">
              <div className="help-item">
                <strong>🏛️ 기본 템플릿:</strong> 5행 8열의 깔끔한 극장 형태로 시작
              </div>
              <div className="help-item">
                <strong>🖱️ 좌석 추가:</strong> 편집모드에서 빈 공간 클릭
              </div>
              <div className="help-item">
                <strong>🔄 좌석 이동:</strong> 편집모드에서 좌석을 드래그
              </div>
              <div className="help-item">
                <strong>🎯 개별 선택:</strong> 그룹모드에서 좌석들 개별 클릭
              </div>
              <div className="help-item">
                <strong>📦 드래그 선택:</strong> 그룹모드에서 빈 공간을 드래그하여 영역 선택
              </div>
              <div className="help-item">
                <strong>🖐️ 화면 이동:</strong> Alt+클릭 또는 휠클릭 드래그
              </div>
              <div className="help-item">
                <strong>🔍 확대/축소:</strong> 줌 버튼 사용
              </div>
              <div className="help-item">
                <strong>📐 정렬:</strong> 선택된 좌석들을 수평/수직/격자로 정렬
              </div>
            </div>
            <button onClick={() => setShowHelp(false)} className="btn btn-sm btn-secondary">닫기</button>
          </div>
        </div>
      )}

      <div className="editor-content">
        <div className="editor-sidebar">
          {/* 섹션 관리 */}
          <div className="sidebar-section">
            <div className="section-header">
              <h3>🏛️ 섹션 관리</h3>
              <button onClick={addNewSection} className="btn btn-sm btn-primary" title="새 섹션 추가">+</button>
            </div>
            <div className="sections-list">
              {Object.entries(sections).map(([sectionId, section]) => (
                <div
                  key={sectionId}
                  className={`section-item ${selectedSection === parseInt(sectionId) ? 'active' : ''}`}
                >
                  <div 
                    className="section-info"
                    onClick={() => setSelectedSection(parseInt(sectionId))}
                  >
                    <div 
                      className="section-color" 
                      style={{ backgroundColor: section.color }}
                    />
                    <span className="section-name" title={section.name}>{section.name}</span>
                    <span className="section-count">
                      ({getSectionSeats(parseInt(sectionId)).length})
                    </span>
                  </div>
                  <div className="section-actions">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        selectSeatsBySection(parseInt(sectionId));
                      }}
                      className="btn btn-xs btn-info"
                      title="섹션의 모든 좌석 선택"
                    >
                      선택
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingSectionId(parseInt(sectionId));
                        setShowSectionModal(true);
                      }}
                      className="btn btn-xs btn-secondary"
                      title="섹션 편집"
                    >
                      편집
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteSection(sectionId);
                      }}
                      className="btn btn-xs btn-danger"
                      title="섹션 삭제"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 그룹 편집 도구 */}
          {groupMode && selectedSeats.length > 0 && (
            <div className="sidebar-section group-edit">
              <h3>🎯 그룹 편집 ({selectedSeats.length}개 선택됨)</h3>
              <div className="group-controls">
                <div className="form-group">
                  <label>좌석 타입 변경</label>
                  <select
                    onChange={(e) => e.target.value && changeSelectedSeatsType(e.target.value)}
                    className="form-control"
                    defaultValue=""
                  >
                    <option value="">선택하세요</option>
                    {Object.entries(seatTypes).map(([type, info]) => (
                      <option key={type} value={type}>{info.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>섹션 이동</label>
                  <select
                    onChange={(e) => e.target.value && changeSelectedSeatsSection(parseInt(e.target.value))}
                    className="form-control"
                    defaultValue=""
                  >
                    <option value="">선택하세요</option>
                    {Object.entries(sections).map(([sectionId, section]) => (
                      <option key={sectionId} value={sectionId}>{section.name}</option>
                    ))}
                  </select>
                </div>
                
                {/* 정렬 기능 */}
                <div className="form-group">
                  <label>정렬</label>
                  <div className="align-buttons">
                    <button
                      onClick={() => alignSelectedSeats('horizontal')}
                      className="btn btn-xs btn-info"
                      title="수평 정렬"
                    >
                      ↔️ 수평
                    </button>
                    <button
                      onClick={() => alignSelectedSeats('vertical')}
                      className="btn btn-xs btn-info"
                      title="수직 정렬"
                    >
                      ↕️ 수직
                    </button>
                    <button
                      onClick={() => alignSelectedSeats('grid')}
                      className="btn btn-xs btn-success"
                      title="격자 정렬"
                    >
                      📐 격자
                    </button>
                  </div>
                  <div className="align-buttons">
                    <button
                      onClick={() => alignSelectedSeats('distribute-horizontal')}
                      className="btn btn-xs btn-secondary"
                      title="수평 균등 분배"
                    >
                      🔗 수평분배
                    </button>
                    <button
                      onClick={() => alignSelectedSeats('distribute-vertical')}
                      className="btn btn-xs btn-secondary"
                      title="수직 균등 분배"
                    >
                      🔗 수직분배
                    </button>
                  </div>
                </div>
                
                <div className="button-group">
                  <button
                    onClick={rotateSelectedSeats}
                    className="btn btn-sm btn-info"
                    title="선택된 좌석들 회전"
                  >
                    🔄 회전
                  </button>
                  <button
                    onClick={deleteSelectedSeats}
                    className="btn btn-sm btn-danger"
                    title="선택된 좌석들 삭제"
                  >
                    🗑️ 삭제
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 좌석 타입 선택 */}
          <div className="sidebar-section">
            <h3>🪑 좌석 타입</h3>
            <div className="seat-types">
              {Object.entries(seatTypes).map(([type, info]) => (
                <button
                  key={type}
                  onClick={() => setSelectedSeatType(type)}
                  className={`seat-type-btn ${selectedSeatType === type ? 'active' : ''}`}
                  title={`${info.name} - ${info.price.toLocaleString()}원`}
                >
                  <div 
                    className="seat-type-color" 
                    style={{ backgroundColor: info.color }}
                  />
                  <div className="seat-type-info">
                    <div className="seat-type-name">{info.name}</div>
                    <div className="seat-type-price">{info.price.toLocaleString()}원</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 빠른 배치 */}
          <div className="sidebar-section">
            <h3>⚡ 빠른 배치</h3>
            <div className="quick-actions">
              <button
                onClick={() => createSeatRow(60, canvasSize.height / 2, 8)}
                className="btn btn-sm btn-primary btn-block"
                title="8개 좌석을 일렬로 배치"
              >
                8개 행 추가
              </button>
              <button
                onClick={() => createSeatRow(60, canvasSize.height / 2, 12, 40)}
                className="btn btn-sm btn-primary btn-block"
                title="12개 좌석을 일렬로 배치"
              >
                12개 행 추가
              </button>
              <button
                onClick={() => createCurvedSection(canvasSize.width / 2, canvasSize.height * 0.7, 150, 10, Math.PI)}
                className="btn btn-sm btn-success btn-block"
                title="무대를 향해 곡선으로 배치"
              >
                🌙 커브 섹션 추가
              </button>
            </div>
          </div>

          {/* 무대 설정 */}
          <div className="sidebar-section">
            <h3>🎭 무대 설정</h3>
            <div className="stage-controls">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={isStageMovable}
                  onChange={(e) => setIsStageMovable(e.target.checked)}
                />
                무대 이동 모드
              </label>
            </div>
          </div>

          {/* 통계 */}
          <div className="sidebar-section">
            <h3>📊 통계</h3>
            <div className="stats">
              {Object.entries(getSectionStats()).map(([sectionId, stats]) => (
                <div key={sectionId} className="stat-item">
                  <span className="stat-name">{sections[sectionId]?.name}:</span>
                  <span>{stats.count}석 ({stats.revenue.toLocaleString()}원)</span>
                </div>
              ))}
              <div className="stat-total">
                <div className="stat-item">
                  <span>총 좌석:</span>
                  <span>{seats.length}석</span>
                </div>
                <div className="stat-item">
                  <span>예상 수익:</span>
                  <span>{totalRevenue.toLocaleString()}원</span>
                </div>
              </div>
            </div>
          </div>

          {/* 보기 옵션 */}
          <div className="sidebar-section">
            <h3>👁️ 보기 옵션</h3>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={showGrid}
                onChange={(e) => setShowGrid(e.target.checked)}
              />
              격자 표시
            </label>
          </div>
        </div>

        {/* 메인 캔버스 */}
        <div className="editor-canvas" ref={containerRef}>
          <div className="canvas-container">
            <svg
              ref={venueRef}
              width={canvasSize.width}
              height={canvasSize.height}
              className={`venue-canvas ${
                groupMode ? 'group-mode' : viewMode === 'edit' ? 'edit-mode' : 'preview-mode'
              }`}
              onClick={addSeat}
              onMouseDown={handleCanvasMouseDown}
              style={{
                transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
                transformOrigin: '0 0',
                cursor: isPanning ? 'grabbing' : 
                        isDragSelecting ? 'crosshair' :
                        isStageMovable ? 'move' :
                        groupMode ? 'pointer' : 
                        viewMode === 'edit' ? 'crosshair' : 'default'
              }}
            >
              {/* 격자 */}
              {showGrid && (
                <defs>
                  <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e5e7eb" strokeWidth="1" opacity="0.5"/>
                  </pattern>
                </defs>
              )}
              {showGrid && <rect width="100%" height="100%" fill="url(#grid)" />}
              
              {/* 드래그 선택 영역 */}
              {isDragSelecting && dragSelectRect && (
                <rect
                  x={dragSelectRect.x}
                  y={dragSelectRect.y}
                  width={dragSelectRect.width}
                  height={dragSelectRect.height}
                  fill="rgba(0, 123, 255, 0.2)"
                  stroke="#007bff"
                  strokeWidth="2"
                  strokeDasharray="5,5"
                  pointerEvents="none"
                />
              )}

              {/* 무대 */}
              <g>
                <rect
                  x={stage.x}
                  y={stage.y}
                  width={stage.width}
                  height={stage.height}
                  fill="#1f2937"
                  stroke={isStageMovable ? "#f59e0b" : "#374151"}
                  strokeWidth={isStageMovable ? "3" : "2"}
                  strokeDasharray={isStageMovable ? "5,5" : "none"}
                  rx="8"
                  className={isStageMovable ? "stage-movable" : ""}
                  onMouseDown={handleStageMouseDown}
                />
                <text
                  x={stage.x + stage.width/2}
                  y={stage.y + stage.height/2}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="white"
                  fontSize="14"
                  fontWeight="bold"
                  pointerEvents="none"
                >
                  STAGE
                </text>
                {isStageMovable && (
                  <text
                    x={stage.x + stage.width/2}
                    y={stage.y + stage.height + 15}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#f59e0b"
                    fontSize="10"
                    pointerEvents="none"
                  >
                    드래그하여 이동
                  </text>
                )}
              </g>

              {/* 좌석들 */}
              {seats.map((seat) => {
                const isSelected = selectedSeats.includes(seat.id);
                
                return (
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
                    
                    {/* 선택 표시 */}
                    {isSelected && (
                      <circle
                        cx={seat.x + 20}
                        cy={seat.y + 20}
                        r="26"
                        fill="none"
                        stroke="#ff6600"
                        strokeWidth="3"
                        strokeDasharray="6,6"
                        className="selection-ring"
                      />
                    )}
                    
                    {/* 좌석 */}
                    <circle
                      cx={seat.x + 20}
                      cy={seat.y + 20}
                      r="18"
                      fill={seatTypes[seat.seatType]?.color || '#3B82F6'}
                      stroke="#fff"
                      strokeWidth="3"
                      className={`seat ${
                        viewMode === 'edit' && !groupMode ? 'draggable' : 
                        groupMode ? 'selectable' : 'view-only'
                      }`}
                      onMouseDown={(e) => handleMouseDown(e, seat)}
                      onClick={(e) => handleSeatClick(seat, e)}
                      transform={seat.rotation ? `rotate(${seat.rotation}, ${seat.x + 20}, ${seat.y + 20})` : ''}
                    />
                    
                    {/* 편집 모드에서의 컨트롤 */}
                    {viewMode === 'edit' && !groupMode && (
                      <g className="seat-controls" opacity="0">
                        <circle
                          cx={seat.x + 50}
                          cy={seat.y + 5}
                          r="10"
                          fill="#ef4444"
                          className="control-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteSeat(seat.id);
                          }}
                        />
                        <text
                          x={seat.x + 50}
                          y={seat.y + 9}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fill="white"
                          fontSize="12"
                          pointerEvents="none"
                        >
                          ×
                        </text>
                        
                        <circle
                          cx={seat.x + 50}
                          cy={seat.y + 35}
                          r="10"
                          fill="#3b82f6"
                          className="control-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            rotateSeat(seat.id);
                          }}
                        />
                        <text
                          x={seat.x + 50}
                          y={seat.y + 39}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fill="white"
                          fontSize="10"
                          pointerEvents="none"
                        >
                          ↻
                        </text>
                      </g>
                    )}
                    
                    {/* 좌석 번호 */}
                    <text
                      x={seat.x + 20}
                      y={seat.y + 20}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="white"
                      fontSize="11"
                      fontWeight="bold"
                      pointerEvents="none"
                      transform={seat.rotation ? `rotate(${seat.rotation}, ${seat.x + 20}, ${seat.y + 20})` : ''}
                    >
                      {seat.seatLabel || '1'}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
          
          <div className="canvas-help">
            {groupMode ? (
              <div className="help-text group-mode">
                🎯 그룹 모드: 좌석 클릭 또는 드래그로 영역 선택. 여러 좌석을 한 번에 편집할 수 있습니다.
              </div>
            ) : viewMode === 'edit' ? (
              <div className="help-text edit-mode">
                💡 편집 모드: 캔버스 클릭으로 좌석 추가, 드래그로 이동, Alt+클릭으로 화면 이동
              </div>
            ) : (
              <div className="help-text preview-mode">
                👀 미리보기 모드: 고객이 보게 될 실제 화면입니다.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 섹션 편집 모달 */}
      {showSectionModal && <SectionModal />}
    </div>
  );
};

export default FlexibleVenueEditor;
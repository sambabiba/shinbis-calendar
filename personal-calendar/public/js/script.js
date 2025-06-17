// ===== 전역 변수 =====
let currentDate = new Date();
let today = new Date();
let selectedDate = null; // 모달에서 선택된 날짜
let events = {}; // 일정 저장 객체 {날짜: [일정들]}
let editingEventId = null; // 수정 중인 일정 ID
let selectedColor = 'blue'; // 현재 선택된 색상
let currentView = 'month'; // 'month' 또는 'week'
let currentWeekStart = null; // 현재 주간 보기의 시작 날짜

// ===== Gemini AI 설정 (수정된 URL) =====
let GEMINI_API_KEY = '';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';

// 환경 변수에서 API 키 읽기 시도
function loadAPIKeyFromEnv() {
    // config.js 파일에서 로드 (window 객체에 설정된 경우)
    if (typeof window !== 'undefined' && window.GEMINI_API_KEY) {
        return window.GEMINI_API_KEY;
    }
    return null;
}

// 배포 환경 감지
function isProduction() {
    return window.location.hostname !== 'localhost' && 
           window.location.hostname !== '127.0.0.1' && 
           !window.location.hostname.includes('localhost');
}

// API 키 초기 설정
function initializeAPIKey() {
    // 1. 환경 변수(config.js)에서 시도
    const envKey = loadAPIKeyFromEnv();
    if (envKey) {
        GEMINI_API_KEY = envKey;
        console.log('✅ config.js에서 API 키를 로드했습니다.');
        return true;
    }
    
    // 2. 로컬 저장소에서 시도
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) {
        GEMINI_API_KEY = savedKey;
        console.log('✅ 로컬 저장소에서 API 키를 로드했습니다.');
        return true;
    }
    
    console.log('⚠️ API 키를 찾을 수 없습니다. 사용자 입력이 필요합니다.');
    return false;
}

// API 키 유효성 검사 강화
function validateAPIKey(key) {
    if (!key) return false;
    
    // Gemini API 키는 AIza로 시작하고 35-45자 길이
    if (!key.startsWith('AIza')) {
        return false;
    }
    
    if (key.length < 35 || key.length > 45) {
        return false;
    }
    
    return true;
}

// 사용자 친화적 API 키 입력 모달
function showAPIKeySetup() {
    const isLocal = !isProduction();
    const setupHTML = `
        <div id="apiKeyModal" style="
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        ">
            <div style="
                background: white;
                padding: 30px;
                border-radius: 15px;
                max-width: 500px;
                margin: 20px;
                box-shadow: 0 20px 40px rgba(0,0,0,0.3);
            ">
                <h2 style="color: #667eea; margin-bottom: 20px;">🤖 AI 기능 설정</h2>
                <p style="margin-bottom: 15px; line-height: 1.6;">
                    AI 일정 추가 기능을 사용하려면 <strong>무료 Gemini API 키</strong>가 필요해요!
                </p>
                
                ${isLocal ? `
                <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #ffc107;">
                    <strong>💡 개발자용 팁:</strong><br>
                    <code>config.js</code> 파일을 만들어서 <code>window.GEMINI_API_KEY = '키'</code>로 설정하면 매번 입력하지 않아도 됩니다!
                </div>
                ` : ''}
                
                <ol style="margin-bottom: 20px; line-height: 1.8; padding-left: 20px;">
                    <li><a href="https://makersuite.google.com/app/apikey" target="_blank" style="color: #667eea;">Google AI Studio</a>에 접속</li>
                    <li>"Create API Key" 버튼 클릭</li>
                    <li>생성된 키를 아래에 붙여넣기</li>
                </ol>
                <input type="text" id="apiKeyInput" placeholder="API 키를 여기에 붙여넣으세요" style="
                    width: 100%;
                    padding: 12px;
                    border: 2px solid #e1e5e9;
                    border-radius: 8px;
                    font-size: 14px;
                    margin-bottom: 15px;
                    box-sizing: border-box;
                ">
                <div style="display: flex; gap: 10px; justify-content: flex-end;">
                    <button onclick="closeAPIKeyModal()" style="
                        background: #6c757d;
                        color: white;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 6px;
                        cursor: pointer;
                    ">나중에</button>
                    <button onclick="saveAPIKey()" style="
                        background: linear-gradient(135deg, #667eea, #764ba2);
                        color: white;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 6px;
                        cursor: pointer;
                    ">저장하고 시작</button>
                </div>
                <p style="margin-top: 15px; font-size: 12px; color: #666;">
                    🔒 API 키는 브라우저에만 저장되며, 외부로 전송되지 않습니다.
                </p>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', setupHTML);
}

// API 키 저장 (수정된 버전)
function saveAPIKey() {
    const input = document.getElementById('apiKeyInput');
    const key = input.value.trim();
    
    if (!key) {
        alert('API 키를 입력해주세요.');
        return;
    }
    
    // 강화된 검증
    if (!validateAPIKey(key)) {
        alert('올바른 Gemini API 키 형식이 아닙니다.\n\nGemini API 키는:\n- AIza로 시작해야 합니다\n- 35-45자 길이여야 합니다\n\n다시 확인해주세요.');
        return;
    }
    
    GEMINI_API_KEY = key;
    localStorage.setItem('gemini_api_key', key);
    
    closeAPIKeyModal();
    addMessage('✅ API 키가 설정되었습니다! 이제 "내일 오후 2시에 회의" 같은 메시지로 일정을 추가할 수 있어요.', 'assistant');
}

// 모달 닫기
function closeAPIKeyModal() {
    const modal = document.getElementById('apiKeyModal');
    if (modal) {
        modal.remove();
    }
}

// API 키 재설정
function resetAPIKey() {
    localStorage.removeItem('gemini_api_key');
    GEMINI_API_KEY = '';
    showAPIKeySetup();
}

// 디버깅용 API 테스트 함수
async function testGeminiAPI() {
    if (!GEMINI_API_KEY) {
        console.error('API 키가 설정되지 않았습니다.');
        return;
    }
    
    console.log('=== Gemini API 테스트 시작 ===');
    
    try {
        const testMessage = "내일 오후 2시에 테스트 미팅";
        console.log('테스트 메시지:', testMessage);
        
        const result = await analyzeEventWithGemini(testMessage);
        console.log('테스트 결과:', result);
        
        if (result) {
            console.log('✅ API 테스트 성공!');
            return true;
        } else {
            console.log('❌ API 응답이 null입니다.');
            return false;
        }
    } catch (error) {
        console.error('❌ API 테스트 실패:', error);
        return false;
    }
}

// ===== 유틸리티 함수들 =====

// 날짜 비교 함수
function isSameDate(date1, date2) {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
}

// 날짜 포맷팅 함수 (YYYY-MM-DD)
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// HTML 이스케이프 함수 (XSS 방지)
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 클릭 효과 추가
function addClickEffect(element) {
    element.style.transform = 'scale(0.95)';
    setTimeout(() => {
        element.style.transform = '';
    }, 150);
}

// ===== 일정 관리 함수들 =====

// 이벤트 폼 설정
function setupEventForm() {
    try {
        const form = document.getElementById('eventForm');
        if (!form) return;
        
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            addNewEvent();
        });
    } catch (error) {
        console.error('이벤트 폼 설정 중 오류:', error);
    }
}

// 새 일정 추가 또는 수정
function addNewEvent() {
    try {
        if (!selectedDate) return;
        
        const title = document.getElementById('eventTitle').value.trim();
        const description = document.getElementById('eventDescription').value.trim();
        const priority = document.getElementById('eventPriority').value;
        const isAllDay = document.getElementById('allDayCheck').checked;
        const startTime = document.getElementById('startTime').value;
        const endTime = document.getElementById('endTime').value;
        
        // 필수 필드 검증
        if (!title) {
            alert('일정 제목을 입력해주세요.');
            return;
        }
        
        // 시간 검증
        if (!isAllDay && startTime && endTime && startTime >= endTime) {
            alert('종료 시간이 시작 시간보다 늦어야 합니다.');
            return;
        }
        
        const dateKey = formatDate(selectedDate);
        
        if (editingEventId) {
            // 기존 일정 수정
            if (events[dateKey]) {
                const eventIndex = events[dateKey].findIndex(event => event.id === editingEventId);
                if (eventIndex !== -1) {
                    events[dateKey][eventIndex] = {
                        ...events[dateKey][eventIndex],
                        title: title,
                        description: description,
                        priority: priority,
                        isAllDay: isAllDay,
                        startTime: isAllDay ? '' : startTime,
                        endTime: isAllDay ? '' : endTime,
                        color: selectedColor,
                        updatedAt: new Date().toISOString()
                    };
                    console.log('일정 수정됨:', events[dateKey][eventIndex]);
                }
            }
        } else {
            // 새 일정 추가
            const newEvent = {
                id: Date.now(),
                title: title,
                description: description,
                priority: priority,
                isAllDay: isAllDay,
                startTime: isAllDay ? '' : startTime,
                endTime: isAllDay ? '' : endTime,
                color: selectedColor,
                createdAt: new Date().toISOString()
            };
            
            if (!events[dateKey]) {
                events[dateKey] = [];
            }
            
            events[dateKey].push(newEvent);
            console.log('새 일정 추가됨:', newEvent);
        }
        
        // localStorage에 저장
        saveEventsToStorage();
        
        // 화면 업데이트
        displayEventsForDate(selectedDate);
        renderCalendar();
        
        // 폼 초기화
        resetEventForm();
        
        // 수정 모드 해제
        editingEventId = null;
        const submitBtn = document.querySelector('#eventForm button[type="submit"]');
        if (submitBtn) {
            submitBtn.textContent = '일정 추가';
        }
        
    } catch (error) {
        console.error('일정 추가/수정 중 오류:', error);
    }
}

// 일정 삭제
function deleteEvent(eventId) {
    try {
        if (!selectedDate) return;
        
        const dateKey = formatDate(selectedDate);
        if (events[dateKey]) {
            events[dateKey] = events[dateKey].filter(event => event.id !== eventId);
            
            if (events[dateKey].length === 0) {
                delete events[dateKey];
            }
            
            saveEventsToStorage();
            displayEventsForDate(selectedDate);
            renderCalendar();
            
            console.log('일정 삭제됨:', eventId);
        }
    } catch (error) {
        console.error('일정 삭제 중 오류:', error);
    }
}

// 해당 날짜의 일정 표시
function displayEventsForDate(date) {
    try {
        const eventList = document.getElementById('eventList');
        if (!eventList) return;
        
        const dateKey = formatDate(date);
        const dayEvents = events[dateKey] || [];
        
        if (dayEvents.length === 0) {
            eventList.innerHTML = '<div class="event-list-empty">이 날에는 일정이 없습니다.</div>';
            return;
        }
        
        eventList.innerHTML = dayEvents.map(event => {
            let timeDisplay = '';
            if (event.isAllDay) {
                timeDisplay = '<div class="event-time">🌅 하루 종일</div>';
            } else if (event.startTime || event.endTime) {
                const start = event.startTime || '';
                const end = event.endTime || '';
                if (start && end) {
                    timeDisplay = `<div class="event-time">🕐 ${start} - ${end}</div>`;
                } else if (start) {
                    timeDisplay = `<div class="event-time">🕐 ${start} 시작</div>`;
                }
            }
            
            return `
                <div class="event-item color-${event.color || 'blue'}">
                    <div class="event-info">
                        <div class="event-title">${escapeHtml(event.title)}</div>
                        ${timeDisplay}
                        ${event.description ? `<div class="event-description">${escapeHtml(event.description)}</div>` : ''}
                    </div>
                    <div class="event-actions">
                        <button class="event-delete" style="background: #4CAF50; margin-right: 5px;" onclick="openEditModal(${event.id})">수정</button>
                        <button class="event-delete" onclick="deleteEvent(${event.id})">삭제</button>
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('일정 표시 중 오류:', error);
    }
}

// 폼 초기화
function resetEventForm() {
    try {
        const elements = ['eventTitle', 'eventDescription', 'eventPriority'];
        elements.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                if (id === 'eventPriority') {
                    element.value = 'normal';
                } else {
                    element.value = '';
                }
            }
        });
        
        // 시간 관련 폼 초기화
        document.getElementById('allDayCheck').checked = false;
        document.getElementById('startTime').value = '';
        document.getElementById('endTime').value = '';
        toggleAllDay(); // UI 상태 업데이트
        
        // 색상 초기화 (파란색으로)
        selectColor('blue');
        
        // 수정 모드 해제
        editingEventId = null;
        
    } catch (error) {
        console.error('폼 초기화 중 오류:', error);
    }
}

// ===== 시간 설정 관련 함수들 =====

// 시간 입력 설정
function setupTimeInputs() {
    try {
        const startTimeInput = document.getElementById('startTime');
        const endTimeInput = document.getElementById('endTime');
        
        if (startTimeInput && endTimeInput) {
            startTimeInput.addEventListener('change', updateDuration);
            endTimeInput.addEventListener('change', updateDuration);
        }
    } catch (error) {
        console.error('시간 입력 설정 중 오류:', error);
    }
}

// 하루 종일 토글
function toggleAllDay() {
    try {
        const allDayCheck = document.getElementById('allDayCheck');
        const timeSection = document.getElementById('timeSection');
        const timeInputs = document.getElementById('timeInputs');
        const durationDisplay = document.getElementById('durationDisplay');
        
        if (!allDayCheck || !timeSection || !timeInputs) return;
        
        if (allDayCheck.checked) {
            // 하루 종일 선택됨
            timeSection.classList.add('all-day');
            timeInputs.classList.add('disabled');
            if (durationDisplay) durationDisplay.classList.add('hidden');
            
            // 시간 입력 값 초기화
            document.getElementById('startTime').value = '';
            document.getElementById('endTime').value = '';
        } else {
            // 시간 설정 모드
            timeSection.classList.remove('all-day');
            timeInputs.classList.remove('disabled');
            updateDuration(); // 기간 표시 업데이트
        }
    } catch (error) {
        console.error('하루 종일 토글 중 오류:', error);
    }
}

// 일정 기간 계산 및 표시
function updateDuration() {
    try {
        const startTime = document.getElementById('startTime').value;
        const endTime = document.getElementById('endTime').value;
        const durationDisplay = document.getElementById('durationDisplay');
        const allDayCheck = document.getElementById('allDayCheck');
        
        if (!durationDisplay || allDayCheck.checked) return;
        
        if (startTime && endTime) {
            const start = new Date(`2000-01-01T${startTime}`);
            const end = new Date(`2000-01-01T${endTime}`);
            
            if (end > start) {
                const diffMs = end - start;
                const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                
                let durationText = '일정 기간: ';
                if (diffHours > 0) {
                    durationText += `${diffHours}시간 `;
                }
                if (diffMinutes > 0) {
                    durationText += `${diffMinutes}분`;
                }
                if (diffHours === 0 && diffMinutes === 0) {
                    durationText += '0분';
                }
                
                durationDisplay.textContent = durationText;
                durationDisplay.classList.remove('hidden');
            } else {
                durationDisplay.textContent = '⚠️ 종료 시간이 시작 시간보다 빨라요';
                durationDisplay.classList.remove('hidden');
                durationDisplay.style.color = '#ff6b6b';
                return;
            }
        } else {
            durationDisplay.classList.add('hidden');
        }
        
        // 정상 색상으로 복원
        durationDisplay.style.color = '#667eea';
    } catch (error) {
        console.error('기간 계산 중 오류:', error);
    }
}

// ===== 색상 관련 함수들 =====

// 색상 선택기 설정
function setupColorPicker() {
    try {
        const colorOptions = document.querySelectorAll('.color-option');
        colorOptions.forEach(option => {
            option.addEventListener('click', function() {
                const color = this.getAttribute('data-color');
                selectColor(color);
            });
        });
        
        // 기본 색상 설정
        selectColor('blue');
    } catch (error) {
        console.error('색상 선택기 설정 중 오류:', error);
    }
}

// 색상 선택
function selectColor(color) {
    try {
        selectedColor = color;
        
        // 모든 색상 옵션에서 선택 해제
        const colorOptions = document.querySelectorAll('.color-option');
        colorOptions.forEach(option => {
            option.classList.remove('selected');
        });
        
        // 선택된 색상 표시
        const selectedOption = document.querySelector(`.color-option[data-color="${color}"]`);
        if (selectedOption) {
            selectedOption.classList.add('selected');
        }
        
        console.log('색상 선택됨:', color);
    } catch (error) {
        console.error('색상 선택 중 오류:', error);
    }
}

// ===== 로컬 스토리지 관련 함수들 =====

// 일정을 localStorage에 저장
function saveEventsToStorage() {
    try {
        localStorage.setItem('calendarEvents', JSON.stringify(events));
        console.log('일정이 localStorage에 저장되었습니다.');
    } catch (error) {
        console.error('일정 저장 실패:', error);
    }
}

// localStorage에서 일정 불러오기
function loadEventsFromStorage() {
    try {
        const savedEvents = localStorage.getItem('calendarEvents');
        if (savedEvents) {
            events = JSON.parse(savedEvents);
            console.log('일정이 localStorage에서 불러와졌습니다:', events);
        }
    } catch (error) {
        console.error('일정 불러오기 실패:', error);
        events = {};
    }
}

// ===== 주간 보기 관련 함수들 =====

// 주의 시작일 구하기 (일요일 기준)
function getWeekStart(date) {
    const weekStart = new Date(date);
    const dayOfWeek = weekStart.getDay();
    weekStart.setDate(weekStart.getDate() - dayOfWeek);
    return weekStart;
}

// 주간 그리드 생성
function generateWeekGrid() {
    try {
        const weekHeader = document.getElementById('weekHeader');
        const weekGrid = document.getElementById('weekGrid');
        
        if (!weekHeader || !weekGrid || !currentWeekStart) return;
        
        console.log('주간 그리드 생성 시작');
        
        // 헤더 생성
        generateWeekHeader(weekHeader);
        
        // 시간대별 그리드 생성
        generateWeekTimeGrid(weekGrid);
        
        console.log('주간 그리드 생성 완료');
        
    } catch (error) {
        console.error('주간 그리드 생성 중 오류:', error);
    }
}

// 주간 헤더 생성
function generateWeekHeader(weekHeader) {
    weekHeader.innerHTML = '';
    
    // 시간 라벨 빈 공간
    const timeLabel = document.createElement('div');
    timeLabel.className = 'time-label';
    weekHeader.appendChild(timeLabel);
    
    // 7일간의 날짜 헤더
    for (let i = 0; i < 7; i++) {
        const currentDay = new Date(currentWeekStart);
        currentDay.setDate(currentDay.getDate() + i);
        
        const dayHeader = document.createElement('div');
        dayHeader.className = 'week-day-header';
        
        // 오늘 날짜 체크
        if (isSameDate(currentDay, today)) {
            dayHeader.classList.add('today');
        }
        
        const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
        const dayName = dayNames[currentDay.getDay()];
        const dayNumber = currentDay.getDate();
        
        dayHeader.innerHTML = `
            <div class="day-number">${dayNumber}</div>
            <div class="day-name">${dayName}</div>
        `;
        
        // 클릭 이벤트 추가
        dayHeader.addEventListener('click', () => {
            handleDayClick(currentDay, dayHeader);
        });
        
        weekHeader.appendChild(dayHeader);
    }
}

// 주간 시간대별 그리드 생성
function generateWeekTimeGrid(weekGrid) {
    weekGrid.innerHTML = '';
    console.log('시간대별 그리드 생성 시작');

    const timeSlots = [
        { id: 'all-day', label: '하루 종일', startHour: 0, endHour: 24 },
        { id: 'morning', label: '오전', startHour: 6, endHour: 12 },
        { id: 'afternoon', label: '오후', startHour: 12, endHour: 18 },
        { id: 'evening', label: '저녁', startHour: 18, endHour: 24 }
    ];

    timeSlots.forEach((timeSlot) => {
        const timeSlotLabel = document.createElement('div');
        timeSlotLabel.className = 'week-time-slot';
        timeSlotLabel.textContent = timeSlot.label;
        weekGrid.appendChild(timeSlotLabel);

        for (let i = 0; i < 7; i++) {
            const currentDay = new Date(currentWeekStart);
            currentDay.setDate(currentDay.getDate() + i);

            const dayColumn = document.createElement('div');
            dayColumn.className = 'week-day-column';
            dayColumn.setAttribute('data-date', formatDate(currentDay));
            dayColumn.setAttribute('data-timeslot', timeSlot.id);

            if (isSameDate(currentDay, today)) {
                dayColumn.classList.add('today');
            }

            displayWeekEventsForTimeSlot(dayColumn, currentDay, timeSlot);

            dayColumn.addEventListener('click', () => {
                handleDayClick(currentDay, dayColumn);
            });

            weekGrid.appendChild(dayColumn);
        }
    });

    console.log('시간대별 그리드 생성 완료');
}

// 시간대별 주간 일정 표시
function displayWeekEventsForTimeSlot(dayColumn, date, timeSlot) {
    const dateKey = formatDate(date);
    const dayEvents = events[dateKey] || [];
    
    // 해당 시간대에 맞는 일정들만 필터링
    const timeSlotEvents = dayEvents.filter(event => {
        return isEventInTimeSlot(event, timeSlot);
    });
    
    timeSlotEvents.forEach(event => {
        const eventElement = document.createElement('div');
        eventElement.className = `week-event color-${event.color || 'blue'}`;
        
        // 시간과 제목 분리해서 표시
        const timeSpan = document.createElement('span');
        timeSpan.className = 'week-event-time';
        
        const titleSpan = document.createElement('span');
        titleSpan.className = 'week-event-title';
        titleSpan.textContent = event.title;
        
        // 시간 표시 로직 (시간대에 따라 다르게)
        if (timeSlot.id === 'all-day') {
            // 하루 종일 시간대에서는 "종일"만 표시
            if (event.isAllDay) {
                timeSpan.textContent = '종일';
                eventElement.appendChild(timeSpan);
            }
        } else {
            // 다른 시간대에서는 구체적인 시간 표시
            if (!event.isAllDay) {
                // 신 형식: startTime, endTime 사용
                if (event.startTime || event.endTime) {
                    if (event.startTime && event.endTime) {
                        timeSpan.textContent = `${event.startTime}-${event.endTime}`;
                    } else if (event.startTime) {
                        timeSpan.textContent = event.startTime;
                    }
                }
                // 구 형식: time 필드 사용 (하위 호환성)
                else if (event.time) {
                    timeSpan.textContent = event.time;
                }
                
                if (timeSpan.textContent) {
                    eventElement.appendChild(timeSpan);
                }
            }
        }
        
        eventElement.appendChild(titleSpan);
        
        // 툴팁 추가
        let tooltipText = event.title;
        if (event.isAllDay) {
            tooltipText = `🌅 하루 종일: ${tooltipText}`;
        } else if (event.startTime || event.endTime) {
            const timeStr = event.startTime && event.endTime 
                ? `${event.startTime} - ${event.endTime}` 
                : (event.startTime || '');
            if (timeStr) tooltipText = `🕐 ${timeStr}: ${tooltipText}`;
        }
        if (event.description) tooltipText += `\n${event.description}`;
        eventElement.title = tooltipText;
        
        // 일정 클릭 이벤트 (수정용)
        eventElement.addEventListener('click', (e) => {
            e.stopPropagation();
            selectedDate = date;
            openEditModal(event.id);
        });
        
        dayColumn.appendChild(eventElement);
    });
}

// 일정이 특정 시간대에 속하는지 확인
function isEventInTimeSlot(event, timeSlot) {
    // 하루 종일 일정인 경우
    if (event.isAllDay) {
        return timeSlot.id === 'all-day';
    }
    
    // 하루 종일 시간대에서는 하루 종일 일정만 표시
    if (timeSlot.id === 'all-day') {
        return false;
    }
    
    // 시간 정보 추출 (구 형식과 신 형식 모두 지원)
    let timeToCheck = null;
    
    if (event.startTime) {
        // 신 형식: startTime 사용
        timeToCheck = event.startTime;
    } else if (event.time) {
        // 구 형식: time 필드 사용
        timeToCheck = event.time;
    }
    
    // 시간이 설정되지 않은 경우 오전에 표시
    if (!timeToCheck) {
        return timeSlot.id === 'morning';
    }
    
    // 시간이 있는 경우 해당 시간대 확인
    const startHour = parseInt(timeToCheck.split(':')[0]);
    
    // 시간대별 분류
    switch (timeSlot.id) {
        case 'morning':
            return startHour >= 6 && startHour < 12;
        case 'afternoon':
            return startHour >= 12 && startHour < 18;
        case 'evening':
            return startHour >= 18 || startHour < 6;
        default:
            return false;
    }
}

// ===== 보기 모드 전환 함수들 =====

// 월간 보기로 전환
function switchToMonthView() {
    try {
        console.log('월간 보기 전환 시작');
        currentView = 'month';
        
        // UI 요소 확인
        const monthView = document.getElementById('monthView');
        const weekView = document.getElementById('weekView');
        const monthBtn = document.getElementById('monthViewBtn');
        const weekBtn = document.getElementById('weekViewBtn');
        
        // UI 업데이트
        if (monthView) {
            monthView.classList.remove('hidden');
            console.log('월간 보기 표시');
        }
        
        if (weekView) {
            weekView.classList.remove('active');
            console.log('주간 보기 숨김');
        }
        
        // 버튼 활성화 상태 변경
        if (monthBtn) monthBtn.classList.add('active');
        if (weekBtn) weekBtn.classList.remove('active');
        
        // 월간 달력 렌더링
        renderMonthView();
        
        console.log('월간 보기 전환 완료');
    } catch (error) {
        console.error('월간 보기 전환 중 오류:', error);
    }
}

// 주간 보기로 전환
function switchToWeekView() {
    try {
        console.log('주간 보기 전환 시작');
        currentView = 'week';
        
        // 현재 날짜 기준으로 주간 시작일 설정
        currentWeekStart = getWeekStart(currentDate);
        console.log('주간 시작일:', currentWeekStart.toLocaleDateString());
        
        // UI 요소 확인
        const monthView = document.getElementById('monthView');
        const weekView = document.getElementById('weekView');
        const monthBtn = document.getElementById('monthViewBtn');
        const weekBtn = document.getElementById('weekViewBtn');
        
        // UI 업데이트
        if (monthView) {
            monthView.classList.add('hidden');
            console.log('월간 보기 숨김');
        }
        
        if (weekView) {
            weekView.classList.add('active');
            console.log('주간 보기 활성화');
        }
        
        // 버튼 활성화 상태 변경
        if (monthBtn) monthBtn.classList.remove('active');
        if (weekBtn) weekBtn.classList.add('active');
        
        // 주간 달력 렌더링
        renderWeekView();
        
        console.log('주간 보기 전환 완료');
        
    } catch (error) {
        console.error('주간 보기 전환 중 오류:', error);
    }
}

// ===== AI 어시스턴트 관련 함수들 =====

// AI 어시스턴트 토글
function toggleAI() {
    const aiAssistant = document.getElementById('aiAssistant');
    aiAssistant.classList.toggle('minimized');
    
    // 토글 버튼 텍스트 변경
    const toggleBtn = aiAssistant.querySelector('.ai-toggle');
    if (aiAssistant.classList.contains('minimized')) {
        toggleBtn.textContent = '+';
    } else {
        toggleBtn.textContent = '−';
    }
}

// 메시지 전송 (수정된 버전 - 디버깅 기능 포함)
async function sendMessage() {
    const input = document.getElementById('aiInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    // API 키 확인
    if (!GEMINI_API_KEY) {
        showAPIKeySetup();
        return;
    }
    
    // 디버깅용 특별 명령어
    if (message === '/test') {
        addMessage('API 테스트를 시작합니다...', 'assistant');
        const testResult = await testGeminiAPI();
        const resultMessage = testResult ? '✅ API 테스트 성공!' : '❌ API 테스트 실패';
        addMessage(resultMessage, 'assistant');
        input.value = '';
        return;
    }
    
    // 사용자 메시지 추가
    addMessage(message, 'user');
    input.value = '';
    
    // 로딩 메시지 표시
    const loadingMessageId = addMessage('🤔 분석 중...', 'assistant');
    
    try {
        // Gemini API로 일정 정보 추출
        const eventInfo = await analyzeEventWithGemini(message);
        
        // 로딩 메시지 제거
        removeMessage(loadingMessageId);
        
        if (eventInfo) {
            addEventFromAI(eventInfo);
        } else {
            addMessage('죄송해요, 일정 정보를 파악할 수 없었어요. 다시 시도해주세요.\n\n예시:\n• "내일 오후 2시에 회의"\n• "6월 25일 하루종일 휴가"\n• "모레 저녁 7시 친구랑 영화"\n\n💡 "/test" 입력으로 API 연결을 테스트할 수 있어요.', 'assistant');
        }
    } catch (error) {
        console.error('AI 처리 중 오류:', error);
        removeMessage(loadingMessageId);
        
        if (error.message.includes('API 키가 올바르지 않거나') || 
            error.message.includes('403') || 
            error.message.includes('401')) {
            addMessage('❌ API 키가 올바르지 않습니다. 새로운 키로 다시 설정해주세요.', 'assistant');
            resetAPIKey();
        } else if (error.message.includes('API 엔드포인트를 찾을 수 없습니다')) {
            addMessage('❌ API 연결에 문제가 있습니다. 잠시 후 다시 시도해주세요.\n\n문제가 계속되면 개발자에게 문의하세요.', 'assistant');
        } else {
            addMessage(`❌ 오류가 발생했어요: ${error.message}\n\n네트워크 연결을 확인하고 다시 시도해주세요.`, 'assistant');
        }
    }
}

// Gemini API로 일정 분석 (수정된 버전)
async function analyzeEventWithGemini(userMessage) {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    const prompt = `당신은 일정 관리 AI입니다. 사용자의 메시지를 분석해서 일정 정보를 JSON 형태로 추출해주세요.

현재 날짜: ${todayStr} (${today.toLocaleDateString('ko-KR', { weekday: 'long' })})

사용자 메시지: "${userMessage}"

다음 JSON 형식으로 응답해주세요:
{
  "title": "일정 제목",
  "date": "YYYY-MM-DD",
  "startTime": "HH:MM", 
  "endTime": "HH:MM",
  "isAllDay": false,
  "description": "상세 설명",
  "priority": "normal",
  "color": "blue"
}

규칙:
1. 날짜는 반드시 YYYY-MM-DD 형식
2. "내일" = ${new Date(today.getTime() + 24*60*60*1000).toISOString().split('T')[0]}
3. "모레" = ${new Date(today.getTime() + 48*60*60*1000).toISOString().split('T')[0]}
4. 시간이 명시되지 않으면 오전 9시로 설정하고 1시간 후를 종료시간으로
5. "하루종일", "올데이" 등이 있으면 isAllDay: true
6. 오후 시간은 24시간 형식으로 변환
7. 일정을 추가할 수 없는 메시지면 null 반환
8. JSON만 응답하고 다른 텍스트는 포함하지 마세요

색상 가이드:
- 업무/회의: blue
- 건강/운동: green  
- 개인/약속: purple
- 여가/휴식: orange
- 중요한 일: red
- 학습/교육: yellow`;

    const requestBody = {
        contents: [{
            parts: [{
                text: prompt
            }]
        }],
        generationConfig: {
            temperature: 0.1,
            topK: 1,
            topP: 1,
            maxOutputTokens: 2048,
        },
        safetySettings: [
            {
                category: "HARM_CATEGORY_HARASSMENT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
                category: "HARM_CATEGORY_HATE_SPEECH",
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
                category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
                category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
            }
        ]
    };

    console.log('Gemini API 요청 URL:', `${GEMINI_API_URL}?key=${GEMINI_API_KEY.substring(0, 10)}...`);
    console.log('요청 본문:', JSON.stringify(requestBody, null, 2));

    try {
        const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });

        console.log('응답 상태:', response.status);
        console.log('응답 헤더:', [...response.headers.entries()]);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('API 오류 응답:', errorText);
            
            if (response.status === 404) {
                throw new Error('API 엔드포인트를 찾을 수 없습니다. API URL을 확인해주세요.');
            } else if (response.status === 403) {
                throw new Error('API 키가 올바르지 않거나 권한이 없습니다.');
            } else if (response.status === 400) {
                throw new Error('요청 형식이 올바르지 않습니다.');
            } else {
                throw new Error(`API 요청 실패: ${response.status} - ${errorText}`);
            }
        }

        const data = await response.json();
        console.log('API 응답 데이터:', data);
        
        const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (!aiResponse) {
            console.error('AI 응답이 없습니다:', data);
            throw new Error('AI 응답이 없습니다');
        }

        console.log('AI 원본 응답:', aiResponse);

        try {
            // JSON 추출 (코드 블록이나 다른 텍스트 제거)
            const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsedData = JSON.parse(jsonMatch[0]);
                console.log('파싱된 일정 데이터:', parsedData);
                return parsedData;
            } else if (aiResponse.toLowerCase().includes('null')) {
                return null;
            } else {
                // JSON 파싱 시도
                const parsedData = JSON.parse(aiResponse);
                console.log('직접 파싱된 일정 데이터:', parsedData);
                return parsedData;
            }
        } catch (parseError) {
            console.error('JSON 파싱 오류:', parseError);
            console.error('파싱 시도한 텍스트:', aiResponse);
            return null;
        }

    } catch (networkError) {
        console.error('네트워크 오류:', networkError);
        throw networkError;
    }
}

// AI가 분석한 일정 정보로 일정 추가
function addEventFromAI(eventInfo) {
    try {
        // 날짜 유효성 검사
        const targetDate = new Date(eventInfo.date);
        if (isNaN(targetDate.getTime())) {
            addMessage('날짜 정보가 올바르지 않아요. 다시 시도해주세요.', 'assistant');
            return;
        }

        // 시간 유효성 검사
        if (!eventInfo.isAllDay) {
            if (!isValidTime(eventInfo.startTime) || !isValidTime(eventInfo.endTime)) {
                addMessage('시간 정보가 올바르지 않아요. 다시 시도해주세요.', 'assistant');
                return;
            }

            // 종료 시간이 시작 시간보다 빠른지 확인
            if (eventInfo.startTime >= eventInfo.endTime) {
                addMessage('종료 시간이 시작 시간보다 늦어야 해요.', 'assistant');
                return;
            }
        }

        // 일정 객체 생성
        const newEvent = {
            id: Date.now(),
            title: eventInfo.title || '새 일정',
            description: eventInfo.description || 'AI로 추가된 일정',
            priority: eventInfo.priority || 'normal',
            isAllDay: eventInfo.isAllDay || false,
            startTime: eventInfo.isAllDay ? '' : eventInfo.startTime,
            endTime: eventInfo.isAllDay ? '' : eventInfo.endTime,
            color: eventInfo.color || 'blue',
            createdAt: new Date().toISOString()
        };

        // 일정 추가
        const dateKey = formatDate(targetDate);
        if (!events[dateKey]) {
            events[dateKey] = [];
        }

        events[dateKey].push(newEvent);
        saveEventsToStorage();
        renderCalendar();

        // 성공 메시지
        const koreanDate = targetDate.toLocaleDateString('ko-KR', {
            month: 'long',
            day: 'numeric',
            weekday: 'short'
        });

        let timeInfo = '';
        if (eventInfo.isAllDay) {
            timeInfo = '하루 종일';
        } else {
            timeInfo = `${eventInfo.startTime} - ${eventInfo.endTime}`;
        }

        addMessage(`✅ ${koreanDate}에 "${eventInfo.title}" 일정을 추가했어요!\n📅 ${timeInfo}`, 'assistant');

    } catch (error) {
        console.error('일정 추가 중 오류:', error);
        addMessage('일정 추가 중 오류가 발생했어요. 다시 시도해주세요.', 'assistant');
    }
}

// 시간 형식 유효성 검사
function isValidTime(timeStr) {
    if (!timeStr) return false;
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(timeStr);
}

// 메시지 추가 (ID 반환)
function addMessage(content, sender) {
    const messagesContainer = document.getElementById('aiMessages');
    const messageDiv = document.createElement('div');
    const messageId = Date.now();
    
    messageDiv.className = `ai-message ${sender}`;
    messageDiv.id = `message-${messageId}`;
    messageDiv.innerHTML = `<div class="message-content">${content.replace(/\n/g, '<br>')}</div>`;
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    return messageId;
}

// 메시지 제거
function removeMessage(messageId) {
    const messageElement = document.getElementById(`message-${messageId}`);
    if (messageElement) {
        messageElement.remove();
    }
}

// 엔터키로 메시지 전송
function setupAIKeyEvents() {
    const aiInput = document.getElementById('aiInput');
    if (aiInput) {
        aiInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    }
}

// 일정 조회 처리
function handleShowSchedule() {
    const today = new Date();
    const todayKey = formatDate(today);
    const tomorrowKey = formatDate(new Date(today.getTime() + 24*60*60*1000));
    
    let message = '';
    
    // 오늘 일정
    const todayEvents = events[todayKey] || [];
    if (todayEvents.length > 0) {
        message += '📅 **오늘 일정:**\n';
        todayEvents.forEach(event => {
            const timeStr = event.isAllDay ? '하루종일' : `${event.startTime}-${event.endTime}`;
            message += `• ${timeStr} ${event.title}\n`;
        });
        message += '\n';
    }
    
    // 내일 일정
    const tomorrowEvents = events[tomorrowKey] || [];
    if (tomorrowEvents.length > 0) {
        message += '📅 **내일 일정:**\n';
        tomorrowEvents.forEach(event => {
            const timeStr = event.isAllDay ? '하루종일' : `${event.startTime}-${event.endTime}`;
            message += `• ${timeStr} ${event.title}\n`;
        });
    }
    
    if (message === '') {
        message = '오늘과 내일은 일정이 없어요! 😊';
    }
    
    addMessage(message, 'assistant');
}

// AI 초기화 함수
function initializeAI() {
    console.log('AI 어시스턴트 초기화...');
    
    // 키보드 이벤트 설정
    setupAIKeyEvents();
    
    // API 키 초기 설정
    if (initializeAPIKey()) {
        setTimeout(() => {
            addMessage('✅ API 키가 설정되어 있어요! AI 기능을 바로 사용할 수 있습니다.\n\n예시: "내일 오후 2시에 회의"', 'assistant');
        }, 1500);
    } else {
        setTimeout(() => {
            addMessage('🤖 안녕하세요! AI 일정 추가 기능을 사용하시려면 무료 API 키 설정이 필요해요.\n\n첫 메시지를 보내시면 설정 방법을 안내해드릴게요!', 'assistant');
        }, 1500);
    }
    
    console.log('AI 어시스턴트 초기화 완료');
}

// API 키 설정 확인 (더 이상 사용하지 않음)
function checkGeminiAPIKey() {
    return true;
}

// ===== 초기화 =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('📅 개인 캘린더 앱이 시작되었습니다!');
    
    try {
        // 저장된 일정 불러오기
        loadEventsFromStorage();
        
        // 캘린더 렌더링
        renderCalendar();
        
        // 이벤트 폼 제출 리스너 추가
        setupEventForm();
        
        // 색상 선택 이벤트 추가
        setupColorPicker();
        
        // 시간 설정 이벤트 추가
        setupTimeInputs();
        
        // 모달 외부 클릭시 닫기
        setupModalEvents();
        
        // AI 어시스턴트 초기화
        setTimeout(() => {
            initializeAI();
        }, 500);
        
        console.log('초기화 완료!');
    } catch (error) {
        console.error('초기화 중 오류 발생:', error);
        // 기본 캘린더라도 표시
        renderCalendar();
    }
});

// ===== 전역 함수 할당 (HTML에서 호출하는 함수들) =====
window.toggleAI = toggleAI;
window.sendMessage = sendMessage;
window.previousPeriod = previousPeriod;
window.nextPeriod = nextPeriod;
window.switchToMonthView = switchToMonthView;
window.switchToWeekView = switchToWeekView;
window.closeModal = closeModal;
window.toggleAllDay = toggleAllDay;
window.openEditModal = openEditModal;
window.deleteEvent = deleteEvent;
window.saveAPIKey = saveAPIKey;
window.closeAPIKeyModal = closeAPIKeyModal;
window.resetAPIKey = resetAPIKey;

console.log('📅 캘린더 앱 스크립트 로드 완료!');

// 일정 표시 추가
function addEventIndicators(dayElement, dateObj) {
    const dateKey = formatDate(dateObj);
    const dayEvents = events[dateKey] || [];
    
    if (dayEvents.length > 0) {
        dayElement.classList.add('has-events');
        
        // 주요 색상 결정 (첫 번째 일정의 색상 또는 혼합)
        const mainColor = getMainColorForDate(dayEvents);
        dayElement.classList.add(`color-${mainColor}`);
        
        // 일정 개수 표시
        const eventCount = document.createElement('div');
        eventCount.className = 'event-count';
        eventCount.textContent = dayEvents.length;
        dayElement.appendChild(eventCount);
    }
}

// 해당 날짜의 주요 색상 결정
function getMainColorForDate(dayEvents) {
    if (dayEvents.length === 1) {
        return dayEvents[0].color || 'blue';
    }
    
    // 여러 일정이 있을 때 가장 많은 색상 또는 첫 번째 색상
    const colorCounts = {};
    dayEvents.forEach(event => {
        const color = event.color || 'blue';
        colorCounts[color] = (colorCounts[color] || 0) + 1;
    });
    
    // 가장 많이 사용된 색상 반환
    return Object.keys(colorCounts).reduce((a, b) => 
        colorCounts[a] > colorCounts[b] ? a : b
    );
}

// 오늘 표시 아이콘 추가
function addTodayIndicator(dayElement) {
    const todayIndicator = document.createElement('div');
    todayIndicator.className = 'today-indicator';
    todayIndicator.textContent = '●';
    dayElement.appendChild(todayIndicator);
}

// ===== 날짜 스타일 및 요소 생성 함수들 =====

// 날짜 스타일 적용
function applyDayStyles(dayElement, dateObj, dayOfWeek, isOtherMonth) {
    if (isOtherMonth) {
        dayElement.classList.add('other-month');
        return;
    }
    
    // 요일별 스타일
    if (dayOfWeek === 0) dayElement.classList.add('sunday');
    if (dayOfWeek === 6) dayElement.classList.add('saturday');
    
    // 오늘 날짜 체크
    if (isSameDate(dateObj, today)) {
        dayElement.classList.add('today');
        addTodayIndicator(dayElement);
    }
    
    // 과거 날짜 체크
    if (dateObj < today && !isSameDate(dateObj, today)) {
        dayElement.classList.add('past');
    }
}

// 개별 날짜 요소 생성
function createDayElement(day, year, month, isOtherMonth) {
    const dayElement = document.createElement('div');
    dayElement.className = 'calendar-day';
    
    // 실제 날짜 객체 생성
    const dateObj = new Date(year, month, day);
    const dayOfWeek = dateObj.getDay();
    
    // 날짜 표시
    const dayNumber = document.createElement('div');
    dayNumber.className = 'day-number';
    dayNumber.textContent = day;
    dayElement.appendChild(dayNumber);
    
    // 스타일 클래스 적용
    applyDayStyles(dayElement, dateObj, dayOfWeek, isOtherMonth);
    
    // 클릭 이벤트 추가
    dayElement.addEventListener('click', function() {
        handleDayClick(dateObj, dayElement);
    });
    
    // 데이터 속성 추가
    dayElement.setAttribute('data-date', formatDate(dateObj));
    
    // 일정이 있는 날짜 표시 (다른 달이 아닐 때만)
    if (!isOtherMonth) {
        addEventIndicators(dayElement, dateObj);
    }
    
    return dayElement;
}

// ===== 달력 생성 함수들 =====

// 이전 달 날짜들 추가
function addPreviousMonthDays(calendarGrid, year, month, startDayOfWeek) {
    const prevMonth = new Date(year, month, 0);
    const prevMonthLastDate = prevMonth.getDate();
    
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
        const dayElement = createDayElement(
            prevMonthLastDate - i, 
            year, 
            month - 1, 
            true // 다른 달
        );
        calendarGrid.appendChild(dayElement);
    }
}

// 현재 달 날짜들 추가
function addCurrentMonthDays(calendarGrid, year, month, lastDate) {
    for (let day = 1; day <= lastDate; day++) {
        const dayElement = createDayElement(day, year, month, false);
        calendarGrid.appendChild(dayElement);
    }
}

// 다음 달 날짜들 추가
function addNextMonthDays(calendarGrid, year, month, startDayOfWeek, lastDate) {
    const remainingDays = 42 - (startDayOfWeek + lastDate);
    
    for (let day = 1; day <= remainingDays; day++) {
        const dayElement = createDayElement(
            day, 
            year, 
            month + 1, 
            true // 다른 달
        );
        calendarGrid.appendChild(dayElement);
    }
}

// 달력 그리드 생성
function generateCalendarGrid(year, month) {
    const calendarGrid = document.getElementById('calendarGrid');
    if (!calendarGrid) {
        console.error('calendarGrid 요소를 찾을 수 없습니다');
        return;
    }
    
    calendarGrid.innerHTML = ''; // 기존 내용 제거
    
    // 해당 월의 첫째 날과 마지막 날
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // 첫째 날의 요일 (0: 일요일, 6: 토요일)
    const startDayOfWeek = firstDay.getDay();
    
    console.log(`${month + 1}월 첫째 날 요일: ${startDayOfWeek}, 마지막 날: ${lastDay.getDate()}일`);
    
    // 이전 달의 마지막 날들 추가
    addPreviousMonthDays(calendarGrid, year, month, startDayOfWeek);
    
    // 현재 달의 날짜들 추가
    addCurrentMonthDays(calendarGrid, year, month, lastDay.getDate());
    
    // 다음 달의 첫 날들 추가 (6주 달력을 만들기 위해)
    addNextMonthDays(calendarGrid, year, month, startDayOfWeek, lastDay.getDate());
}

// 현재 월 표시 업데이트
function updateCurrentMonthDisplay(year, month) {
    const monthNames = [
        '1월', '2월', '3월', '4월', '5월', '6월',
        '7월', '8월', '9월', '10월', '11월', '12월'
    ];
    
    const displayText = `${year}년 ${monthNames[month]}`;
    const monthElement = document.getElementById('currentMonth');
    if (monthElement) {
        monthElement.textContent = displayText;
    }
}

// 주간 표시 업데이트
function updateWeekDisplay() {
    const monthElement = document.getElementById('currentMonth');
    if (!monthElement || !currentWeekStart) return;
    
    const weekEnd = new Date(currentWeekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    
    const startMonth = currentWeekStart.getMonth() + 1;
    const endMonth = weekEnd.getMonth() + 1;
    const startDate = currentWeekStart.getDate();
    const endDate = weekEnd.getDate();
    const year = currentWeekStart.getFullYear();
    
    let displayText;
    if (startMonth === endMonth) {
        displayText = `${year}년 ${startMonth}월 ${startDate}일 - ${endDate}일`;
    } else {
        displayText = `${year}년 ${startMonth}월 ${startDate}일 - ${endMonth}월 ${endDate}일`;
    }
    
    monthElement.textContent = displayText;
}

// 달력 렌더링 메인 함수
function renderCalendar() {
    try {
        if (currentView === 'month') {
            renderMonthView();
        } else {
            renderWeekView();
        }
    } catch (error) {
        console.error('달력 렌더링 중 오류:', error);
    }
}

// 월간 보기 렌더링
function renderMonthView() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    console.log(`월간 달력 렌더링: ${year}년 ${month + 1}월`);
    
    // 현재 월 표시 업데이트
    updateCurrentMonthDisplay(year, month);
    
    // 달력 그리드 생성
    generateCalendarGrid(year, month);
    
    console.log('월간 달력 렌더링 완료');
}

// 주간 보기 렌더링
function renderWeekView() {
    try {
        // 현재 주의 시작일 계산 (일요일 기준)
        if (!currentWeekStart) {
            currentWeekStart = getWeekStart(currentDate);
        }
        
        console.log('주간 달력 렌더링:', currentWeekStart.toLocaleDateString());
        
        // 주간 표시 업데이트
        updateWeekDisplay();
        
        // 주간 그리드 생성
        console.log('generateWeekGrid 함수 호출 시작');
        generateWeekGrid();
        console.log('generateWeekGrid 함수 호출 완료');
        
        console.log('주간 달력 렌더링 완료');
    } catch (error) {
        console.error('주간 달력 렌더링 중 오류:', error);
    }
}

// ===== 이벤트 처리 함수들 =====

// 날짜 클릭 처리
function handleDayClick(date, element) {
    try {
        const formattedDate = formatDate(date);
        const koreanDate = date.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long'
        });
        
        console.log('클릭된 날짜:', formattedDate, '(' + koreanDate + ')');
        
        // 시각적 피드백
        addClickEffect(element);
        
        // 선택된 날짜 저장
        selectedDate = date;
        
        // 모달 열기
        openEventModal(date, koreanDate);
    } catch (error) {
        console.error('날짜 클릭 처리 중 오류:', error);
    }
}

// 이전 달로 이동
function previousMonth() {
    try {
        currentDate.setMonth(currentDate.getMonth() - 1);
        console.log('이전 달로 이동:', currentDate.toLocaleDateString());
        renderCalendar();
    } catch (error) {
        console.error('이전 달 이동 중 오류:', error);
    }
}

// 다음 달로 이동
function nextMonth() {
    try {
        currentDate.setMonth(currentDate.getMonth() + 1);
        console.log('다음 달로 이동:', currentDate.toLocaleDateString());
        renderCalendar();
    } catch (error) {
        console.error('다음 달 이동 중 오류:', error);
    }
}

// 통합 이전/다음 기간 이동
function previousPeriod() {
    try {
        if (currentView === 'month') {
            previousMonth();
        } else {
            previousWeek();
        }
    } catch (error) {
        console.error('이전 기간 이동 중 오류:', error);
    }
}

function nextPeriod() {
    try {
        if (currentView === 'month') {
            nextMonth();
        } else {
            nextWeek();
        }
    } catch (error) {
        console.error('다음 기간 이동 중 오류:', error);
    }
}

// 이전 주로 이동
function previousWeek() {
    try {
        if (!currentWeekStart) {
            currentWeekStart = getWeekStart(currentDate);
        }
        currentWeekStart.setDate(currentWeekStart.getDate() - 7);
        console.log('이전 주로 이동:', currentWeekStart.toLocaleDateString());
        renderWeekView();
    } catch (error) {
        console.error('이전 주 이동 중 오류:', error);
    }
}

// 다음 주로 이동
function nextWeek() {
    try {
        if (!currentWeekStart) {
            currentWeekStart = getWeekStart(currentDate);
        }
        currentWeekStart.setDate(currentWeekStart.getDate() + 7);
        console.log('다음 주로 이동:', currentWeekStart.toLocaleDateString());
        renderWeekView();
    } catch (error) {
        console.error('다음 주 이동 중 오류:', error);
    }
}

// ===== 모달 관련 함수들 =====

// 모달 열기
function openEventModal(date, koreanDate) {
    try {
        const modal = document.getElementById('eventModal');
        const selectedDateDiv = document.getElementById('selectedDate');
        const modalTitle = document.getElementById('modalTitle');
        
        if (!modal || !selectedDateDiv) {
            console.error('모달 요소를 찾을 수 없습니다');
            return;
        }
        
        // 수정 모드 초기화
        editingEventId = null;
        modalTitle.textContent = '일정 관리';
        
        // 선택된 날짜 표시
        selectedDateDiv.textContent = koreanDate;
        
        // 해당 날짜의 기존 일정 표시
        displayEventsForDate(date);
        
        // 폼 초기화
        resetEventForm();
        
        // 모달 표시
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    } catch (error) {
        console.error('모달 열기 중 오류:', error);
    }
}

// 일정 수정을 위한 모달 열기
function openEditModal(eventId) {
    try {
        if (!selectedDate) return;
        
        const dateKey = formatDate(selectedDate);
        const dayEvents = events[dateKey] || [];
        const eventToEdit = dayEvents.find(event => event.id === eventId);
        
        if (!eventToEdit) {
            console.error('수정할 일정을 찾을 수 없습니다');
            return;
        }
        
        // 수정 모드 설정
        editingEventId = eventId;
        document.getElementById('modalTitle').textContent = '일정 수정';
        
        // 폼에 기존 데이터 입력
        document.getElementById('eventTitle').value = eventToEdit.title || '';
        document.getElementById('eventDescription').value = eventToEdit.description || '';
        document.getElementById('eventPriority').value = eventToEdit.priority || 'normal';
        
        // 시간 설정 (구 형식과 신 형식 모두 지원)
        if (eventToEdit.isAllDay) {
            document.getElementById('allDayCheck').checked = true;
            toggleAllDay();
        } else {
            document.getElementById('allDayCheck').checked = false;
            
            // 신 형식 우선, 구 형식 fallback
            if (eventToEdit.startTime || eventToEdit.endTime) {
                document.getElementById('startTime').value = eventToEdit.startTime || '';
                document.getElementById('endTime').value = eventToEdit.endTime || '';
            } else if (eventToEdit.time) {
                // 구 형식의 time 필드를 startTime으로 변환
                document.getElementById('startTime').value = eventToEdit.time;
                document.getElementById('endTime').value = '';
            }
            
            toggleAllDay();
        }
        
        // 색상 선택
        selectColor(eventToEdit.color || 'blue');
        
        // 버튼 텍스트 변경
        const submitBtn = document.querySelector('#eventForm button[type="submit"]');
        if (submitBtn) {
            submitBtn.textContent = '일정 수정';
        }
        
        console.log('수정 모드로 설정됨:', eventToEdit);
    } catch (error) {
        console.error('수정 모달 열기 중 오류:', error);
    }
}

// 모달 닫기
function closeModal() {
    try {
        const modal = document.getElementById('eventModal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
        selectedDate = null;
        editingEventId = null;
        
        // 버튼 텍스트 원래대로
        const submitBtn = document.querySelector('#eventForm button[type="submit"]');
        if (submitBtn) {
            submitBtn.textContent = '일정 추가';
        }
        
        // 모달 제목 원래대로
        const modalTitle = document.getElementById('modalTitle');
        if (modalTitle) {
            modalTitle.textContent = '일정 관리';
        }
    } catch (error) {
        console.error('모달 닫기 중 오류:', error);
    }
}

// 모달 이벤트 설정
function setupModalEvents() {
    try {
        const modal = document.getElementById('eventModal');
        if (!modal) return;
        
        // 모달 외부 클릭시 닫기
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeModal();
            }
        });
        
        // ESC 키로 모달 닫기
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && modal.style.display === 'block') {
                closeModal();
            }
        });
    } catch (error) {
        console.error('모달 이벤트 설정 중 오류:', error);
    }
}
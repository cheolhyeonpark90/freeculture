document.addEventListener('DOMContentLoaded', async () => {
    // 필요한 DOM 요소들 선택
    const eventList = document.getElementById('event-list');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const dropdownContainer = document.getElementById('dropdown-container');
    const modalContainer = document.getElementById('modal-container');
    const modalContent = document.querySelector('.modal-content');
    const modalBackdrop = document.querySelector('.modal-backdrop');
    
    // 캘린더 상태 관리를 위한 변수
    let currentCalendarDate = new Date();

    // -- 데이터 정의 (지역, 카테고리) --
    const regionData = {
        "서울": ["강남구", "강동구", "강북구", "강서구", "관악구", "광진구", "구로구", "금천구", "노원구", "도봉구", "동대문구", "동작구", "마포구", "서대문구", "서초구", "성동구", "성북구", "송파구", "양천구", "영등포구", "용산구", "은평구", "종로구", "중구", "중랑구"],
        "경기": ["가평군", "고양시", "과천시", "광명시", "광주시", "구리시", "군포시", "김포시", "남양주시", "동두천시", "부천시", "성남시", "수원시", "시흥시", "안산시", "안성시", "안양시", "양주시", "양평군", "여주시", "연천군", "오산시", "용인시", "의왕시", "의정부시", "이천시", "파주시", "평택시", "포천시", "하남시", "화성시"],
        "인천": ["강화군", "계양구", "미추홀구", "남동구", "동구", "부평구", "서구", "연수구", "옹진군", "중구"],
        "강원": ["강릉시", "고성군", "동해시", "삼척시", "속초시", "양구군", "양양군", "영월군", "원주시", "인제군", "정선군", "철원군", "춘천시", "태백시", "평창군", "홍천군", "화천군", "횡성군"],
        "대전": ["대덕구", "동구", "서구", "유성구", "중구"], "세종": ["세종시"],
        "충남": ["계룡시", "공주시", "금산군", "논산시", "당진시", "보령시", "부여군", "서산시", "서천군", "아산시", "예산군", "천안시", "청양군", "태안군", "홍성군"],
        "충북": ["괴산군", "단양군", "보은군", "영동군", "옥천군", "음성군", "제천시", "증평군", "진천군", "청주시", "충주시"],
        "광주": ["광산구", "남구", "동구", "북구", "서구"],
        "전남": ["강진군", "고흥군", "곡성군", "광양시", "구례군", "나주시", "담양군", "목포시", "무안군", "보성군", "순천시", "신안군", "여수시", "영광군", "영암군", "완도군", "장성군", "장흥군", "진도군", "함평군", "해남군", "화순군"],
        "전북": ["고창군", "군산시", "김제시", "남원시", "무주군", "부안군", "순창군", "완주군", "익산시", "임실군", "장수군", "전주시", "정읍시", "진안군"],
        "부산": ["강서구", "금정구", "기장군", "남구", "동구", "동래구", "부산진구", "북구", "사상구", "사하구", "서구", "수영구", "연제구", "영도구", "중구", "해운대구"],
        "대구": ["남구", "달서구", "달성군", "동구", "북구", "서구", "수성구", "중구"], "울산": ["남구", "동구", "북구", "울주군", "중구"],
        "경남": ["거제시", "거창군", "고성군", "김해시", "남해군", "밀양시", "사천시", "산청군", "양산시", "의령군", "진주시", "창녕군", "창원시", "통영시", "하동군", "함안군", "함양군", "합천군"],
        "경북": ["경산시", "경주시", "고령군", "구미시", "군위군", "김천시", "문경시", "봉화군", "상주시", "성주군", "안동시", "영덕군", "영양군", "영주시", "영천시", "예천군", "울릉군", "울진군", "의성군", "청도군", "청송군", "칠곡군", "포항시"],
        "제주": ["서귀포시", "제주시"]
    };
    const categoryData = ["교육/체험", "국악", "기타", "무용/발레", "뮤지컬/오페라", "아동/가족", "연극", "음악/콘서트", "전시", "행사/축제"];
    
    // -- 데이터 로딩 --
    let eventData = [];
    try {
        const response = await fetch('./freeculture_data.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        eventData = await response.json();
    } catch (error) {
        console.error("이벤트 데이터를 불러오는 데 실패했습니다:", error);
        eventList.innerHTML = '<p style="text-align:center; padding: 40px; color: var(--text-secondary);">문화 행사 정보를 불러오는 데 실패했습니다.<br>로컬 서버를 실행했는지 확인해주세요.</p>';
        return;
    }

    // --- 렌더링 함수 ---
    function renderEvents(events) {
        eventList.innerHTML = '';
        if (events.length === 0) {
            eventList.innerHTML = '<p style="text-align:center; padding: 40px; color: var(--text-secondary);">표시할 행사 정보가 없습니다.</p>';
            return;
        }
        events.forEach((event) => {
            const card = document.createElement('div');
            card.className = 'event-card';
            const priceTag = event.price === '무료' ? `<span style="color: var(--accent-color); font-weight: 500;">무료</span>` : '유료';
            card.innerHTML = `<img src="${event.imgUrl}" alt="${event.title}" class="thumbnail" onerror="this.src='https://placehold.co/600x400/E1E5EA/717171?text=Image+Not+Found'"><div class="event-info"><p class="category-tag">${event.realmName} &bull; ${priceTag}</p><h3>${event.title}</h3><div class="location-info"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg><span>${event.area} ${event.sigungu}</span></div></div>`;
            card.addEventListener('click', () => openModal(event));
            eventList.appendChild(card);
        });
    }

    // --- 필터 로직 ---
    filterButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            const filterType = button.dataset.filter;
            const isActive = button.classList.contains('active');
            closeAllDropdowns();
            if (!isActive) {
                button.classList.add('active');
                openDropdown(filterType, button);
            }
        });
    });

    function closeAllDropdowns() {
        filterButtons.forEach(btn => btn.classList.remove('active'));
        dropdownContainer.innerHTML = '';
        dropdownContainer.style.height = '0px';
    }

    function openDropdown(type, button) {
        let content = '';
        if (type === 'date') {
            renderCalendar();
            return;
        }

        switch (type) {
            case 'region':
                content = createRegionSelector(Object.keys(regionData));
                break;
            case 'price':
                content = createOptionList(['모두', '무료', '유료']);
                break;
            case 'category':
                content = createOptionList(categoryData);
                break;
        }

        const menu = document.createElement('div');
        menu.className = 'dropdown-menu show';
        menu.innerHTML = content;
        dropdownContainer.innerHTML = '';
        dropdownContainer.appendChild(menu);

        if (type === 'region') {
            const sidoCol = menu.querySelector('.sido-col');
            sidoCol.addEventListener('click', (e) => {
                const target = e.target.closest('.region-item');
                if (!target) return;
                const selectedSido = target.dataset.area;
                sidoCol.querySelectorAll('.region-item').forEach(item => item.classList.remove('selected'));
                target.classList.add('selected');
                updateSigunguList(selectedSido, menu);
            });
        }

        dropdownContainer.style.height = `${menu.scrollHeight + 20}px`;
        const filterBar = document.getElementById('filter-bar').querySelector('.filter-scroll-container');
        filterBar.scrollTo({ left: button.offsetLeft - 20, behavior: 'smooth' });
    }

    // --- 캘린더 관련 함수 ---
    function renderCalendar() {
        const year = currentCalendarDate.getFullYear();
        const month = currentCalendarDate.getMonth();
        const calendarHtml = `<div class="dropdown-menu show"><div class="calendar-nav"><button class="calendar-nav-btn" id="prev-month-btn"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg></button><span id="current-year-month">${year}년 ${month + 1}월</span><button class="calendar-nav-btn" id="next-month-btn"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg></button></div><div class="calendar-grid">${generateCalendarGrid(year, month)}</div></div>`;
        dropdownContainer.innerHTML = calendarHtml;

        const menu = dropdownContainer.querySelector('.dropdown-menu');
        dropdownContainer.style.height = `${menu.scrollHeight + 20}px`;

        document.getElementById('prev-month-btn').addEventListener('click', () => { currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1); renderCalendar(); });
        document.getElementById('next-month-btn').addEventListener('click', () => { currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1); renderCalendar(); });
    }

    function generateCalendarGrid(year, month) {
        const today = new Date(); const daysInMonth = new Date(year, month + 1, 0).getDate(); const firstDayIndex = new Date(year, month, 1).getDay(); let gridHtml = '';
        ['일', '월', '화', '수', '목', '금', '토'].forEach(day => gridHtml += `<div class="calendar-header">${day}</div>`);
        for (let i = 0; i < firstDayIndex; i++) gridHtml += `<div class="calendar-day empty"></div>`;
        for (let i = 1; i <= daysInMonth; i++) {
            let className = 'calendar-day';
            if (year === today.getFullYear() && month === today.getMonth() && i === today.getDate()) className += ' today';
            gridHtml += `<div class="${className}">${i}</div>`;
        }
        return gridHtml;
    }

    // --- 지역 필터 관련 함수 ---
    function createRegionSelector(sidoList) {
        let areaHtml = sidoList.map(a => `<div class="region-item" data-area="${a}">${a}</div>`).join('');
        return `<div class="region-selector"><div class="region-col sido-col">${areaHtml}</div><div class="region-col" id="sigungu-col"><div style="text-align:center; color: var(--text-secondary); padding-top: 20px;">시/도를 선택하세요</div></div></div>`;
    }

    function updateSigunguList(sido, menu) {
        const sigunguCol = menu.querySelector('#sigungu-col');
        if (!sigunguCol) return;
        const sigunguList = regionData[sido] || [];
        sigunguCol.innerHTML = sigunguList.length > 0
            ? sigunguList.map(s => `<div class="region-item" data-area="${s}">${s}</div>`).join('')
            : `<div style="text-align:center; color: var(--text-secondary); padding-top: 20px;">시/군/구가 없습니다.</div>`;
    }

    function createOptionList(options) { return `<div class="option-list">${options.map(opt => `<div class="option-item">${opt}</div>`).join('')}</div>`; }
    
    // 화면 바깥 영역 클릭 시 드롭다운 닫기
    document.addEventListener('click', (e) => {
        if (!dropdownContainer.contains(e.target) && !document.getElementById('filter-bar').contains(e.target)) {
            closeAllDropdowns();
        }
    });

    // --- 모달 로직 ---
    function openModal(event) {
        const formatDate = (dateStr) => !dateStr || dateStr.length !== 8 ? "정보 없음" : `${dateStr.substring(0, 4)}.${dateStr.substring(4, 6)}.${dateStr.substring(6, 8)}`;
        modalContent.innerHTML = `<div class="modal-header"><img src="${event.imgUrl}" alt="${event.title}" onerror="this.src='https://placehold.co/700x250/E1E5EA/717171?text=Image+Not+Found'"></div><div class="modal-body"><h2>${event.title}</h2><div class="modal-info-grid"><div class="info-item"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg><div><strong>기간</strong><br><span>${formatDate(event.startDate)} ~ ${formatDate(event.endDate)}</span></div></div><div class="info-item"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg><div><strong>장소</strong><br><span>${event.place} (${event.placeAddr})</span></div></div><div class="info-item"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg><div><strong>가격</strong><br><span>${event.price}</span></div></div><div class="info-item"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg><div><strong>문의</strong><br><span>${event.phone || '정보 없음'}</span></div></div></div><div class="modal-description"><p>${event.contents1 || '상세 정보가 없습니다.'}</p></div></div><div class="modal-footer"><a href="https://map.kakao.com/link/to/${event.place},${event.gpsY},${event.gpsX}" target="_blank" class="action-btn secondary">지도 보기</a><a href="${event.url}" target="_blank" class="action-btn primary">공식 홈페이지</a></div><button class="modal-close-btn">&times;</button>`;
        document.body.classList.add('modal-open');
        modalContainer.classList.remove('hidden');
        modalContainer.querySelector('.modal-close-btn').addEventListener('click', closeModal);
        modalBackdrop.addEventListener('click', closeModal);
    }

    function closeModal() {
        document.body.classList.remove('modal-open');
        modalContainer.classList.add('hidden');
    }

    // --- 초기 실행 ---
    // 데이터 로딩이 끝난 후, 초기 이벤트 목록을 렌더링합니다.
    renderEvents(eventData);
});

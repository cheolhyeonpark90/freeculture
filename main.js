import { regionData, categoryData, ITEMS_PER_LOAD } from './config.js';
import { appendEvents, resetEventList, openModal, createRegionSelector, updateSigunguList, createOptionList, renderCalendar } from './ui.js';

// --- 유틸리티 함수 ---
function getTodayString() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
}

document.addEventListener('DOMContentLoaded', async () => {
    // --- DOM 요소 및 상태 변수 초기화 ---
    const filterButtons = document.querySelectorAll('.filter-btn');
    const resetFiltersBtn = document.getElementById('reset-filters-btn');
    const initialLoader = document.getElementById('initial-loader');
    const dropdownContainer = document.getElementById('dropdown-container');
    
    let allEvents = [];
    let currentEvents = [];
    let renderedCount = 0;
    let isLoading = false;
    let observer;

    let calendarDisplayDate = new Date();

    const initialFilters = {
        sido: null, sigungu: null, price: null, category: null, date: getTodayString(),
    };
    
    let activeFilters = { ...initialFilters };

    // --- 데이터 로딩 및 초기화 ---
    try {
        const response = await fetch('./freeculture_data.json');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        allEvents = await response.json();
        initialize();
    } catch (error) {
        console.error("이벤트 데이터를 불러오는 데 실패했습니다:", error);
        document.getElementById('event-list').innerHTML = '<p style="text-align:center; padding: 40px; color: var(--text-secondary);">문화 행사 정보를 불러오지 못했습니다.<br>로컬 서버를 실행했는지 확인해주세요.</p>';
    } finally {
        initialLoader.style.opacity = '0';
        setTimeout(() => initialLoader.remove(), 300);
    }

    function initialize() {
        updateAllFilterButtons();
        applyAndRenderFilters();
    }

    // --- 렌더링 및 필터링 핵심 함수 ---
    function applyAndRenderFilters() {
        currentEvents = allEvents.filter(event => {
            const sidoMatch = !activeFilters.sido || event.area === activeFilters.sido;
            const sigunguMatch = !activeFilters.sigungu || event.sigungu === activeFilters.sigungu;
            
            let priceMatch = true;
            if (activeFilters.price) {
                priceMatch = activeFilters.price === '무료' ? event.price.includes('무료') : !event.price.includes('무료');
            }

            const categoryMatch = !activeFilters.category || event.realmName === activeFilters.category;
            
            const dateMatch = !activeFilters.date || 
                (Number(event.startDate) <= Number(activeFilters.date) && 
                 Number(event.endDate) >= Number(activeFilters.date));

            return sidoMatch && sigunguMatch && priceMatch && categoryMatch && dateMatch;
        });
        resetEventList();
        renderedCount = 0;
        loadMoreEvents();
        setupIntersectionObserver();
    }
    
    function loadMoreEvents() {
        if (isLoading) return;
        isLoading = true;
        const loader = document.getElementById('loader');
        if(loader) loader.style.display = 'block';

        setTimeout(() => {
            const eventsToRender = currentEvents.slice(renderedCount, renderedCount + ITEMS_PER_LOAD);
            appendEvents(eventsToRender, openModal);
            renderedCount += eventsToRender.length;
            if(loader) loader.style.display = 'none';
            isLoading = false;
        }, 300);
    }
    
    function setupIntersectionObserver() {
        if (observer) observer.disconnect();
        const oldSentinel = document.getElementById('sentinel');
        if (oldSentinel) oldSentinel.remove();
        if (renderedCount >= currentEvents.length) return;

        const sentinel = document.createElement('div');
        sentinel.id = 'sentinel';
        const loader = document.createElement('div');
        loader.id = 'loader';
        loader.innerHTML = `<div class="spinner"></div>`;
        sentinel.appendChild(loader);
        document.getElementById('app-container').appendChild(sentinel);

        observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && !isLoading) {
                loadMoreEvents();
            }
        }, { threshold: 1.0 });
        observer.observe(sentinel);
    }
    
    // --- 필터 및 드롭다운 로직 ---
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
    
    resetFiltersBtn.addEventListener('click', () => {
        activeFilters = { ...initialFilters };
        calendarDisplayDate = new Date();
        updateAllFilterButtons();
        applyAndRenderFilters();
        closeAllDropdowns();
    });

    function closeAllDropdowns() {
        filterButtons.forEach(btn => btn.classList.remove('active'));
        dropdownContainer.innerHTML = '';
        dropdownContainer.style.height = '0px';
    }

    function openDropdown(type, button) {
        let content = '';
        if (type === 'date') {
            content = renderCalendar(calendarDisplayDate, activeFilters.date);
        } else {
            switch (type) {
                case 'region': content = createRegionSelector(Object.keys(regionData)); break;
                case 'price': content = createOptionList(['모두', '무료', '유료']); break;
                case 'category': content = createOptionList(["모든 카테고리", ...categoryData]); break;
            }
        }
        
        const menu = document.createElement('div');
        menu.className = 'dropdown-menu show';
        menu.innerHTML = content;
        dropdownContainer.appendChild(menu);
        
        const eventHandler = (type === 'date') ? handleCalendarClick : handleFilterSelection;
        menu.addEventListener('click', (e) => eventHandler(e, type, button));
        
        dropdownContainer.style.height = `${menu.scrollHeight + 20}px`;
        const filterBar = document.getElementById('filter-bar').querySelector('.filter-scroll-container');
        filterBar.scrollTo({ left: button.offsetLeft - 20, behavior: 'smooth' });
    }

    function handleCalendarClick(e, type, filterButton) {
        const target = e.target.closest('button');
        if (!target) return;

        const action = target.dataset.action;
        const dateStr = target.dataset.date;

        if (['prev-year', 'next-year', 'prev-month', 'next-month'].includes(action)) {
            e.stopPropagation();
            if (action === 'prev-month') calendarDisplayDate.setMonth(calendarDisplayDate.getMonth() - 1);
            if (action === 'next-month') calendarDisplayDate.setMonth(calendarDisplayDate.getMonth() + 1);
            if (action === 'prev-year') calendarDisplayDate.setFullYear(calendarDisplayDate.getFullYear() - 1);
            if (action === 'next-year') calendarDisplayDate.setFullYear(calendarDisplayDate.getFullYear() + 1);
            
            const newContent = renderCalendar(calendarDisplayDate, activeFilters.date);
            dropdownContainer.querySelector('.dropdown-menu').innerHTML = newContent;
            return;
        }

        if (action === 'select-today') {
            activeFilters.date = getTodayString();
        } else if (action === 'deselect-date') {
            activeFilters.date = null;
        } else if (dateStr) {
            activeFilters.date = dateStr;
        }
        
        updateAllFilterButtons();
        applyAndRenderFilters();
        closeAllDropdowns();
    }

    // [수정] 지역 필터 로직 개선
    function handleFilterSelection(e, type, button) {
        const target = e.target.closest('.region-item, .option-item');
        if (!target) return;

        // Case 1: 시/도(Sido) 선택
        if (type === 'region' && target.parentElement.classList.contains('sido-col')) {
            const selectedSido = target.dataset.value;
            
            if (selectedSido === '전체') {
                activeFilters.sido = null;
                activeFilters.sigungu = null;
                updateAllFilterButtons();
                applyAndRenderFilters();
                closeAllDropdowns();
            } else {
                e.stopPropagation(); // 드롭다운이 닫히지 않도록 이벤트 전파 중단
                activeFilters.sido = selectedSido;
                activeFilters.sigungu = null;
                target.parentElement.querySelectorAll('.region-item').forEach(item => item.classList.remove('selected'));
                target.classList.add('selected');
                updateSigunguList(selectedSido, target.closest('.dropdown-menu'));
                updateAllFilterButtons(); // 버튼 텍스트만 업데이트
            }
            return;
        }

        // Case 2: 시/군/구, 가격, 카테고리 등 최종 선택
        if (type === 'region') { // 시/군/구 선택
            const selectedSigungu = target.dataset.value;
            activeFilters.sigungu = selectedSigungu === '전체' ? null : selectedSigungu;
        } else if (type === 'price') { // 가격 선택
            activeFilters.price = target.dataset.value === '모두' ? null : target.dataset.value;
        } else if (type === 'category') { // 카테고리 선택
            activeFilters.category = target.dataset.value === '모든 카테고리' ? null : target.dataset.value;
        }
        
        updateAllFilterButtons();
        applyAndRenderFilters();
        closeAllDropdowns();
    }
    
    // 모든 필터 버튼의 텍스트를 중앙에서 관리하여 업데이트
    function updateAllFilterButtons() {
        filterButtons.forEach(button => {
            const type = button.dataset.filter;
            const span = button.querySelector('span');
            let value = '';

            switch (type) {
                case 'date':
                    if (activeFilters.date === getTodayString()) { value = '오늘'; } 
                    else if (activeFilters.date) { value = `${activeFilters.date.substring(4, 6)}.${activeFilters.date.substring(6, 8)}`; }
                    break;
                case 'region':
                    if (activeFilters.sido && activeFilters.sigungu) { value = `${activeFilters.sido} ${activeFilters.sigungu}`; } 
                    else if (activeFilters.sido) { value = activeFilters.sido; }
                    break;
                case 'price':
                    value = activeFilters.price;
                    break;
                case 'category':
                    value = activeFilters.category;
                    break;
            }
            const defaultText = { region: '지역', price: '가격', category: '카테고리', date: '날짜' }[type];
            span.textContent = value || defaultText;
        });
    }

    document.addEventListener('click', (e) => { 
        if (dropdownContainer.innerHTML !== '' && !dropdownContainer.contains(e.target) && !e.target.closest('.filter-btn')) {
            closeAllDropdowns();
        }
    });
});

import { regionData, categoryData, ITEMS_PER_LOAD } from './config.js';
import { appendEvents, resetEventList, openModal, createRegionSelector, updateSigunguList, createOptionList } from './ui.js';

document.addEventListener('DOMContentLoaded', async () => {
    // --- DOM 요소 및 상태 변수 초기화 ---
    const filterButtons = document.querySelectorAll('.filter-btn');
    const dropdownContainer = document.getElementById('dropdown-container');
    
    let allEvents = [];
    let currentEvents = [];
    let renderedCount = 0;
    let isLoading = false;
    let observer;

    const activeFilters = {
        sido: null, sigungu: null, price: null, category: null, date: null,
    };

    // --- 데이터 로딩 ---
    try {
        const response = await fetch('./freeculture_data.json');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        allEvents = await response.json();
        applyAndRenderFilters();
    } catch (error) {
        console.error("이벤트 데이터를 불러오는 데 실패했습니다:", error);
        document.getElementById('event-list').innerHTML = '<p style="text-align:center; padding: 40px; color: var(--text-secondary);">문화 행사 정보를 불러오지 못했습니다.<br>로컬 서버를 실행했는지 확인해주세요.</p>';
    }

    // --- 렌더링 및 필터링 핵심 함수 ---
    function applyAndRenderFilters() {
        currentEvents = allEvents.filter(event => {
            const sidoMatch = !activeFilters.sido || event.area === activeFilters.sido;
            const sigunguMatch = !activeFilters.sigungu || event.sigungu === activeFilters.sigungu;
            const priceMatch = !activeFilters.price || event.price === activeFilters.price;
            const categoryMatch = !activeFilters.category || event.realmName === activeFilters.category;
            return sidoMatch && sigunguMatch && priceMatch && categoryMatch;
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
    
    // --- 무한 스크롤 설정 ---
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

    function closeAllDropdowns() {
        filterButtons.forEach(btn => btn.classList.remove('active'));
        dropdownContainer.innerHTML = '';
        dropdownContainer.style.height = '0px';
    }

    function openDropdown(type, button) {
        let content = '';
        if (type === 'date') { /* renderCalendar(); */ return; } // 캘린더 기능은 일단 보류
        switch (type) {
            case 'region': content = createRegionSelector(Object.keys(regionData)); break;
            case 'price': content = createOptionList(['모두', '무료', '유료']); break;
            case 'category': content = createOptionList(["모든 카테고리", ...categoryData]); break;
        }
        const menu = document.createElement('div');
        menu.className = 'dropdown-menu show';
        menu.innerHTML = content;
        dropdownContainer.appendChild(menu);
        menu.addEventListener('click', (e) => handleFilterSelection(e, type, button));
        dropdownContainer.style.height = `${menu.scrollHeight + 20}px`;
        const filterBar = document.getElementById('filter-bar').querySelector('.filter-scroll-container');
        filterBar.scrollTo({ left: button.offsetLeft - 20, behavior: 'smooth' });
    }

    function handleFilterSelection(e, type, button) {
        const target = e.target.closest('.region-item, .option-item');
        if (!target) return;
        if (type === 'region') {
            if (target.parentElement.classList.contains('sido-col')) {
                const selectedSido = target.dataset.value;
                activeFilters.sido = selectedSido === '전체' ? null : selectedSido;
                activeFilters.sigungu = null;
                target.parentElement.querySelectorAll('.region-item').forEach(item => item.classList.remove('selected'));
                target.classList.add('selected');
                updateSigunguList(selectedSido, target.closest('.dropdown-menu'));
                updateFilterButtonText(button, '지역', activeFilters.sido);
                if (activeFilters.sido === null) { applyAndRenderFilters(); closeAllDropdowns(); }
            } else {
                activeFilters.sigungu = target.dataset.value;
                updateFilterButtonText(button, '지역', `${activeFilters.sido} ${activeFilters.sigungu}`);
                closeAllDropdowns();
                applyAndRenderFilters();
            }
        } else {
            const value = target.dataset.value;
            if (type === 'price') activeFilters.price = (value === '모두' || !value) ? null : value;
            if (type === 'category') activeFilters.category = (value === '모든 카테고리' || !value) ? null : value;
            updateFilterButtonText(button, type, value);
            closeAllDropdowns();
            applyAndRenderFilters();
        }
    }
    
    function updateFilterButtonText(button, type, value) {
        const span = button.querySelector('span');
        const defaultText = { region: '지역', price: '가격', category: '카테고리' }[type];
        span.textContent = (!value || value === '모두' || value === '모든 카테고리' || value === '전체') ? defaultText : value;
    }

    document.addEventListener('click', (e) => { if (!dropdownContainer.contains(e.target) && !document.getElementById('filter-bar').contains(e.target)) closeAllDropdowns(); });
});

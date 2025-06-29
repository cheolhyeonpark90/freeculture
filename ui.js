import { regionData } from './config.js';

// --- DOM 요소 ---
const eventList = document.getElementById('event-list');
const dropdownContainer = document.getElementById('dropdown-container');
const modalContainer = document.getElementById('modal-container');
const modalContent = document.querySelector('.modal-content');
const modalBackdrop = document.querySelector('.modal-backdrop');

// --- UI 렌더링 함수 ---
export function appendEvents(eventsToRender, openModalCallback) {
    const fragment = document.createDocumentFragment();

    if (eventList.children.length === 0 && eventsToRender.length === 0) {
        eventList.innerHTML = '<p style="text-align:center; padding: 40px; color: var(--text-secondary);">선택한 조건에 맞는 행사 정보가 없습니다.</p>';
        return;
    }
    
    eventsToRender.forEach((event) => {
        const card = document.createElement('div');
        card.className = 'event-card';
        const priceTag = event.price === '무료' ? `<span style="color: var(--accent-color); font-weight: 500;">무료</span>` : '유료';
        const secureImgUrl = event.imgUrl.replace('http://', 'https://');
        card.innerHTML = `<img src="${secureImgUrl}" alt="${event.title}" class="thumbnail" onerror="this.src='https://placehold.co/600x400/E1E5EA/717171?text=Image+Not+Found'"><div class="event-info"><p class="category-tag">${event.realmName} &bull; ${priceTag}</p><h3>${event.title}</h3><div class="location-info"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg><span>${event.area} ${event.sigungu}</span></div></div>`;
        card.addEventListener('click', () => openModalCallback(event));
        fragment.appendChild(card);
    });

    eventList.appendChild(fragment);
}

export function resetEventList() {
    eventList.innerHTML = '';
}

export function openModal(event) {
    const formatDate = (dateStr) => !dateStr || dateStr.length !== 8 ? "정보 없음" : `${dateStr.substring(0, 4)}.${dateStr.substring(4, 6)}.${dateStr.substring(6, 8)}`;
    const secureImgUrl = event.imgUrl.replace('http://', 'https://');
    
    const websiteUrl = event.url || event.placeUrl;
    const websiteButtonHtml = websiteUrl 
        ? `<a href="${websiteUrl}" target="_blank" class="action-btn primary">공식 홈페이지</a>`
        : '';
        
    const hasGpsData = event.gpsX && event.gpsY;
    const mapButtonHtml = hasGpsData
        ? `<a href="https://map.kakao.com/link/to/${event.place},${event.gpsY},${event.gpsX}" target="_blank" class="action-btn secondary">지도 보기</a>`
        : '';

    modalContent.innerHTML = `
        <div class="modal-header">
            <img src="${secureImgUrl}" alt="${event.title}" onerror="this.src='https://placehold.co/700x250/E1E5EA/717171?text=Image+Not+Found'">
        </div>
        <div class="modal-body">
            <h2>${event.title}</h2>
            <div class="modal-info-grid">
                <div class="info-item">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                    <div><strong>기간</strong><br><span>${formatDate(event.startDate)} ~ ${formatDate(event.endDate)}</span></div>
                </div>
                <div class="info-item">
                     <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                    <div><strong>장소</strong><br><span>${event.place} (${event.placeAddr})</span></div>
                </div>
                 <div class="info-item">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                    <div><strong>가격</strong><br><span>${event.price}</span></div>
                </div>
                 <div class="info-item">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                    <div><strong>문의</strong><br><span>${event.phone || '정보 없음'}</span></div>
                </div>
            </div>
            <div class="modal-description">
                <p>${event.contents1 || '상세 정보가 없습니다.'}</p>
            </div>
        </div>
        <div class="modal-footer">
            ${mapButtonHtml}
            ${websiteButtonHtml}
        </div>
        <button class="modal-close-btn">&times;</button>
    `;
    document.body.classList.add('modal-open');
    modalContainer.classList.remove('hidden');
    modalContainer.querySelector('.modal-close-btn').addEventListener('click', closeModal);
    modalBackdrop.addEventListener('click', closeModal);
}

export function closeModal() {
    document.body.classList.remove('modal-open');
    modalContainer.classList.add('hidden');
}

export function createRegionSelector(sidoList) {
    let areaHtml = [`<div class="region-item" data-value="전체">전체</div>`, ...sidoList.map(a => `<div class="region-item" data-value="${a}">${a}</div>`)].join('');
    return `<div class="region-selector"><div class="region-col sido-col">${areaHtml}</div><div class="region-col" id="sigungu-col"><div style="text-align:center; color: var(--text-secondary); padding-top: 20px;">시/도를 선택하세요</div></div></div>`;
}

export function updateSigunguList(sido, menu) {
    const sigunguCol = menu.querySelector('#sigungu-col'); 
    if (!sigunguCol) return;
    const sigunguList = regionData[sido] || [];
    
    // [수정] 시/군/구 목록에 '전체' 옵션을 추가합니다.
    let sigunguHtml = '';
    if (sigunguList.length > 0) {
        sigunguHtml = [`<div class="region-item" data-value="전체">전체</div>`, ...sigunguList.map(s => `<div class="region-item" data-value="${s}">${s}</div>`)].join('');
    } else {
        sigunguHtml = `<div style="text-align:center; color: var(--text-secondary); padding-top: 20px;"></div>`; // 데이터 없으면 빈칸
    }
    sigunguCol.innerHTML = sigunguHtml;
}

export function createOptionList(options) {
    return `<div class="option-list">${options.map(opt => `<div class="option-item" data-value="${opt}">${opt}</div>`).join('')}</div>`;
}

const colors = ['#DAF7A6', '#DAA520', '#FFE4E1', '#B0C4DE', '#DA70D6'];
let eventsData = [];

// Функція для отримання часу в Україні (UTC+2 взимку, UTC+3 влітку)
function getUkraineTime() {
    const now = new Date();
    const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
    const year = now.getFullYear();
    const dstStart = new Date(Date.UTC(year, 2, 31 - ((5 + new Date(year, 2, 31).getDay()) % 7), 1, 0, 0));
    const dstEnd = new Date(Date.UTC(year, 9, 31 - ((5 + new Date(year, 9, 31).getDay()) % 7), 1, 0, 0));
    const ukraineOffset = (now >= dstStart && now < dstEnd ? 3 : 2) * 60 * 60 * 1000;
    return new Date(utcTime + ukraineOffset);
}

function getTimeUntilStart(startTime, endTime) {
    const now = getUkraineTime();
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    if (now >= start && now <= end) {
        // Подія активна, показуємо тривалість
        const duration = now - start;
        const hours = Math.floor(duration / (1000 * 60 * 60));
        const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
        return `Триває: ${hours}г ${minutes}хв`;
    } else if (start > now) {
        // Подія ще не почалася, показуємо час до початку
        const diff = start - now;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        return `До початку: ${hours}г ${minutes}хв`;
    } else {
        // Подія закінчилася
        return 'Подія закінчилася';
    }
}

function formatDate(date) {
    return new Date(date).toLocaleString('uk-UA', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Europe/Kyiv'
    });
}

function formatBrawlerStats(stats) {
    if (!stats || stats.length === 0) return 'Немає даних по winRate';

    const leftColumnStats = stats.slice(0, 5);
    const rightColumnStats = stats.slice(5, 10);

    const leftColumnHTML = leftColumnStats.map(stat => `
        <div class="stat-row">
            <div class="stat-brawler-img-container">
                <img src="https://cdn.brawlify.com/brawlers/borderless/${stat.brawler}.png" 
                     class="stat-brawler-img" 
                     alt="${stat.brawler}"
                     onerror="this.src='https://cdn.brawlify.com/brawlers/borderless/16000000.png'">
            </div>
            <span class="stat-winrate">${Math.round(stat.winRate)}%</span>
        </div>
    `).join('');

    const rightColumnHTML = rightColumnStats.map(stat => `
        <div class="stat-row">
            <div class="stat-brawler-img-container">
                <img src="https://cdn.brawlify.com/brawlers/borderless/${stat.brawler}.png" 
                     class="stat-brawler-img" 
                     alt="${stat.brawler}"
                     onerror="this.src='https://cdn.brawlify.com/brawlers/borderless/16000000.png'">
            </div>
            <span class="stat-winrate">${Math.round(stat.winRate)}%</span>
        </div>
    `).join('');

    return `
        <div class="stats-column">${leftColumnHTML}</div>
        <div class="stats-column">${rightColumnHTML}</div>
    `;
}

function updateEventDisplay(event, color, isCurrent = false) {
    document.getElementById('gameModeName').textContent = event.map.gameMode.name;
    document.getElementById('mapName').textContent = event.map.name;
    document.getElementById('mapThumbnail').src = `https://cdn.brawlify.com/maps/regular/${event.map.id}.png`;
    document.getElementById('brawlerStats').innerHTML = formatBrawlerStats(event.map.stats);
    document.getElementById('timeUntilStart').textContent = getTimeUntilStart(event.startTime, event.endTime);
    document.getElementById('eventDate').textContent = formatDate(event.startTime);
    document.getElementById('gameModeBanner').src = `https://cdn-misc.brawlify.com/gamemode/header/${event.map.gameMode.hash}.png`;
    document.querySelector('.event-card').style.border = `5px solid ${color}`;
    document.getElementById('eventStatus').textContent = isCurrent ? 'Поточна подія' : 'Наступна подія';
}

async function fetchEvents() {
    try {
        const response = await axios.get('https://api.brawlify.com/v1/events');
        const data = response.data;

        console.log('Повні дані з API:', JSON.stringify(data, null, 2));
        console.log('Ключі в data:', Object.keys(data));

        const now = getUkraineTime();
        console.log('Поточний час в Україні:', now.toLocaleString('uk-UA', { timeZone: 'Europe/Kyiv' }));

        const upcomingEvents = data.upcoming || [];
        const activeEvents = data.active || [];

        if (!Array.isArray(upcomingEvents) && !Array.isArray(activeEvents)) {
            console.log('Немає подій у upcoming або active або дані не є масивами');
            return { upcoming: [], active: [] };
        }

        const filteredUpcomingEvents = upcomingEvents.filter(event => {
            const start = new Date(event.startTime);
            const isUpcoming = start > now;
            console.log(`Подія: ${event.map.gameMode.name} - ${event.map.name}, Start: ${start.toISOString()}, Now: ${now.toISOString()}, Майбутня: ${isUpcoming}`);
            return isUpcoming;
        });

        const filteredActiveEvents = activeEvents.filter(event => {
            const start = new Date(event.startTime);
            const end = new Date(event.endTime);
            const isActive = now >= start && now <= end;
            console.log(`Подія: ${event.map.gameMode.name} - ${event.map.name}, Start: ${start.toISOString()}, End: ${end.toISOString()}, Активна: ${isActive}`);
            return isActive;
        });

        console.log('Фільтровані майбутні події:', JSON.stringify(filteredUpcomingEvents, null, 2));
        console.log('Фільтровані активні події:', JSON.stringify(filteredActiveEvents, null, 2));
        return { upcoming: filteredUpcomingEvents, active: filteredActiveEvents };
    } catch (error) {
        console.error('Помилка завантаження подій:', error.message);
        if (error.response) {
            console.error('Статус помилки:', error.response.status);
            console.error('Дані помилки:', error.response.data);
        } else if (error.request) {
            console.error('Немає відповіді від сервера. Деталі запиту:', error.request);
        } else {
            console.error('Помилка конфігурації:', error.message);
        }
        return { upcoming: [], active: [] };
    }
}

function updateEventSelect(selectList, events, isCurrent = false) {
    console.log(`Оновлюємо select з подіями (${isCurrent ? 'поточні' : 'майбутні'}):`, events.length);
    console.log(`Події, передані в select (${isCurrent ? 'поточні' : 'майбутні'}):`, JSON.stringify(events, null, 2));
    let optionsHTML = '';
    
    if (events.length === 0) {
        optionsHTML = `<li data-value="">Немає ${isCurrent ? 'поточних' : 'майбутніх'} подій</li>`;
    } else {
        optionsHTML = events.map((event, index) => {
            const gameModeId = event.map.gameMode?.scId || '';
            const iconUrl = gameModeId ? `https://cdn.brawlify.com/game-modes/regular/${gameModeId}.png` : 'https://i.ibb.co/TxLbWLnS/3094.png';
            return `
                <li data-value="${isCurrent ? 'current' : 'upcoming'}_${index}">
                    <img src="${iconUrl}" alt="${event.map.gameMode.name} icon" onerror="this.src='https://i.ibb.co/TxLbWLnS/3094.png'">
                    ${event.map.gameMode.name} - ${event.map.name}
                </li>
            `;
        }).join('');
    }
    
    selectList.innerHTML = optionsHTML;
    console.log(`Згенерований HTML для select (${isCurrent ? 'поточні' : 'майбутні'}):`, optionsHTML);
}

async function loadEvents() {
    const selectList = document.getElementById('eventSelectList');
    const selectSelected = document.querySelector('.select-selected');
    const toggleButton = document.createElement('button');
    toggleButton.id = 'toggleEvents';
    toggleButton.textContent = 'Показати поточні';
    toggleButton.className = 'toggle-button';
    document.querySelector('.custom-select').appendChild(toggleButton);

    let isShowingCurrent = false;

    const updateDisplay = (events, isCurrent) => {
        if (events.length === 0) {
            updateEventSelect(selectList, events, isCurrent);
            document.getElementById('gameModeName').textContent = `Немає ${isCurrent ? 'поточних' : 'майбутніх'} подій`;
            document.getElementById('mapName').textContent = '';
            document.getElementById('mapThumbnail').src = '';
            document.getElementById('brawlerStats').innerHTML = '';
            document.getElementById('timeUntilStart').textContent = `Очікуємо нові ${isCurrent ? 'поточні' : 'майбутні'} події`;
            document.getElementById('eventDate').textContent = '';
            document.getElementById('gameModeBanner').src = '';
            document.querySelector('.event-card').style.border = `5px solid #ccc`;
            selectSelected.textContent = `Немає ${isCurrent ? 'поточних' : 'майбутніх'} подій`;
            document.getElementById('eventStatus').textContent = isCurrent ? 'Поточна подія' : 'Наступна подія';
        } else {
            updateEventSelect(selectList, events, isCurrent);
            const initialColor = colors[Math.floor(Math.random() * colors.length)];
            updateEventDisplay(events[0], initialColor, isCurrent);
            const gameModeId = events[0].map.gameMode?.scId || '';
            const iconUrl = gameModeId ? `https://cdn.brawlify.com/game-modes/regular/${gameModeId}.png` : 'https://i.ibb.co/TxLbWLnS/3094.png';
            selectSelected.innerHTML = `
                <div class="icon-container">
                    <img src="${iconUrl}" alt="${events[0].map.gameMode.name} icon" onerror="this.src='https://i.ibb.co/TxLbWLnS/3094.png'">
                </div>
                ${events[0].map.gameMode.name} - ${events[0].map.name}
                <svg class="w-2.5 h-2.5 ms-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 1 4 4 4-4"/>
                </svg>
            `;
        }
        toggleButton.textContent = isCurrent ? 'Показати наступні' : 'Показати поточні';
    };

    eventsData = await fetchEvents();
    console.log('Завантажено подій у eventsData:', eventsData.upcoming.length, 'майбутніх,', eventsData.active.length, 'активних');

    updateDisplay(eventsData.upcoming, false);

    // Toggle dropdown visibility
    selectSelected.addEventListener('click', () => {
        selectList.style.display = selectList.style.display === 'none' ? 'block' : 'none';
    });

    // Handle option selection
    selectList.addEventListener('click', (e) => {
        const li = e.target.closest('li');
        if (!li) return;
        const selectedValue = li.getAttribute('data-value');
        if (selectedValue === '') return;

        const [eventType, selectedIndex] = selectedValue.split('_');
        const events = eventType === 'current' ? eventsData.active : eventsData.upcoming;
        const selectedEvent = events[parseInt(selectedIndex)];
        const gameModeId = selectedEvent.map.gameMode?.scId || '';
        const iconUrl = gameModeId ? `https://cdn.brawlify.com/game-modes/regular/${gameModeId}.png` : 'https://i.ibb.co/TxLbWLnS/3094.png';
        selectSelected.innerHTML = `
            <div class="icon-container">
                <img src="${iconUrl}" alt="${selectedEvent.map.gameMode.name} icon" onerror="this.src='https://i.ibb.co/TxLbWLnS/3094.png'">
            </div>
            ${selectedEvent.map.gameMode.name} - ${selectedEvent.map.name}
            <svg class="w-2.5 h-2.5 ms-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 1 4 4 4-4"/>
            </svg>
        `;
        selectList.style.display = 'none';

        const color = colors[Math.floor(Math.random() * colors.length)];
        updateEventDisplay(selectedEvent, color, eventType === 'current');

        if (selectedIndex !== '0' || eventType !== 'upcoming') {
            setTimeout(() => {
                const events = isShowingCurrent ? eventsData.active : eventsData.upcoming;
                if (events.length > 0) {
                    const gameModeId = events[0].map.gameMode?.scId || '';
                    const iconUrl = gameModeId ? `https://cdn.brawlify.com/game-modes/regular/${gameModeId}.png` : 'https://i.ibb.co/TxLbWLnS/3094.png';
                    selectSelected.innerHTML = `
                        <div class="icon-container">
                            <img src="${iconUrl}" alt="${events[0].map.gameMode.name} icon" onerror="this.src='https://i.ibb.co/TxLbWLnS/3094.png'">
                        </div>
                        ${events[0].map.gameMode.name} - ${events[0].map.name}
                        <svg class="w-2.5 h-2.5 ms-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 1 4 4 4-4"/>
                        </svg>
                    `;
                    const resetColor = colors[Math.floor(Math.random() * colors.length)];
                    updateEventDisplay(events[0], resetColor, isShowingCurrent);
                }
            }, 60000);
        }
    });

    // Handle toggle button
    toggleButton.addEventListener('click', async () => {
        isShowingCurrent = !isShowingCurrent;
        eventsData = await fetchEvents();
        updateDisplay(isShowingCurrent ? eventsData.active : eventsData.upcoming, isShowingCurrent);
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.custom-select')) {
            selectList.style.display = 'none';
        }
    });

    setInterval(async () => {
        const previousEventsCount = eventsData.upcoming.length + eventsData.active.length;
        eventsData = await fetchEvents();
        console.log('Оновлено подій у eventsData:', eventsData.upcoming.length, 'майбутніх,', eventsData.active.length, 'активних');

        const events = isShowingCurrent ? eventsData.active : eventsData.upcoming;
        updateDisplay(events, isShowingCurrent);

        if (previousEventsCount !== (eventsData.upcoming.length + eventsData.active.length)) {
            console.log(`Кількість подій змінилася: було ${previousEventsCount}, стало ${eventsData.upcoming.length + eventsData.active.length}`);
        }
    }, 60000);
}

document.addEventListener('DOMContentLoaded', loadEvents);

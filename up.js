// up.js
let eventsData = [];

// Функція для отримання поточного часу в Україні
function getUkraineTime() {
    return moment().tz('Europe/Kyiv');
}

// Функція для обчислення часу до початку події
function getTimeUntilStart(startTime) {
    const now = getUkraineTime();
    const start = moment(startTime).tz('Europe/Kyiv');
    const diff = start.diff(now);
    const duration = moment.duration(diff);
    const hours = Math.floor(duration.asHours());
    const minutes = Math.floor(duration.asMinutes()) % 60;
    return `${hours}h ${minutes}min`;
}

// Функція для форматування дати
function formatDate(date) {
    return moment(date).tz('Europe/Kyiv').format('DD.MM.YYYY HH:mm');
}

// Функція для форматування статистики бравлерів
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

// Функція для оновлення відображення події
function updateEventDisplay(event) {
    document.getElementById('gameModeName').textContent = event.map.gameMode.name;
    document.getElementById('mapName').textContent = event.map.name;
    document.getElementById('mapThumbnail').src = `https://cdn.brawlify.com/maps/regular/${event.map.id}.png`;
    document.getElementById('brawlerStats').innerHTML = formatBrawlerStats(event.map.stats);
    document.getElementById('timeUntilStart').textContent = getTimeUntilStart(event.startTime);
    document.getElementById('eventDate').textContent = formatDate(event.startTime);
    document.getElementById('gameModeBanner').src = `https://cdn-misc.brawlify.com/gamemode/header/${event.map.gameMode.hash}.png`;
}

// Функція для отримання подій з API
async function fetchEvents() {
    try {
        const response = await axios.get('https://api.brawlify.com/v1/events');
        const data = response.data;

        console.log('Повні дані з API:', JSON.stringify(data, null, 2));
        console.log('Ключі в data:', Object.keys(data));

        const now = getUkraineTime();
        console.log('Поточний час в Україні:', now.format('DD.MM.YYYY HH:mm:ss'));

        const upcomingEvents = data.upcoming || [];

        if (!Array.isArray(upcomingEvents) || upcomingEvents.length === 0) {
            console.log('Немає майбутніх подій у upcoming або дані не є масивом');
            return [];
        }

        const filteredUpcomingEvents = upcomingEvents.filter(event => {
            const start = moment(event.startTime).tz('Europe/Kyiv');
            const isUpcoming = start.isAfter(now);
            console.log(`Подія: ${event.map.gameMode.name} - ${event.map.name}, Start: ${start.format()}, Now: ${now.format()}, Майбутня: ${isUpcoming}`);
            return isUpcoming;
        });

        console.log('Фільтровані майбутні події:', JSON.stringify(filteredUpcomingEvents, null, 2));
        return filteredUpcomingEvents;
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
        return [];
    }
}

// Функція для оновлення випадаючого списку подій
function updateEventSelect(selectList, events) {
    console.log('Оновлюємо select з подіями:', events.length);
    console.log('Події, передані в select:', JSON.stringify(events, null, 2));
    let optionsHTML = '';
    
    if (events.length === 0) {
        optionsHTML = '<li data-value="">Немає майбутніх подій</li>';
    } else {
        optionsHTML = events.map((event, index) => {
            const gameModeId = event.map.gameMode?.scId || '';
            const iconUrl = gameModeId ? `https://cdn.brawlify.com/game-modes/regular/${gameModeId}.png` : 'https://i.ibb.co/TxLbWLnS/3094.png';
            return `
                <li data-value="${index}">
                    <img src="${iconUrl}" alt="${event.map.gameMode.name} icon" onerror="this.src='https://i.ibb.co/TxLbWLnS/3094.png'">
                    ${event.map.gameMode.name} - ${event.map.name}
                </li>
            `;
        }).join('');
    }
    
    selectList.innerHTML = optionsHTML;
    console.log('Згенерований HTML для select:', optionsHTML);
}

// Функція для завантаження подій
async function loadEvents() {
    const selectList = document.getElementById('eventSelectList');
    const selectSelected = document.querySelector('.select-selected');

    eventsData = await fetchEvents();
    console.log('Завантажено подій у eventsData:', eventsData.length);

    if (eventsData.length === 0) {
        updateEventSelect(selectList, eventsData);
        document.getElementById('gameModeName').textContent = 'Немає майбутніх подій';
        document.getElementById('mapName').textContent = '';
        document.getElementById('mapThumbnail').src = '';
        document.getElementById('brawlerStats').innerHTML = '';
        document.getElementById('timeUntilStart').textContent = 'Очікуємо нові події';
        document.getElementById('eventDate').textContent = '';
        document.getElementById('gameModeBanner').src = '';
        selectSelected.textContent = 'Немає майбутніх подій';
    } else {
        updateEventSelect(selectList, eventsData);
        updateEventDisplay(eventsData[0]);
        const gameModeId = eventsData[0].map.gameMode?.scId || '';
        const iconUrl = gameModeId ? `https://cdn.brawlify.com/game-modes/regular/${gameModeId}.png` : 'https://i.ibb.co/TxLbWLnS/3094.png';
        selectSelected.innerHTML = `
            <div class="icon-container">
                <img src="${iconUrl}" alt="${eventsData[0].map.gameMode.name} icon" onerror="this.src='https://i.ibb.co/TxLbWLnS/3094.png'">
            </div>
            ${eventsData[0].map.gameMode.name} - ${eventsData[0].map.name}
            <svg class="w-2.5 h-2.5 ms-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 1 4 4 4-4"/>
            </svg>
        `;
    }

    // Перемикання видимості випадаючого списку
    selectSelected.addEventListener('click', () => {
        selectList.style.display = selectList.style.display === 'none' ? 'block' : 'none';
    });

    // Обробка вибору опції
    selectList.addEventListener('click', (e) => {
        const li = e.target.closest('li');
        if (!li) return;
        const selectedIndex = li.getAttribute('data-value');
        if (selectedIndex === '') return;

        const selectedEvent = eventsData[selectedIndex];
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

        updateEventDisplay(selectedEvent);

        if (selectedIndex !== '0') {
            setTimeout(() => {
                const gameModeId = eventsData[0].map.gameMode?.scId || '';
                const iconUrl = gameModeId ? `https://cdn.brawlify.com/game-modes/regular/${gameModeId}.png` : 'https://i.ibb.co/TxLbWLnS/3094.png';
                selectSelected.innerHTML = `
                    <div class="icon-container">
                        <img src="${iconUrl}" alt="${eventsData[0].map.gameMode.name} icon" onerror="this.src='https://i.ibb.co/TxLbWLnS/3094.png'">
                    </div>
                    ${eventsData[0].map.gameMode.name} - ${eventsData[0].map.name}
                    <svg class="w-2.5 h-2.5 ms-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                        <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 1 4 4 4-4"/>
                    </svg>
                `;
                updateEventDisplay(eventsData[0]);
            }, 60000);
        }
    });

    // Закриття випадаючого списку при кліку поза ним
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.custom-select')) {
            selectList.style.display = 'none';
        }
    });

    // Періодичне оновлення подій
    setInterval(async () => {
        const previousEventsCount = eventsData.length;
        eventsData = await fetchEvents();
        console.log('Оновлено подій у eventsData:', eventsData.length);

        if (eventsData.length === 0) {
            updateEventSelect(selectList, eventsData);
            document.getElementById('gameModeName').textContent = 'Немає майбутніх подій';
            document.getElementById('mapName').textContent = '';
            document.getElementById('mapThumbnail').src = '';
            document.getElementById('brawlerStats').innerHTML = '';
            document.getElementById('timeUntilStart').textContent = 'Очікуємо нові події';
            document.getElementById('eventDate').textContent = '';
            document.getElementById('gameModeBanner').src = '';
            selectSelected.textContent = 'Немає майбутніх подій';
        } else {
            updateEventSelect(selectList, eventsData);
            const currentSelected = selectSelected.textContent.trim();
            let currentIndex = -1;
            eventsData.forEach((event, index) => {
                if (`${event.map.gameMode.name} - ${event.map.name}` === currentSelected) {
                    currentIndex = index;
                }
            });

            if (currentIndex >= eventsData.length || currentIndex < 0) {
                const gameModeId = eventsData[0].map.gameMode?.scId || '';
                const iconUrl = gameModeId ? `https://cdn.brawlify.com/game-modes/regular/${gameModeId}.png` : 'https://i.ibb.co/TxLbWLnS/3094.png';
                selectSelected.innerHTML = `
                    <div class="icon-container">
                        <img src="${iconUrl}" alt="${eventsData[0].map.gameMode.name} icon" onerror="this.src='https://i.ibb.co/TxLbWLnS/3094.png'">
                    </div>
                    ${eventsData[0].map.gameMode.name} - ${eventsData[0].map.name}
                    <svg class="w-2.5 h-2.5 ms-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                        <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 1 4 4 4-4"/>
                    </svg>
                `;
                updateEventDisplay(eventsData[0]);
            } else {
                const gameModeId = eventsData[currentIndex].map.gameMode?.scId || '';
                const iconUrl = gameModeId ? `https://cdn.brawlify.com/game-modes/regular/${gameModeId}.png` : 'https://i.ibb.co/TxLbWLnS/3094.png';
                selectSelected.innerHTML = `
                    <div class="icon-container">
                        <img src="${iconUrl}" alt="${eventsData[currentIndex].map.gameMode.name} icon" onerror="this.src='https://i.ibb.co/TxLbWLnS/3094.png'">
                    </div>
                    ${eventsData[currentIndex].map.gameMode.name} - ${eventsData[currentIndex].map.name}
                    <svg class="w-2.5 h-2.5 ms-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                        <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 1 4 4 4-4"/>
                    </svg>
                `;
                updateEventDisplay(eventsData[currentIndex]);
            }

            if (previousEventsCount !== eventsData.length) {
                console.log(`Кількість подій змінилася: було ${previousEventsCount}, стало ${eventsData.length}`);
            }
        }
    }, 60000);
}

// Завантаження подій після завантаження DOM
document.addEventListener('DOMContentLoaded', loadEvents);

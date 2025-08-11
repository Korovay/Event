let eventsData = [];

function getUkraineTime() {
    return moment().tz('Europe/Kyiv');
}

function getTimeUntilStart(startTime) {
    const now = getUkraineTime();
    const start = moment(startTime).tz('Europe/Kyiv');
    const diff = start.diff(now);
    const duration = moment.duration(diff);
    const hours = Math.floor(duration.asHours());
    const minutes = Math.floor(duration.asMinutes()) % 60;
    return `${hours}h ${minutes}min`;
}

function formatDate(date) {
    return moment(date).tz('Europe/Kyiv').format('DD.MM.YYYY HH:mm');
}

function formatBrawlerStats(stats) {
    if (!stats || stats.length === 0) return '<div class="stats-column">Немає даних</div>';

    const leftColumnStats = stats.slice(0, 5);
    const rightColumnStats = stats.slice(5, 10);

    const generateColumnHTML = (stats) => stats.map(stat => `
        <div class="stat-row">
            <div class="stat-brawler-img-container">
                <img src="https://cdn.brawlify.com/brawlers/borderless/${stat.brawler}.png" 
                     class="stat-brawler-img" 
                     alt="${stat.brawler}"
                     loading="lazy"
                     onerror="this.src='https://cdn.brawlify.com/brawlers/borderless/16000000.png'">
            </div>
            <span class="stat-winrate">${Math.round(stat.winRate)}%</span>
        </div>
    `).join('');

    return `
        <div class="stats-column">${generateColumnHTML(leftColumnStats)}</div>
        <div class="stats-column">${generateColumnHTML(rightColumnStats)}</div>
    `;
}

function updateSelectSelected(event, selectSelected) {
    const gameModeId = event.map.gameMode?.scId || '';
    const iconUrl = gameModeId ? `https://cdn.brawlify.com/game-modes/regular/${gameModeId}.png` : 'https://i.ibb.co/TxLbWLnS/3094.png';
    selectSelected.innerHTML = `
        <div class="icon-container">
            <img src="${iconUrl}" alt="${event.map.gameMode.name} icon" loading="lazy" onerror="this.src='https://i.ibb.co/TxLbWLnS/3094.png'">
        </div>
        ${event.map.gameMode.name} - ${event.map.name}
        <svg class="w-2.5 h-2.5 ms-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 1 4 4 4-4"/>
        </svg>
    `;
}

function updateEventDisplay(event) {
    document.getElementById('gameModeName').textContent = event.map.gameMode.name;
    document.getElementById('mapName').textContent = event.map.name;
    document.getElementById('mapThumbnail').src = `https://cdn.brawlify.com/maps/regular/${event.map.id}.png`;
    document.getElementById('brawlerStats').innerHTML = formatBrawlerStats(event.map.stats);
    document.getElementById('timeUntilStart').textContent = getTimeUntilStart(event.startTime);
    document.getElementById('eventDate').textContent = formatDate(event.startTime);
    document.getElementById('gameModeBanner').src = `https://cdn-misc.brawlify.com/gamemode/header/${event.map.gameMode.hash}.png`;
}

async function fetchEvents() {
    try {
        const response = await axios.get('https://api.brawlify.com/v1/events');
        const upcomingEvents = response.data.upcoming || [];
        const now = getUkraineTime();
        return upcomingEvents.filter(event => moment(event.startTime).tz('Europe/Kyiv').isAfter(now));
    } catch (error) {
        console.error('Помилка завантаження подій:', error.message);
        return [];
    }
}

function updateEventSelect(selectList, events) {
    selectList.innerHTML = events.length === 0
        ? '<li data-value="">Немає майбутніх подій</li>'
        : events.map((event, index) => {
            const gameModeId = event.map.gameMode?.scId || '';
            const iconUrl = gameModeId ? `https://cdn.brawlify.com/game-modes/regular/${gameModeId}.png` : 'https://i.ibb.co/TxLbWLnS/3094.png';
            return `
                <li data-value="${index}">
                    <img src="${iconUrl}" alt="${event.map.gameMode.name} icon" loading="lazy" onerror="this.src='https://i.ibb.co/TxLbWLnS/3094.png'">
                    ${event.map.gameMode.name} - ${event.map.name}
                </li>
            `;
        }).join('');
}

async function loadEvents() {
    const selectList = document.getElementById('eventSelectList');
    const selectSelected = document.querySelector('.select-selected');

    eventsData = await fetchEvents();

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
        updateSelectSelected(eventsData[0], selectSelected);
    }

    selectSelected.addEventListener('click', () => {
        selectList.style.display = selectList.style.display === 'none' ? 'block' : 'none';
    });

    selectList.addEventListener('click', (e) => {
        const li = e.target.closest('li');
        if (!li || li.getAttribute('data-value') === '') return;

        const selectedIndex = li.getAttribute('data-value');
        const selectedEvent = eventsData[selectedIndex];
        updateSelectSelected(selectedEvent, selectSelected);
        selectList.style.display = 'none';
        updateEventDisplay(selectedEvent);

        if (selectedIndex !== '0') {
            setTimeout(() => {
                updateSelectSelected(eventsData[0], selectSelected);
                updateEventDisplay(eventsData[0]);
            }, 60000);
        }
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.custom-select')) {
            selectList.style.display = 'none';
        }
    });

    setInterval(async () => {
        eventsData = await fetchEvents();
        updateEventSelect(selectList, eventsData);

        if (eventsData.length === 0) {
            document.getElementById('gameModeName').textContent = 'Немає майбутніх подій';
            document.getElementById('mapName').textContent = '';
            document.getElementById('mapThumbnail').src = '';
            document.getElementById('brawlerStats').innerHTML = '';
            document.getElementById('timeUntilStart').textContent = 'Очікуємо нові події';
            document.getElementById('eventDate').textContent = '';
            document.getElementById('gameModeBanner').src = '';
            selectSelected.textContent = 'Немає майбутніх подій';
        } else {
            const currentSelected = selectSelected.textContent.trim();
            let currentIndex = eventsData.findIndex(event => `${event.map.gameMode.name} - ${event.map.name}` === currentSelected);
            if (currentIndex >= eventsData.length || currentIndex < 0) currentIndex = 0;
            updateSelectSelected(eventsData[currentIndex], selectSelected);
            updateEventDisplay(eventsData[currentIndex]);
        }
    }, 60000);
}

document.addEventListener('DOMContentLoaded', loadEvents);

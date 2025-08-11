// up.js
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
    return hours >= 0 ? `${hours}h ${minutes}min` : 'Event started';
}

function formatDate(date) {
    return moment(date).tz('Europe/Kyiv').format('DD.MM.YYYY HH:mm');
}

function formatBrawlerStats(stats) {
    if (!stats || stats.length === 0) return '<div class="stats-column">No data available</div>';

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

function updateEventDisplay(event) {
    document.getElementById('gameModeName').textContent = event?.map?.gameMode?.name || 'No event';
    document.getElementById('mapName').textContent = event?.map?.name || '';
    document.getElementById('mapThumbnail').src = event?.map?.id ? `https://cdn.brawlify.com/maps/regular/${event.map.id}.png` : '';
    document.getElementById('brawlerStats').innerHTML = formatBrawlerStats(event?.map?.stats || []);
    document.getElementById('timeUntilStart').textContent = event?.startTime ? getTimeUntilStart(event.startTime) : 'N/A';
    document.getElementById('eventDate').textContent = event?.startTime ? formatDate(event.startTime) : '';
    document.getElementById('gameModeBanner').src = event?.map?.gameMode?.hash ? `https://cdn-misc.brawlify.com/gamemode/header/${event.map.gameMode.hash}.png` : '';
}

async function fetchEvents() {
    try {
        const response = await axios.get('https://api.brawlify.com/v1/events');
        const upcomingEvents = response.data?.upcoming || [];
        const now = getUkraineTime();

        return upcomingEvents.filter(event => {
            const start = moment(event.startTime).tz('Europe/Kyiv');
            return start.isAfter(now);
        });
    } catch (error) {
        console.error('Error fetching events:', error.message);
        return [];
    }
}

function updateEventSelect(selectList, events) {
    let optionsHTML = events.length === 0 
        ? '<li data-value="">No upcoming events</li>'
        : events.map((event, index) => {
            const gameModeId = event.map.gameMode?.scId || '';
            const iconUrl = gameModeId ? `https://cdn.brawlify.com/game-modes/regular/${gameModeId}.png` : 'https://i.ibb.co/TxLbWLn/3094.png';
            return `
                <li data-value="${index}">
                    <img src="${iconUrl}" alt="${event.map.gameMode.name} icon" onerror="this.src='https://i.ibb.co/TxLbWLn/3094.png'">
                    ${event.map.gameMode.name} - ${event.map.name}
                </li>
            `;
        }).join('');
    
    selectList.innerHTML = optionsHTML;
}

async function loadEvents() {
    const selectList = document.getElementById('eventSelectList');
    const selectSelected = document.querySelector('.select-selected');

    eventsData = await fetchEvents();
    if (eventsData.length === 0) {
        updateEventSelect(selectList, eventsData);
        updateEventDisplay({});
        selectSelected.textContent = 'No upcoming events';
    } else {
        updateEventSelect(selectList, eventsData);
        updateEventDisplay(eventsData[0]);
        const gameModeId = eventsData[0].map.gameMode?.scId || '';
        const iconUrl = gameModeId ? `https://cdn.brawlify.com/game-modes/regular/${gameModeId}.png` : 'https://i.ibb.co/TxLbWLn/3094.png';
        selectSelected.innerHTML = `
            <div class="icon-container">
                <img src="${iconUrl}" alt="${eventsData[0].map.gameMode.name} icon" onerror="this.src='https://i.ibb.co/TxLbWLn/3094.png'">
            </div>
            ${eventsData[0].map.gameMode.name} - ${eventsData[0].map.name}
            <svg class="w-2.5 h-2.5 ms-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 1 4 4 4-4"/>
            </svg>
        `;
    }

    selectSelected.addEventListener('click', () => {
        selectList.style.display = selectList.style.display === 'none' ? 'block' : 'none';
    });

    selectList.addEventListener('click', (e) => {
        const li = e.target.closest('li');
        if (!li || li.getAttribute('data-value') === '') return;

        const selectedIndex = li.getAttribute('data-value');
        const selectedEvent = eventsData[selectedIndex];
        updateEventDisplay(selectedEvent);

        const gameModeId = selectedEvent.map.gameMode?.scId || '';
        const iconUrl = gameModeId ? `https://cdn.brawlify.com/game-modes/regular/${gameModeId}.png` : 'https://i.ibb.co/TxLbWLn/3094.png';
        selectSelected.innerHTML = `
            <div class="icon-container">
                <img src="${iconUrl}" alt="${selectedEvent.map.gameMode.name} icon" onerror="this.src='https://i.ibb.co/TxLbWLn/3094.png'">
            </div>
            ${selectedEvent.map.gameMode.name} - ${selectedEvent.map.name}
            <svg class="w-2.5 h-2.5 ms-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 1 4 4 4-4"/>
            </svg>
        `;
        selectList.style.display = 'none';

        if (selectedIndex !== '0') {
            setTimeout(() => {
                const gameModeId = eventsData[0].map.gameMode?.scId || '';
                const iconUrl = gameModeId ? `https://cdn.brawlify.com/game-modes/regular/${gameModeId}.png` : 'https://i.ibb.co/TxLbWLn/3094.png';
                selectSelected.innerHTML = `
                    <div class="icon-container">
                        <img src="${iconUrl}" alt="${eventsData[0].map.gameMode.name} icon" onerror="this.src='https://i.ibb.co/TxLbWLn/3094.png'">
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

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.custom-select')) {
            selectList.style.display = 'none';
        }
    });

    setInterval(async () => {
        eventsData = await fetchEvents();
        updateEventSelect(selectList, eventsData);

        const currentSelected = selectSelected.textContent.trim();
        let currentIndex = -1;
        eventsData.forEach((event, index) => {
            if (`${event.map.gameMode.name} - ${event.map.name}` === currentSelected) {
                currentIndex = index;
            }
        });

        if (eventsData.length === 0) {
            updateEventDisplay({});
            selectSelected.textContent = 'No upcoming events';
        } else if (currentIndex >= eventsData.length || currentIndex < 0) {
            updateEventDisplay(eventsData[0]);
            const gameModeId = eventsData[0].map.gameMode?.scId || '';
            const iconUrl = gameModeId ? `https://cdn.brawlify.com/game-modes/regular/${gameModeId}.png` : 'https://i.ibb.co/TxLbWLn/3094.png';
            selectSelected.innerHTML = `
                <div class="icon-container">
                    <img src="${iconUrl}" alt="${eventsData[0].map.gameMode.name} icon" onerror="this.src='https://i.ibb.co/TxLbWLn/3094.png'">
                </div>
                ${eventsData[0].map.gameMode.name} - ${eventsData[0].map.name}
                <svg class="w-2.5 h-2.5 ms-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 1 4 4 4-4"/>
                </svg>
            `;
        } else {
            updateEventDisplay(eventsData[currentIndex]);
        }
    }, 60000);
}

document.addEventListener('DOMContentLoaded', loadEvents);

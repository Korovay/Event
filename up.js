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

function getTimeUntilStart(startTime) {
    const now = getUkraineTime();
    const start = new Date(startTime);
    const diff = start - now;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}min`;
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

function updateEventDisplay(event, color) {
    document.getElementById('gameModeName').textContent = event.map.gameMode.name;
    document.getElementById('mapName').textContent = event.map.name;
    document.getElementById('mapThumbnail').src = `https://cdn.brawlify.com/maps/regular/${event.map.id}.png`;
    document.getElementById('brawlerStats').innerHTML = formatBrawlerStats(event.map.stats);
    document.getElementById('timeUntilStart').innerHTML = 
        '<img src="https://s6.gifyu.com/images/bbrI7.gif" class="timer-icon" alt="Timer Icon"> ' + getTimeUntilStart(event.startTime);
    document.getElementById('eventDate').textContent = formatDate(event.startTime);
    document.getElementById('gameModeBanner').src = `https://cdn-misc.brawlify.com/gamemode/header/${event.map.gameMode.hash}.png`;
    document.querySelector('.event-card').style.border = `5px solid ${color}`; // Оновлено на border
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

        if (!Array.isArray(upcomingEvents) || upcomingEvents.length === 0) {
            console.log('Немає майбутніх подій у upcoming або дані не є масивом');
            return [];
        }

        const filteredUpcomingEvents = upcomingEvents.filter(event => {
            const start = new Date(event.startTime);
            const isUpcoming = start > now;
            console.log(`Подія: ${event.map.gameMode.name} - ${event.map.name}, Start: ${start.toISOString()}, Now: ${now.toISOString()}, Майбутня: ${isUpcoming}`);
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

function updateEventSelect(select, events) {
    console.log('Оновлюємо select з подіями:', events.length);
    console.log('Події, передані в select:', JSON.stringify(events, null, 2));
    let optionsHTML = '<option value="" disabled selected>Choose Event:</option>';
    
    if (events.length === 0) {
        optionsHTML += '<option value="">Немає майбутніх подій</option>';
    } else {
        optionsHTML += events.map((event, index) => `
            <option value="${index}">
                ${event.map.gameMode.name} - ${event.map.name}
            </option>
        `).join('');
    }
    
    select.innerHTML = optionsHTML;
    console.log('Згенерований HTML для select:', optionsHTML);
}

async function loadEvents() {
    const select = document.getElementById('eventSelect');

    eventsData = await fetchEvents();
    console.log('Завантажено подій у eventsData:', eventsData.length);

    if (eventsData.length === 0) {
        updateEventSelect(select, eventsData);
        document.getElementById('gameModeName').textContent = 'Немає майбутніх подій';
        document.getElementById('mapName').textContent = '';
        document.getElementById('mapThumbnail').src = '';
        document.getElementById('brawlerStats').innerHTML = '';
        document.getElementById('timeUntilStart').textContent = 'Очікуємо нові події';
        document.getElementById('eventDate').textContent = '';
        document.getElementById('gameModeBanner').src = '';
        document.querySelector('.event-card').style.border = `5px solid #ccc`; // Оновлено на border
    } else {
        updateEventSelect(select, eventsData);
        const initialColor = colors[Math.floor(Math.random() * colors.length)];
        updateEventDisplay(eventsData[0], initialColor);
    }

    select.addEventListener('change', () => {
        const selectedIndex = parseInt(select.value);
        if (selectedIndex >= 0 && selectedIndex < eventsData.length) {
            const selectedEvent = eventsData[selectedIndex];
            const color = colors[Math.floor(Math.random() * colors.length)];
            updateEventDisplay(selectedEvent, color);

            if (selectedIndex !== 0) {
                setTimeout(() => {
                    select.value = '';
                    const resetColor = colors[Math.floor(Math.random() * colors.length)];
                    updateEventDisplay(eventsData[0], resetColor);
                }, 60000);
            }
        }
    });

    setInterval(async () => {
        const previousEventsCount = eventsData.length;
        eventsData = await fetchEvents();
        console.log('Оновлено подій у eventsData:', eventsData.length);

        if (eventsData.length === 0) {
            updateEventSelect(select, eventsData);
            document.getElementById('gameModeName').textContent = 'Немає майбутніх подій';
            document.getElementById('mapName').textContent = '';
            document.getElementById('mapThumbnail').src = '';
            document.getElementById('brawlerStats').innerHTML = '';
            document.getElementById('timeUntilStart').textContent = 'Очікуємо нові події';
            document.getElementById('eventDate').textContent = '';
            document.getElementById('gameModeBanner').src = '';
            document.querySelector('.event-card').style.border = `5px solid #ccc`; // Оновлено на border
        } else {
            const currentSelectedIndex = parseInt(select.value) || -1;

            updateEventSelect(select, eventsData);

            if (currentSelectedIndex >= eventsData.length || currentSelectedIndex < 0) {
                select.value = '';
                const color = colors[Math.floor(Math.random() * colors.length)];
                updateEventDisplay(eventsData[0], color);
            } else {
                select.value = currentSelectedIndex.toString();
                const color = colors[Math.floor(Math.random() * colors.length)];
                updateEventDisplay(eventsData[currentSelectedIndex], color);
            }

            if (previousEventsCount !== eventsData.length) {
                console.log(`Кількість подій змінилася: було ${previousEventsCount}, стало ${eventsData.length}`);
            }
        }
    }, 60000);
}

document.addEventListener('DOMContentLoaded', loadEvents);

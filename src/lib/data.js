import fs from 'fs';
import path from 'path';

// Path to the downloaded freeculture_data.json
const dataPath = path.join(process.cwd(), 'public', 'freeculture_data.json');

let cachedData = null;

export function getAllEvents() {
    if (cachedData) return cachedData;
    
    try {
        const rawData = fs.readFileSync(dataPath, 'utf-8');
        cachedData = JSON.parse(rawData);
        return cachedData;
    } catch (e) {
        console.error("Failed to load freeculture_data.json", e);
        return [];
    }
}

export function getEventsByRegion(region) {
    const allEvents = getAllEvents();
    if (region === '전체' || !region) return allEvents;
    
    return allEvents.filter(event => event.area === region);
}

export function getEventsByCategory(category) {
    const allEvents = getAllEvents();
    if (category === '모든 카테고리' || !category) return allEvents;
    
    return allEvents.filter(event => event.realmName === category);
}

export function getEventsByRegionAndCategory(region, category) {
    const allEvents = getAllEvents();
    return allEvents.filter(event => 
        (region === '전체' || !region || event.area === region) &&
        (category === '모든 카테고리' || !category || event.realmName === category)
    );
}

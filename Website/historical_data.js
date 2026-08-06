const BASE_URL = "https://api.openf1.org/v1";

export async function getOpenF1(endpoint, params = {}, retries = 3) {
    const query = new URLSearchParams(params).toString();
    const url = `${BASE_URL}/${endpoint}${query ? `?${query}` : ""}`;

    for (let attempt = 0; attempt <= retries; attempt++) {
        const response = await fetch(url);
        if (response.ok) return response.json();

        if (response.status === 429 && attempt < retries) {
            const retryAfter = Number(response.headers.get("Retry-After")) || (attempt + 1) * 2;
            await new Promise(res => setTimeout(res, retryAfter * 1000));
            continue;
        }

        throw new Error(`OpenF1 request failed: ${response.status}`);
    }
}

// thin, named wrappers for the calls you actually use
export const getLaps = (params) => getOpenF1("laps", params);
export const getCarData = (params) => getOpenF1("car_data", params);
export const getWeather = (params) => getOpenF1("weather", params);
export const getSession = (params) => getOpenF1("sessions", params);
export const getMeeting = (params) => getOpenF1("meetings", params)
export const getDriversStandings = (params) => getOpenF1("championship_drivers", params);
export const getConstructorsStandings = (params) => getOpenF1("championship_teams", params);
export const getDriver = (params) =>getOpenF1("drivers",params);
export const getPosition = (params) =>getOpenF1("position",params);
export const getSessionResult = (params) => getOpenF1("session_result", params);

export async function getLatestRaceSessionKey(year) {
    const sessions = await getOpenF1("sessions", { session_name: "Race", year });
    const now = new Date();
    const pastRaces = sessions.filter(s => new Date(s.date_start) <= now);
    const latestRace = pastRaces.sort((a, b) => new Date(b.date_start) - new Date(a.date_start))[0];
    return latestRace ? latestRace.session_key : null;
}
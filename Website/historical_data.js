const BASE_URL = "https://api.openf1.org/v1";

export async function getOpenF1(endpoint, params = {}, retries = 3) {

    const query = new URLSearchParams(params).toString();
    const url = `${BASE_URL}/${endpoint}${query ? `?${query}` : ""}`;

    console.log("OpenF1:", url);

    for (let attempt = 0; attempt <= retries; attempt++) {

        const response = await fetch(url);
        console.log(
            endpoint,
            response.status,
            response.statusText
        );

        if (response.ok) {
            return response.json();
        }

        if (response.status === 404) return [];

        if (response.status === 429 && attempt < retries) {
            const retryAfter =
                Number(response.headers.get("Retry-After")) || (attempt + 1) * 2;

            await new Promise(res => setTimeout(res, retryAfter * 1000));
            continue;
        }
    }
}

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
export const getRaceControl = (params) => getOpenF1("race_control", params);
export const getPit = (params) => getOpenF1("pit", params);
export const getLocation = (params) => getOpenF1("location", params);
export const getIntervals = (params) => getOpenF1("intervals", params);
export const getStints = (params) => getOpenF1("stints", params);

export async function getLatestRaceSessionKey(year) {
    const sessions = await getOpenF1("sessions", { session_name: "Race", year });
    const now = new Date();
    const pastRaces = sessions.filter(s => new Date(s.date_start) <= now);
    const latestRace = pastRaces.sort((a, b) => new Date(b.date_start) - new Date(a.date_start))[0];
    return latestRace ? latestRace.session_key : null;
}
const logoPath = "/TeamLogos/"
const teamLogo = {
    "Mercedes":logoPath + "mercedes.png",
    "Red Bull Racing":logoPath + "redbull.png",
    "McLaren":logoPath + "mclaren.png",
    "Ferrari":logoPath + "ferrari.png",
    "Racing Bulls":logoPath + "rb.png",
    "RB":logoPath + "rb.png",
    "Alpine": logoPath + "alpine.png",
    "Audi":logoPath + "audi.png",
    "Haas F1 Team":logoPath + "haas.png",
    "Williams":logoPath + "williams.png",
    "Aston Martin":logoPath + "aston-martin.png",
    "Cadillac":logoPath + "cadillac.png",
    "Kick Sauber": logoPath + "kick-sauber.png",
    "Alfa Romeo" : logoPath + "alfa-romeo.png",
    "AlphaTauri" : logoPath + "alpha-tauri.png"
};
export function getTeamLogo(teamName){
    return teamLogo[teamName];
}

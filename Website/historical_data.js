const BASE_URL = "https://api.openf1.org/v1";

export async function getOpenF1(endpoint, params = {}) {
    const query = new URLSearchParams(params).toString();
    const response = await fetch(`${BASE_URL}/${endpoint}${query ? `?${query}` : ""}`);
    if (!response.ok) throw new Error(`OpenF1 request failed: ${response.status}`);
    return response.json();
}

// thin, named wrappers for the calls you actually use
export const getLaps = (params) => getOpenF1("laps", params);
export const getCarData = (params) => getOpenF1("car_data", params);
export const getWeather = (params) => getOpenF1("weather", params);
export const getSession = (params) => getOpenF1("sessions", params)
export const getDriversStandings = (params) => getOpenF1("championship_drivers", params)
export const getConstructorsStandings = (params) => getOpenF1("championship_teams", params)
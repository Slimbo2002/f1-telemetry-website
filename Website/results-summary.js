import { getMeeting, getSession, getSessionResult, getDriver, getLaps} from "./historical_data.js";

const race_name = document.querySelector('#race-name');
const track_name = document.querySelector('#race-location');
const race_date = document.querySelector('#race-date');
const overview = document.querySelector('#session-overview');
const circuit_map = document.querySelector('#circuit-map');

async function init() {
    const meeting_key = getURLVariables().get("meeting");
    const meeting = await getMeeting({ meeting_key: meeting_key });
    const sessions = await getSession({meeting_key: meeting[0].meeting_key});
    const drivers = await getDriver({meeting_key: meeting[0].meeting_key});

    const driverMap = new Map(
        drivers.map(driver => [driver.driver_number, driver])
    );

    const session_results = await getSessionResults(sessions);

    fillSessions(sessions, session_results, driverMap);
    fillHero(meeting[0]);
}

function getDriverName(driverMap, driverNumber) {
    const driver = driverMap.get(driverNumber);

    if (!driver) return driverNumber;

    const parts = driver.full_name.split(" ");
    return `${parts[0][0]} ${parts.slice(1).join(" ")}`;
}

async function getSessionResults(sessions) {
    return await Promise.all(
        sessions.map(session =>
            getSessionResult({ session_key: session.session_key })
        )
    );
}

async function fillSessions(sessions, session_results, driverMap) {
    const fastestLaps = await Promise.all(
        sessions.map(session => getFastestLap(session.session_key))
    );

    let html = "";

    for (const [index, session] of sessions.entries()) {
        const results = session_results[index];
        const fastestLap = fastestLaps[index];
        let rows = "";

        results.slice(0, 5).forEach(result => {
            const gap = result.position === 1 ? "Leader" : "+" + Number(String(result.gap_to_leader).split(",")[0]).toFixed(3);

            rows += `
                <div class="session-row">
                    <span class="pos">${result.position}</span>
                    <span class="driver">${getDriverName(driverMap, result.driver_number)}</span>
                    <span class="gap">${gap}</span>
                </div>
            `;
        });

        html += `
            <div class="session-card">
                <div class="session-title">
                    <h2>${session.session_name}</h2>
                    <h3>${new Date(session.date_start).toLocaleDateString("en-GB")}</h3>
                    <h3 class = "fastest-lap">Fastest Lap: ${fastestLap}</h3>
                </div>

                <div class="session-result">
                    ${rows}
                </div>

                /* <button class = "results-button" value = "${session.session_key}">Results</button> */
            </div>
        `;
    };
    overview.innerHTML = html;
    overview.addEventListener("click", (e) => {
        const button = e.target.closest(".results-button");
        if (!button) return;

        window.location.href = `results.html?session=${button.value}`;
    });
}

async function getFastestLap(session_key) {
    const laps = await getLaps({ session_key });

    const fastest = laps
        .filter(lap => lap.lap_duration > 0)
        .reduce((best, lap) =>
            lap.lap_duration < best.lap_duration ? lap : best
        );

    return formatLapTime(fastest.lap_duration);
}
function formatLapTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const millis = Math.round((seconds % 1) * 1000);

    return `${mins}:${String(secs).padStart(2, "0")}.${String(millis).padStart(3, "0")}`;
}
function fillHero(meeting){
    race_name.innerHTML = meeting.meeting_name;
    track_name.innerHTML = meeting.circuit_short_name;
    circuit_map.src = meeting.circuit_image;

    const start = new Date(meeting.date_start).toLocaleDateString("en-GB", { day: "numeric"});
    const end = new Date(meeting.date_end).toLocaleDateString("en-GB", { day: "numeric"});
    const month = new Date(meeting.date_start).toLocaleDateString("en-GB", {month: "long"});
    race_date.innerHTML = `${start} - ${end} ${month}`;

    document.querySelector(".hero").style.backgroundImage =
        `linear-gradient(90deg, rgba(0, 0, 0, 0.41), rgb(0, 0, 0) 93%), url("${meeting.country_flag}")`;
}
function getURLVariables(){
    const query = window.location.search;
    const params = new URLSearchParams(query);
    return params;
}

init();
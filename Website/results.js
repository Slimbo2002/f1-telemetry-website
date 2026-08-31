import { getMeeting, getSession, getSessionResult, getDriver, getLaps, getTeamLogo} from "./historical_data.js";

const race_name = document.querySelector('#race-name');
const track_name = document.querySelector('#race-location');
const race_date = document.querySelector('#race-date');
const circuit_map = document.querySelector('#circuit-map');
const results_content = document.querySelector('#results-content')
const session_name = document.querySelector('#session')
const replay_button = document.querySelector('#race-replay');
const laps = document.querySelector('#laps')

async function init(){
    const session_key = getURLVariables().get("session");
    const session = await getSession({session_key: session_key});
    const meeting = await getMeeting({meeting_key: session[0].meeting_key});
    const results = await getSessionResult({session_key: session_key});
    const drivers = await getDriver({meeting_key: meeting[0].meeting_key});
    const driverMap = new Map(drivers.map(driver => [driver.driver_number,driver]));
    const laps = await getLaps({session_key: session_key});
    replay_button.value = session_key;


    fillHero(meeting[0]);
    fillSessionResults(results, driverMap, session[0], laps)
    fillHeader(session[0], results[0]);
}
function fillHeader(session, result){
    if(session.session_name == "Race" || session.session_name == "Sprint"){
        session_name.innerHTML = session.session_name;
        laps.innerHTML = result.number_of_laps + " Laps"
    }
    else{
        session_name.innerHTML = session.session_name;
    }
}
function fillSessionResults(results, driverMap, session, laps){
    let rows = "";
    rows +=`
        <div class="results-row">
            <span class="pos">POS</span>
            <span class="driver">Driver</span>
            <span class="team-logo">Team</span>
            <span class="pb-lap">Fastest Lap</span>
            <span class="gap">Gap</span>
        </div>
    `
    results.forEach(driver => {
        let dnf = driver.dnf;
        let dns = driver.dns;
        let dsq = driver.dsq
        let pos;

        let driverInfo = driverMap.get(driver.driver_number);
        let driver_name = driverInfo.full_name;
        let teamLogo = getTeamLogo(driverInfo.team_name);

        let driverLaps = laps.filter(lap =>
            lap.driver_number === driver.driver_number &&
            lap.lap_duration != null &&
            lap.is_pit_out_lap !== true
        );
        let bestLap = driverLaps.length > 0? Math.min(...driverLaps.map(lap => lap.lap_duration)) : null;
        let pb_lap = bestLap != null ? formatLapTime(bestLap.toFixed(3)) : "-";
        let gap;

        if(dns){
            pos = "DNS";
        }
        else if(dnf){
            pos = "DNF";
        }
        else if (dsq){
            pos = "DSQ";
        }
        else{
            pos = driver.position;
        }

        if (driver.position === 1) {
            gap = "Leader";
        }
        else if (typeof driver.gap_to_leader === "string") {
            gap = driver.gap_to_leader;
        }
        else if (driver.gap_to_leader != null) {
            gap = "+" + Number(driver.gap_to_leader).toFixed(3);
        }
        else if (dnf) {
            gap = "DNF";
        }
        else if (dsq){
            gap = "DSQ";
        }
        else {
            gap = "-";
        }

        rows += `
            <div class="results-row"
                style="background: linear-gradient(90deg, #${driverInfo.team_colour}80, transparent);>
                <span class="pos">${pos}</span>
                <span class="driver">${driver_name}</span>
                <img class="team-logo" src="${teamLogo}">
                <span class="pb-lap">${pb_lap}</span>
                <span class="gap">${gap}</span>
            </div>
        `;
});

    results_content.innerHTML = rows;
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
replay_button.addEventListener("click", (e) => {
    const session_key = replay_button.value 
        window.location.href =
            `live.html?session=${session_key}`;
    });

init()
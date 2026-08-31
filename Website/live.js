import { getMeeting, getSession, getSessionResult, getDriver, getLaps, getTeamLogo} from "./historical_data.js";
import { RestDataSource } from "./RestDataSource.js";
import { ReplayEngine } from "./ReplayEngine.js";

const race_name = document.querySelector('#race-name');
const track_name = document.querySelector('#race-location');
const race_date = document.querySelector('#race-date');
const timing_tower = document.querySelector('#timing-tower')
const lapCount = document.querySelector('#lap-counter')

const rest = new RestDataSource();
let driverMap;
let replay;
let lastDrawnLocationCount = 0;

async function init(){
    const session_key = getURLVariables().get("session");
    const session = await getSession({session_key: session_key});
    const meeting = await getMeeting({meeting_key: session[0].meeting_key});
    const drivers = await getDriver({session_key: session_key})
    driverMap = new Map(
        drivers.map(driver => [driver.driver_number, driver])
    );

    fillHero(meeting[0]);

    replay = new ReplayEngine(rest, updateUI, session_key, session[0].date_start);
    replay.start();
}
function fillHero(meeting){
    race_name.innerHTML = meeting.meeting_name;
    track_name.innerHTML = meeting.circuit_short_name;

    const start = new Date(meeting.date_start).toLocaleDateString("en-GB", { day: "numeric"});
    const end = new Date(meeting.date_end).toLocaleDateString("en-GB", { day: "numeric"});
    const month = new Date(meeting.date_start).toLocaleDateString("en-GB", {month: "long"});
    race_date.innerHTML = `${start} - ${end} ${month}`;

    document.querySelector(".hero").style.backgroundImage =
        `linear-gradient(90deg, rgba(0, 0, 0, 0.41), rgb(0, 0, 0) 93%), url("${meeting.country_flag}")`;
}
function updateUI(state) {

    if (!state.bounds) return;

    if (state.location &&state.location.length > 0 &&state.location.length !== lastDrawnLocationCount) {
        drawTrack(state.location,state.bounds);
        lastDrawnLocationCount = state.location.length;
    }

    updateMiniMap(state);   
    UpdateTimingTower(state);
    UpdateTimingHeader(state);
}
function UpdateTimingHeader(state) {
    lapCount.innerHTML = "Lap: " + (state.race_control.lap_counter ?? 0);
}

function UpdateTimingTower(state) {
    let rows = "";
    rows += `
        <div class = "session-row session-row-header">
                <span class = "pos">Pos</span>
                <span class = "driver">Driver</span>
                <span class = "team">Team</span>
                <span class = "interval">Interval</span>
                <span class = "leader">Leader</span>
                <span class = "tyre">Tyre</span>
            </div>
    `
    const sortedDrivers = Object.entries(state.drivers).sort(([, a], [, b]) => a.position - b.position);

    for (const [driverNumber, driver] of sortedDrivers) {

        let pos = driver.position;
        let driverInfo = driverMap.get(Number(driverNumber));
        let logo = getTeamLogo(driverInfo.team_name);

        let interval = formatIntervalGap(Number(driver.interval));
        let leader = formatLeaderGap(Number(driver.gap_to_leader));
        let compound = driver.stints?.compound?.slice(0, 1) ?? "-";
        let tyreClass = "";

        if (compound === "S") {
            tyreClass = "current-compound-soft";
        }
        else if (compound === "M") {
            tyreClass = "current-compound-medium";
        }
        else if (compound === "H") {
            tyreClass = "current-compound-hard";
        }
        else if (compound === "I") {
            tyreClass = "current-compound-inter";
        }
        else if (compound === "W") {
            tyreClass = "current-compound-wet";
        }

        let tyreRow = `<span class="tyre ${tyreClass}">${compound}</span>`;
        

        rows += `
            <div class="session-row"
                style="background: linear-gradient(90deg, #${driverInfo.team_colour}80, transparent);>
                <span class="pos">${pos}</span>
                <span class="driver">${driverInfo.name_acronym}</span>
                <img class="team-logo" src="${logo}">
                <span class="interval">${interval}</span>
                <span class="leader">${leader}</span>
                ${tyreRow}
            </div>
        `;
    }

    timing_tower.innerHTML = rows;
}
function formatLeaderGap(time){
    if(time === 0){
        return "LEADER"
    }
    else if(Number.isNaN(time)){
        return "-";
    }
    else {
        return "+" + time.toFixed(3);
    }
}
function formatIntervalGap(time){
    if(time === 0){
        return "INTERVAL"
    }
    else if(Number.isNaN(time)){
        return "-";
    }
    else {
        return "+" + time.toFixed(3);
    }
}
function updateMiniMap(state){
    for (const driverNumber in state.drivers) {
        const driver = state.drivers[driverNumber];

        if (!driver.location) continue;
        let marker = document.querySelector(`[data-driver="${driverNumber}"]`);
        if (!marker) {
            const group = document.createElementNS("http://www.w3.org/2000/svg","g");

            group.classList.add("driver-marker");
            group.dataset.driver = driverNumber;

            const circle = document.createElementNS("http://www.w3.org/2000/svg","circle");

            circle.setAttribute("r", 16);

            const driverInfo = driverMap.get(Number(driverNumber));
            const name = driverInfo.name_acronym;
            const color = driverInfo.team_colour ? `#${driverInfo.team_colour}`: "#e10600";

            circle.setAttribute("fill", color);

            const text = document.createElementNS("http://www.w3.org/2000/svg","text");

            text.textContent = name;

            text.setAttribute("text-anchor", "middle");
            text.setAttribute("dominant-baseline", "central");
            text.setAttribute("fill", "white");
            text.setAttribute("font-size", "14");
            text.setAttribute("font-weight", "bold");

            group.appendChild(circle);
            group.appendChild(text);

            document.querySelector("#drivers").appendChild(group);
            marker = group;
        }

        const point = toMapCoordinates(
            driver.location.x,
            driver.location.y,
            state.bounds
        );

        marker.setAttribute("transform",`translate(${point.x}, ${point.y})`);
    }
}
function drawTrack(location, bounds) {

    if (!location || location.length === 0) {
        return;
    }

    const track = document.querySelector("#track");
    const byDriver = {};
    for (const record of location) {
        (byDriver[record.driver_number] ??= []).push(record);
    }

    let driverLocation = [];
    for (const records of Object.values(byDriver)) {
        if (records.length > driverLocation.length) {
            driverLocation = records;
        }
    }

    if (driverLocation.length === 0) {
        return;
    }

    const points = driverLocation.map(record => {
        const point = toMapCoordinates(
            record.x,
            record.y,
            bounds
        );
        return `${point.x},${point.y}`;
    });

    track.setAttribute("d", `M ${points.join(" L ")}`);
}
function toMapCoordinates(x, y, bounds) {

    const mapWidth = 1000;
    const mapHeight = 1000;

    const mapX =(x - bounds.minX) /(bounds.maxX - bounds.minX) *mapWidth;

    const mapY =mapHeight -((y - bounds.minY) /(bounds.maxY - bounds.minY) * mapHeight);
    return {x: mapX, y: mapY};
}

function getURLVariables(){
    const query = window.location.search;
    const params = new URLSearchParams(query);
    return params;
}
init();
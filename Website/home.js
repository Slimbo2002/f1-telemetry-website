import { getSession, getDriversStandings, getConstructorsStandings, getDriver, getLatestRaceSessionKey, getMeeting, getPosition, getSessionResult} from "./historical_data.js";

//Celndar Carousel to display the races
const track = document.querySelector('#carosel-track');
const viewport = document.querySelector('.carosel-viewport');
const nextBtn = document.querySelector('.carosel-button--right');
const prevBtn = document.querySelector('.carosel-button--left');

const drivers_standings = document.querySelector('#drivers_standings');
const constructors_standings = document.querySelector('#constructors_standings');
const race_title = document.querySelector('#race-name');
const race_location = document.querySelector('#race-location');
const race_date = document.querySelector('#race-date');
const last_winner = document.querySelector('#last-winner');
const dropdown = document.querySelector('#calendar-dropdown');
const year_title = document.querySelector('#year-title');

let slides = [];
let currentIndex = 0;

async function init() {
    const latestRaceKey = await getLatestRaceSessionKey("2026");
    const latestSession = await getSession({ session_key: "latest" });
    const latestMeeting = await getMeeting({meeting_key: "latest"});

    await fillDropdownYears();
    await populateCalendar();
    zeroCalendar();

    await populateDriversStandings(latestRaceKey);
    await populateConstructorsStandings(latestRaceKey);
    await populateLastWinner(latestRaceKey)

    setHeroFlag(latestMeeting);
    setRaceName(latestMeeting);
}


function getVisibleCount() {
    const slideWidth = slides[0].offsetWidth + parseFloat(getComputedStyle(track).gap);
    return Math.round(viewport.offsetWidth / slideWidth);
}

function zeroCalendar(){
    const slideWidth = slides[0].offsetWidth + parseFloat(getComputedStyle(track).gap);
    viewport.scrollTo({ left: slideWidth * currentIndex, behavior: "smooth" });
}

async function populateLastWinner(lastRace){
    const results = await getSessionResult({session_key: lastRace, position: "1"});
    const winner = results[0]
    const drivers = await getDriver({session_key: lastRace});
    const driver = drivers.find(d => d.driver_number == winner.driver_number);
    const session = await getSession({session_key: lastRace})
    const country = session[0].country_name;

    const bigHeadshot = driver.headshot_url.replace("/1col/", "/9col/");
    last_winner.insertAdjacentHTML("beforeend",`
        <div class = "winner-card">
            <h2>Race Winner</h2>
            <h3>${country} GP</h3>
            <img class = "driver-headshot" src = "${bigHeadshot}"></img>
            <div class = "winner-text">
                <h3>${driver.full_name}</h3>
                <h4>${driver.team_name}</h4>
            </div>
        </div>
        `)
    setWinnerGradient(driver);
}

function setWinnerGradient(driver){
    document.querySelector(".last-winner").style.backgroundImage =
        `linear-gradient(180deg, rgba(0, 0, 0, 0) 30%, #${driver.team_colour}`;
}

async function populateCalendar() {
    slides = [];
    track.innerHTML = "";
    const year = getYear();
    year_title.innerHTML = `<h1>${year} Season Calendar</h1>`

    const data = await getMeeting({ year : year});

    data.forEach(event => {
        const start = new Date(event.date_start).toLocaleDateString("en-GB", { day: "numeric"});
        const end = new Date(event.date_end).toLocaleDateString("en-GB", { day: "numeric"});
        const month = new Date(event.date_start).toLocaleDateString("en-GB", {month: "long"})

        track.insertAdjacentHTML("beforeend", `
            <li class="calendar-card">
                <h1>${event.location}</h1>
                <img class="calendar-card-flag" src="${event.country_flag}"alt="">
                <h2>${start} - ${end} ${month}</h2>
                <a href="">
                    <button class="past-race">Results</button>
                </a>
            </li>
        `);
    });

    slides = Array.from(track.children);
}

async function fillDropdownYears(){
    const data = await getMeeting({});
    const years = data.map(meeting => meeting.year);
    const uniqueYears = [...new Set(years)].sort((a, b) => b - a);

    uniqueYears.forEach(year=> {
        var opt = document.createElement('option')
        opt.value = year;
        opt.innerHTML = year;
        dropdown.appendChild(opt);
    });
}
function getYear(){
    return dropdown.value;
}


async function populateDriversStandings(sessionKey){
    const data = await getDriversStandings({session_key: sessionKey});
    const drivers = await getDriver({session_key: "latest"});

    for (const driver of data.slice(0,5)) {
        const driver_name = formatDriverName(drivers, driver.driver_number);
        drivers_standings.insertAdjacentHTML("beforeend", `
            <div class="standings-row">
                <span class="pos">${driver.position_current}</span>
                <span class="driver">${driver_name}</span>
                <span class="points">${driver.points_current}</span>
            </div>  
            `);
    }
}

function formatDriverName(drivers, driver_num){
    const driver = drivers.find(d => d.driver_number == driver_num);
    if (!driver) return undefined;
    const parts = driver.full_name.split(" ");
    const initial = parts[0][0];
    const surname = parts.slice(1).join(" ");
    return `${initial}  ${surname}`;
}
async function populateConstructorsStandings(sessionKey){
    const data = await getConstructorsStandings({session_key: sessionKey});

    data.slice(0,5).forEach(team => {
        constructors_standings.insertAdjacentHTML("beforeend", `
            <div class = "standings-row">
                <span class = "pos">${team.position_current}</span>
                <span class = "team">${team.team_name}</span>
                <span class = "points">${team.points_current}</span>
            </div>  
            `);
    });
}

function setHeroFlag(data) {
    document.querySelector(".hero").style.backgroundImage =
        `linear-gradient(90deg, rgba(0, 0, 0, 0.41), rgb(0, 0, 0) 93%), url("${data[0].country_flag}")`;
}

function setRaceName(data) {
    race_title.innerHTML = `${data[0].meeting_name}`;
    race_location.innerHTML = `${data[0].circuit_short_name}`;
    const start = new Date(data[0].date_start).toLocaleDateString("en-GB", { day: "numeric"});
    const end = new Date(data[0].date_end).toLocaleDateString("en-GB", { day: "numeric"});
    const month = new Date(data[0].date_start).toLocaleDateString("en-GB", {month: "long"});
    race_date.innerHTML = `${start} - ${end} ${month}`;
}

nextBtn.addEventListener("click", () => {
    const maxIndex = slides.length - getVisibleCount();
    if (currentIndex >= maxIndex) return;

    currentIndex++;
    const slideWidth = slides[0].offsetWidth + parseFloat(getComputedStyle(track).gap);
    viewport.scrollTo({ left: slideWidth * currentIndex, behavior: "smooth" });
});
prevBtn.addEventListener("click", () => {
    if (currentIndex <= 0) return;

    currentIndex--;
    const slideWidth = slides[0].offsetWidth + parseFloat(getComputedStyle(track).gap);
    viewport.scrollTo({ left: slideWidth * currentIndex, behavior: "smooth" });
});
dropdown.addEventListener("change", async () => {
    currentIndex = 0;
    await populateCalendar();
    zeroCalendar();
});


init();
import { getTeamLogo, getSession, getDriversStandings, getConstructorsStandings, getDriver, getLatestRaceSessionKey, getMeeting, getPosition, getSessionResult} from "./historical_data.js";

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
let cachedCalendarData = [];


async function init() {
    const [latestMeeting, latestRaceKey] = await Promise.all([
        getMeeting({meeting_key: "latest"}), 
        getLatestRaceSessionKey("2026"), cacheYears()
    ]);
    const latestRaceSession = await getSession({ session_key: latestRaceKey });
    const meeting_key = latestRaceSession[0].meeting_key;
    const latestRaceMeeting = await getMeeting({meeting_key: meeting_key})

    await Promise.all([
        cacheCalendar(), 
        populateDriversStandings(latestRaceKey),
        populateConstructorsStandings(latestRaceKey), 
        populateLastWinner(latestRaceKey, latestRaceMeeting[0].meeting_name)
    ]);

    zeroCalendar();
    setHeroFlag(latestMeeting[0]);
    setRaceName(latestMeeting[0]);
}


function getVisibleCount() {
    const slideWidth = slides[0].offsetWidth + parseFloat(getComputedStyle(track).gap);
    return Math.round(viewport.offsetWidth / slideWidth);
}

function zeroCalendar(){
    const slideWidth = slides[0].offsetWidth + parseFloat(getComputedStyle(track).gap);
    viewport.scrollTo({ left: slideWidth * currentIndex, behavior: "smooth" });
}

function setRaceName(meeting) {
    race_title.innerHTML = `${meeting.meeting_name}`;
    race_location.innerHTML = `${meeting.circuit_short_name}`;
    const start = new Date(meeting.date_start).toLocaleDateString("en-GB", { day: "numeric"});
    const end = new Date(meeting.date_end).toLocaleDateString("en-GB", { day: "numeric"});
    const month = new Date(meeting.date_start).toLocaleDateString("en-GB", {month: "long"});
    race_date.innerHTML = `${start} - ${end} ${month}`;
}

async function populateLastWinner(lastRace, raceName){
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
            <h3>${raceName}</h3>
            <img class = "driver-headshot" src = "${bigHeadshot}"></img>
            <div class = "winner-text">
                <h3>${driver.full_name}</h3>
                <div class = "team">
                    <h4>${driver.team_name}</h4>
                    <img class = "team-logo" width = "30" height = "30" src = "${getTeamLogo(driver.team_name)}"></img>
                </div>
            </div>
        </div>
        `)
    setWinnerGradient(driver);
}

function setWinnerGradient(driver){
    document.querySelector(".last-winner").style.backgroundImage =
        `linear-gradient(180deg, rgba(0, 0, 0, 0) 30%, #${driver.team_colour}`;
}

async function cacheCalendar(){
    const cachedCalendar = localStorage.getItem("calendar");
    const twoWeeks = 14 * 24 * 60 * 60 * 1000;

    if(cachedCalendar){
        const {calendar, timestamp} = JSON.parse(cachedCalendar);
        if(Date.now() - timestamp < twoWeeks){
            cachedCalendarData = calendar;
            populateCalendar(calendar);
            return;
        }
    }

    const calendar = await getMeeting({});
    cachedCalendarData = calendar;

    localStorage.setItem("calendar", JSON.stringify({ calendar, timestamp: Date.now() }));
    populateCalendar(calendar);
    return;
}

function populateCalendar(calendar) {
    slides = [];
    track.innerHTML = "";
    const year = getYear();
    year_title.innerHTML = `<h1>${year} Season Calendar</h1>`;

    const yearEvents = calendar.filter(event => event.year == year);

    yearEvents.forEach(event => {
        const start = new Date(event.date_start);
        const end = new Date(event.date_end);
        const month = new Date(event.date_start).toLocaleDateString("en-GB", {month: "long"})

        const button = buttonType(start, end, event.meeting_key);
        track.insertAdjacentHTML("beforeend", `
            <li class="calendar-card">
                <h1>${event.location}</h1>
                <img class="calendar-card-flag" src="${event.country_flag}"alt="">
                <h2>${start.getDate()} - ${end.getDate()} ${month}</h2>
                ${button};
            </li>
        `);
    });

    slides = Array.from(track.children);
    document.querySelectorAll(".results-button").forEach(btn=>{
        btn.addEventListener("click", (e) =>{
            const key = e.currentTarget.value;
            window.location.href = `results-summary.html?meeting=${key}`
        });
    });
}

function buttonType(eventStart, eventEnd, event_key){
    const currentDate = new Date(Date.now());
    if(currentDate > eventStart){
        return `<button class="results-button past-race" value ="${event_key}">Results</button>`
    }
    else if(currentDate > eventStart && currentDate < eventEnd){
        return `<button class="results-button live-race" value ="${event_key}">LIVE</button>`
    }
    else{
        return `<button class="results-button future-race" value ="${event_key}">Upcoming</button>`
    }
}

async function cacheYears(){
    const cachedYears = localStorage.getItem("allYears");
    const sixMonths = 178 * 24 * 60 * 60 * 1000;

    if(cachedYears){
        const {years, timestamp} = JSON.parse(cachedYears);
        if(Date.now() - timestamp < sixMonths){
            fillDropdownYears(years);
            return;
        }
    }

    const data = await getMeeting({});
    const years = [...new Set(data.map(m => m.year))].sort((a, b) => b - a);

    localStorage.setItem("allYears", JSON.stringify({ years, timestamp: Date.now() }));
    fillDropdownYears(years);
    return;
}

function fillDropdownYears(years){
    years.forEach(year=> {
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
    const [data, drivers] = await Promise.all([getDriversStandings({session_key: sessionKey}), getDriver({session_key: sessionKey})])
    for (const driver of data.slice(0,5)) {
        const driver_name = formatDriverName(drivers, driver.driver_number);
        drivers_standings.insertAdjacentHTML("beforeend", `
            <div class="standings-row-driver">
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
            <div class = "standings-row-team">
                <span class = "pos">${team.position_current}</span>
                <img class = "team-logo" src = "${getTeamLogo(team.team_name)}">
                <span class = "team">${team.team_name}</span>
                <span class = "points">${team.points_current}</span>
            </div>  
            `);
    });
}

function setHeroFlag(meeting) {
    document.querySelector(".hero").style.backgroundImage =
        `linear-gradient(90deg, rgba(0, 0, 0, 0.41), rgb(0, 0, 0) 93%), url("${meeting.country_flag}")`;
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
dropdown.addEventListener("change", () => {
    currentIndex = 0;
    populateCalendar(cachedCalendarData);
    zeroCalendar();
});




init();
import { getSession, getDriversStandings, getConstructorsStandings } from "./historical_data.js";

//Celndar Carousel to display the races
const track = document.querySelector('#carosel-track');
const viewport = document.querySelector('.carosel-viewport');
const nextBtn = document.querySelector('.carosel-button--right');
const prevBtn = document.querySelector('.carosel-button--left');

const drivers_standings = document.querySelector('#drivers_standings')
const constructors_standings = document.querySelector('#constructors_standings')

let slides = [];
let currentIndex = 0;

async function init() {
    await populateCalendar();
    zeroCalendar();
    await populateDriversStandings();
    await populateConstructorsStandings();
    await setHeroFlag();
}

function getVisibleCount() {
    const slideWidth = slides[0].offsetWidth + parseFloat(getComputedStyle(track).gap);
    return Math.round(viewport.offsetWidth / slideWidth);
}

function zeroCalendar(){
    const slideWidth = slides[0].offsetWidth + parseFloat(getComputedStyle(track).gap);
    viewport.scrollTo({ left: slideWidth * currentIndex, behavior: "smooth" });
}

async function populateCalendar() {
    const data = await getSession({ session_name: "Race", year : "2026"});
    data.forEach(event => {
        const start = new Date(event.date_start).toLocaleDateString("en-GB", { day: "numeric", month: "long" });
        track.insertAdjacentHTML("beforeend", `
            <li class="calendar-card">
                <h1>${event.location}</h1>
                <img class="calendar-card-flag" src="Flags/${event.country_name.replace(/\s+/g, "")}Flag.jpg" alt="">
                <h2>${start}</h2>
                <a href="">
                    <button class="past-race">Results</button>
                </a>
            </li>
        `);
    });

    slides = Array.from(track.children);
}

async function populateDriversStandings(){

    const data = await getDriversStandings({session_key: "latest"})

    data.slice(0,5).forEach(driver => {
        drivers_standings.insertAdjacentHTML("beforeend", `
            <div class = "standings-row">
                <span class = "pos">${driver.position_current}</span>
                <span class = "driver">${driver.driver_number}</span>
                <span class = "points">${driver.points_current}</span>
            </div>  
            `);
    });
}

async function populateConstructorsStandings(){

    const data = await getConstructorsStandings({session_key: "latest"})

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

async function setHero() {
    const data = await getSession({session_key: "latest"});
    const location = data[0].country_name;
    document.querySelector(".hero").style.backgroundImage =
        `linear-gradient(90deg, rgba(0, 0, 0, 0.41), rgb(0, 0, 0) 93%), url("Flags/${location.toLowerCase().replace(/\s+/g, "")}Flag.jpg")`;

    
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


init();
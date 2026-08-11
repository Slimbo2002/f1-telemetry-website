import { getMeeting, getSession, getSessionResult, getDriver, getLaps} from "./historical_data.js";

const race_name = document.querySelector('#race-name');
const track_name = document.querySelector('#race-location');
const race_date = document.querySelector('#race-date');
const circuit_map = document.querySelector('#circuit-map');


async function init(){
    const session_key = getURLVariables().get("session");
    const session = await getSession({session_key: session_key});
    const meeting = await getMeeting({meeting_key: session[0].meeting_key});

    fillHero(meeting[0]);
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
init()
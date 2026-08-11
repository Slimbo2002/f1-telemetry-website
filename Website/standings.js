import { getDriversStandings, getConstructorsStandings, getLatestRaceSessionKey, getDriver, getTeamLogo} from "./historical_data.js";

const drivers_table = document.querySelector("#drivers-standings")
const teams_table = document.querySelector("#teams-standings")

async function init(){
    const [drivers_standings, constructors_standings, drivers] = await Promise.all([
        getDriversStandings({meeting_key: "latest"}),
        getConstructorsStandings({meeting_key: "latest"}),
        getDriver({session_key: "latest"})
    ])

    const driverMap = new Map(
        drivers.map(driver => [driver.driver_number, driver])
    );
    const teamColourMap = new Map(
        drivers.map(driver => [driver.team_name, driver.team_colour])
    );

    fillDriverTable(drivers_standings, driverMap)
    fillTeamsTable(constructors_standings, teamColourMap);
}
function fillDriverTable(standings, driverMap){
    let rows = "";
    let leader = null;
    standings.forEach(driver => {
        let driverInfo = driverMap.get(driver.driver_number);
        let driverName = driverInfo.full_name
        let teamName = driverInfo.team_name;
        let gap = leader === null ? "-" : "+ " + (leader.points_current - driver.points_current);
        if(leader == null){leader = driver};
        
        rows += `
            <div class = "standing-row" 
                style="background: linear-gradient(90deg, #${driverInfo.team_colour}60, transparent);"> 
                <h3 class = "pos">${driver.position_current}</h3>
                <img class = "standing-team-logo" src = "${getTeamLogo(teamName)}">
                <div class = "driver-headshot">
                    <img width = "50" height = "50" src = "${driverInfo.headshot_url}">
                    <h3 class = "driver">${driverName}</h3>
                </div>
                <h3 class = "points">${driver.points_current}</h3>
                <h3 class = "gap">${gap}</h3>
            </div>
        `
    });
    drivers_table.innerHTML = rows;
}
function fillTeamsTable(standings, teamMap){
    let rows = "";
    let leader = null;

    standings.forEach(team => {
        let team_name = team.team_name;
        const team_colour = teamMap.get(team_name);
        let gap = leader === null ? "-" : "+ " + (leader.points_current - team.points_current);
        if(leader == null){leader = team};
        rows += `
            <div class = "standing-row" 
                style="background: linear-gradient(90deg, #${team_colour}60, transparent);>
                <h3 class = "pos">${team.position_current}</h3>
                <img class = "standing-team-logo" src = "${getTeamLogo(team_name)}">
                <h3 class = "driver">${team.team_name}</h3>
                <h3 class = "points">${team.points_current}</h3>
                <h3 class = "gap">${gap}</h3>
            </div>
        `
    })
    teams_table.innerHTML = rows;
}
function getDriverName(driverMap, driverNumber) {
    const driver = driverMap.get(driverNumber);

    if (!driver) return driverNumber;

    return driver.full_name;
}

init();
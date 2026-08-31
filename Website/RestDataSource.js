import { getLocation, getPosition, getLaps, getPit, getIntervals, getRaceControl, getStints} from "./historical_data.js";

export class RestDataSource{
    async load (session_key, start, end){
        const [location] = await Promise.all([
            getLocation({session_key: session_key, "date>": start, "date<": end}),
        ])
        return {location};
    }
    async load_non_repeated (session_key){
        const [position, laps, interval, race_control, stints] = await Promise.all([
            getPosition({session_key: session_key}),
            getLaps({session_key: session_key}),
            getIntervals({session_key: session_key}),
            getRaceControl({session_key: session_key}),
            getStints({session_key: session_key})
        ])
        return {position, laps, interval, race_control, stints};
    }
}
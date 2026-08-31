export class ReplayEngine {

    constructor(dataSource, onUpdate, session_key, startTime) {
        this.dataSource = dataSource;
        this.sessionKey = session_key;
        this.onUpdate = onUpdate;

        this.data = {
            location: [],
            position: [],
            laps: [],
            interval: [],
            race_control: [],
            stints: []
        };
        this.raceControlState = {
            lap_counter: 0
        };

        this.isPlaying = false;
        this.replaySpeed = 5;
        this.replayTime = 0;

        this.startTime = new Date(startTime).getTime();
        this.chunkEnd = this.startTime;

        this.lastFrame = 0;
        this.loading = false;
        this.bounds = null;
        this.scanIndex = {
            location: 0,
            position: 0,
            interval: 0,
            laps: 0,
            race_control: 0,
            stints : 0
        };
        this.driverState = {};
    }
    async start() {

        if (this.isPlaying) return;

        const non_repeated_data = await this.dataSource.load_non_repeated(this.sessionKey);

        this.data.position = non_repeated_data.position ?? [];
        this.data.laps = non_repeated_data.laps ?? [];
        this.data.interval = non_repeated_data.interval ?? [];
        this.data.race_control = non_repeated_data.race_control ?? [];
        this.data.stints = non_repeated_data.stints ?? [];
        
        await this.loadChunk();

        this.isPlaying = true;
        this.lastFrame = performance.now();

        requestAnimationFrame(this.play.bind(this));
    }
    async loadChunk() {

        if (this.loading) return;

        this.loading = true;

        try {
            const startDate =new Date(this.chunkEnd);
            const endDate =new Date(this.chunkEnd + 100000);

            const repeated_data =
                await this.dataSource.load(
                    this.sessionKey,
                    startDate.toISOString(),
                    endDate.toISOString()
                );

            this.data.location.push(...(repeated_data.location ?? []));

            this.chunkEnd = endDate.getTime();
            if (this.data.location.length > 0) {
                this.calculateBounds();
            }
        } finally {

            this.loading = false;
        }
    }

    pause() {

        this.isPlaying = false;
    }

    play(now) {

        if (!this.isPlaying) return;

        const deltaTime =(now - this.lastFrame) / 1000;
        this.lastFrame = now;
        this.replayTime +=deltaTime * this.replaySpeed;
        if (this.replayTime >=(this.chunkEnd - this.startTime) / 1000 - 10) {
            this.loadChunk();
        }
        const loadedTime =
            (this.chunkEnd - this.startTime) / 1000;

        if (this.replayTime > loadedTime) {
            this.replayTime = loadedTime;
        }
        const state =this.getStateAtTime(this.replayTime);
        this.onUpdate(state);

        requestAnimationFrame(
            this.play.bind(this)
        );
    }

    getStateAtTime(time) {

        const state = {
            time: time,
            drivers: this.driverState,
            session: {},
            race_control: this.raceControlState,
            bounds: this.bounds,
            location: this.data.location
        };

        const timestamp = this.startTime + time * 1000;


        // LOCATION
        while (this.scanIndex.location < this.data.location.length) {

            const record = this.data.location[this.scanIndex.location];
            const recordTime = new Date(record.date).getTime();

            if (recordTime > timestamp) {
                break;
            }

            const driverNumber = record.driver_number;

            if (!this.driverState[driverNumber]) {
                this.driverState[driverNumber] = {};
            }

            this.driverState[driverNumber].location = {
                x: record.x,
                y: record.y,
                z: record.z
            };

            this.scanIndex.location++;
        }


        // INTERVAL
        while (this.scanIndex.interval < this.data.interval.length) {

            const record =this.data.interval[this.scanIndex.interval];
            const recordTime =new Date(record.date).getTime();

            if (recordTime > timestamp) {
                break;
            }
            const driverNumber = record.driver_number;

            if (!this.driverState[driverNumber]) {
                this.driverState[driverNumber] = {};
            }

            this.driverState[driverNumber].interval =record.interval;
            this.driverState[driverNumber].gap_to_leader =record.gap_to_leader;
            this.scanIndex.interval++;
        }


        // POSITION
        while (this.scanIndex.position < this.data.position.length) {
            const record =this.data.position[this.scanIndex.position];
            const recordTime =new Date(record.date).getTime();

            if (recordTime > timestamp) {
                break;
            }

            const driverNumber = record.driver_number;

            if (!this.driverState[driverNumber]) {
                this.driverState[driverNumber] = {};
            }

            this.driverState[driverNumber].position =record.position;

            this.scanIndex.position++;
        }


        // RACE CONTROL
        while (this.scanIndex.race_control < this.data.race_control.length) {

            const record =this.data.race_control[this.scanIndex.race_control];
            const recordTime =new Date(record.date).getTime();

            if (recordTime > timestamp) {
                break;
            }

            state.race_control.lap_counter = record.lap_number;
            this.scanIndex.race_control++;
        }


        // STINTS
        while (this.scanIndex.stints <this.data.stints.length) {

            const record =this.data.stints[this.scanIndex.stints];
            const recordTime =new Date(record.date).getTime();

            if (recordTime > timestamp) {
                break;
            }

            const driverNumber =record.driver_number;

            if (!this.driverState[driverNumber]) {
                this.driverState[driverNumber] = {};
            }

            this.driverState[driverNumber].stints = record;
            this.scanIndex.stints++;
        }

        return state;
}
    calculateBounds() {
        let minX = Infinity;
        let maxX = -Infinity;
        let minY = Infinity;
        let maxY = -Infinity;

        for (const record of this.data.location) {

            minX = Math.min(minX, record.x);
            maxX = Math.max(maxX, record.x);

            minY = Math.min(minY, record.y);
            maxY = Math.max(maxY, record.y);
        }

        this.bounds = {
            minX,
            maxX,
            minY,
            maxY
        };
    }
}
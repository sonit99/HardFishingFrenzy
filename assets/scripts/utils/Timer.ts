export class CountdownTimer {
    private startTime: number;
    private endTime: number;
    private currentTime: number;
    private isRunning: boolean = false;
    private intervalId: NodeJS.Timeout = null;
    private onTickCallback: (time: number) => void = null;
    private onCompleteCallback: () => void = null;

    /**
     * Create a countdown timer
     * @param startTime - Starting time (default: 60)
     * @param endTime - Ending time (default: 30)
     */
    constructor(startTime: number = 60, endTime: number = 0) {
        if (startTime <= endTime) {
            throw new Error('Start time must be greater than end time');
        }
        
        this.startTime = startTime;
        this.endTime = endTime;
        this.currentTime = startTime;
    }
    //const timer = new CountdownTimer(60, 0);

    /**
     * Start the countdown from current time to end time
     */
    startTimer() {
        if (this.isRunning || this.currentTime <= this.endTime) {
            return;
        }

        this.isRunning = true;
        this.intervalId = setInterval(() => {
            this.tick();
        }, 1000);
    }

    /**
     * Pause the timer
     */
    pauseTimer() {
        if (!this.isRunning) {
            return;
        }

        this.isRunning = false;
        if (this.intervalId !== null) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    /**
     * Cancel/Stop the timer completely
     */
    cancelTimer() {
        this.isRunning = false;
        if (this.intervalId !== null) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    /**
     * Reset to start time
     */
    resetTimer() {
        this.cancelTimer();
        this.currentTime = this.startTime;
    }

    /**
     * Set new start and end times
     * @param startTime - New starting time
     * @param endTime - New ending time
     */
    setTimes(startTime: number, endTime: number) {
        if (startTime <= endTime) {
            throw new Error('Start time must be greater than end time');
        }
        
        this.cancelTimer();
        this.startTime = startTime;
        this.endTime = endTime;
        this.currentTime = startTime;
    }

    /**
     * Timer tick - called every second
     */
    private tick() {
        this.currentTime--;
        
        // Call the tick callback if set
        if (this.onTickCallback) {
            this.onTickCallback(this.currentTime);
        }
        
        if (this.currentTime <= this.endTime) {
            this.currentTime = this.endTime;
            this.cancelTimer();
            
            // Call completion callback if set
            if (this.onCompleteCallback) {
                this.onCompleteCallback();
            }
        }
    }

    /**
     * Set callback for every tick (every second)
     */
    setOnTick(callback: (time: number) => void) {
        this.onTickCallback = callback;
    }

    /**
     * Set callback for when timer completes
     */
    setOnComplete(callback: () => void) {
        this.onCompleteCallback = callback;
    }

    /**
     * Get current time value
     */
    getCurrentTime(): number {
        return this.currentTime;
    }

    /**
     * Get start time
     */
    getStartTime(): number {
        return this.startTime;
    }

    /**
     * Get end time
     */
    getEndTime(): number {
        return this.endTime;
    }

    /**
     * Check if running
     */
    getIsRunning(): boolean {
        return this.isRunning;
    }

    /**
     * Clean up (call this when you're done with the timer)
     */
    destroy() {
        this.cancelTimer();
        this.onTickCallback = null;
        this.onCompleteCallback = null;
    }
}
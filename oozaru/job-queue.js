import Galileo from './galileo.js';
export var JobType;
(function (JobType) {
    JobType[JobType["Render"] = 0] = "Render";
    JobType[JobType["Update"] = 1] = "Update";
    JobType[JobType["Immediate"] = 2] = "Immediate";
})(JobType || (JobType = {}));
var frameCount = -1;
var jobSortNeeded = false;
var jobs = [];
var nextJobID = 1;
var rAFID = 0;
export default class JobQueue {
    static now() {
        return Math.max(frameCount, 0);
    }
    static start() {
        if (rAFID !== 0)
            return;
        rAFID = requestAnimationFrame(animate);
    }
    static stop() {
        if (rAFID !== 0)
            cancelAnimationFrame(rAFID);
        frameCount = -1;
        jobs.length = 0;
        rAFID = 0;
    }
}
export class Dispatch {
    static cancelAll() {
        throw new Error(`'Dispatch#cancelAll()' API is not implemented`);
    }
    static later(numFrames, callback) {
        const job = addJob(JobType.Update, callback, false, numFrames);
        return new JobToken(job);
    }
    static now(callback) {
        const job = addJob(JobType.Immediate, callback);
        return new JobToken(job);
    }
    static onRender(callback, options) {
        const job = addJob(JobType.Render, callback, true, 0, options);
        return new JobToken(job);
    }
    static onUpdate(callback, options) {
        const job = addJob(JobType.Update, callback, true, 0, options);
        return new JobToken(job);
    }
}
export class JobToken {
    job;
    constructor(job) {
        this.job = job;
    }
    cancel() {
        this.job.cancelled = true;
    }
    pause() {
        this.job.paused = true;
    }
    resume() {
        this.job.paused = false;
    }
}
function addJob(type, callback, recurring = false, delay = 0, options) {
    let priority = options?.priority ?? 0.0;
    if (type === JobType.Render)
        priority = -(priority);
    const job = {
        jobID: nextJobID++,
        type,
        callback,
        cancelled: false,
        priority,
        recurring,
        busy: false,
        paused: false,
        timer: delay,
    };
    jobs.push(job);
    jobSortNeeded = true;
    return job;
}
function animate() {
    rAFID = requestAnimationFrame(animate);
    ++frameCount;
    Galileo.flip();
    if (jobSortNeeded) {
        jobs.sort((a, b) => {
            const recurDelta = +b.recurring - +a.recurring;
            const typeDelta = a.type - b.type;
            const priorityDelta = b.priority - a.priority;
            const fifoDelta = a.jobID - b.jobID;
            return recurDelta || typeDelta || priorityDelta || fifoDelta;
        });
        jobSortNeeded = false;
    }
    let ptr = 0;
    const initialLength = jobs.length;
    for (let i = 0; i < jobs.length; ++i) {
        const job = jobs[i];
        if ((i < initialLength || job.type === JobType.Immediate)
            && !job.busy && !job.cancelled && (job.recurring || job.timer-- <= 0)
            && !job.paused) {
            job.busy = true;
            Promise.resolve(job.callback())
                .then(() => {
                job.busy = false;
            })
                .catch(exception => {
                jobs.length = 0;
                throw exception;
            });
        }
        if (job.cancelled || (!job.recurring && job.timer < 0))
            continue;
        jobs[ptr++] = job;
    }
    jobs.length = ptr;
}

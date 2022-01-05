var jobs = [];
export default class Fido {
    static get numJobs() {
        return jobs.length;
    }
    static get progress() {
        let bytesTotal = 0;
        let bytesDone = 0;
        for (const job of jobs) {
            if (job.totalSize === null)
                continue;
            bytesTotal += job.totalSize;
            bytesDone += job.bytesDone;
        }
        return bytesTotal > 0 ? bytesDone / bytesTotal : 1.0;
    }
    static async fetch(url) {
        const response = await fetch(url);
        if (!response.ok || response.body === null)
            throw Error(`Couldn't fetch the file '${url}'. (HTTP ${response.status})`);
        const job = {
            url,
            bytesDone: 0,
            totalSize: null,
            finished: false,
        };
        jobs.push(job);
        const reader = response.body.getReader();
        const length = response.headers.get('Content-Length');
        if (length !== null)
            job.totalSize = parseInt(length, 10);
        const chunks = [];
        while (!job.finished) {
            const result = await reader.read();
            if (!result.done) {
                chunks.push(result.value);
                job.bytesDone += result.value.length;
            }
            job.finished = result.done;
        }
        let allDone = true;
        for (const job of jobs)
            allDone = allDone && job.finished;
        if (allDone)
            jobs.length = 0;
        return new Blob(chunks);
    }
    static async fetchData(url) {
        const blob = await this.fetch(url);
        return blob.arrayBuffer();
    }
    static async fetchImage(url) {
        const blob = await this.fetch(url);
        return new Promise((resolve, reject) => {
            const image = new Image();
            image.onload = () => {
                resolve(image);
                URL.revokeObjectURL(image.src);
            };
            image.onerror = () => {
                reject(new Error(`Unable to load image file '${url}'`));
                URL.revokeObjectURL(image.src);
            };
            image.src = URL.createObjectURL(blob);
        });
    }
    static async fetchJSON(url) {
        const text = await this.fetchText(url);
        return JSON.parse(text);
    }
    static async fetchText(url) {
        const blob = await this.fetch(url);
        return blob.text();
    }
}

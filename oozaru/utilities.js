export async function fetchAudioFile(url) {
    return new Promise((resolve, reject) => {
        const audio = new Audio();
        audio.onloadedmetadata = () => resolve(audio);
        audio.onerror = () => reject(new Error(`Unable to load audio file '${url}'`));
        audio.src = url;
    });
}
export async function fetchScript(url) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.onload = () => {
            resolve();
            script.remove();
        };
        script.onerror = () => {
            reject(new Error(`Unable to load JS script '${url}'`));
            script.remove();
        };
        script.src = url;
        document.head.appendChild(script);
    });
}
export function fullURL(url) {
    const anchor = document.createElement('a');
    anchor.setAttribute("href", url);
    return anchor.cloneNode(false).href;
}
export function isConstructor(func) {
    const funcProxy = new Proxy(func, { construct() { return {}; } });
    try {
        Reflect.construct(funcProxy, []);
        return true;
    }
    catch {
        return false;
    }
}

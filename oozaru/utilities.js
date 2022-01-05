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

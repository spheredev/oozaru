import Fido from './fido.js';
export class Version {
    static apiVersion = 2;
    static apiLevel = 4;
    static json;
    static async initialize() {
        this.json = await Fido.fetchJSON('oozaru.json');
    }
    static get engine() {
        return typeof this.json.name === 'string'
            ? this.json.name : "Oozaru";
    }
    static get version() {
        return typeof this.json.version === 'string'
            ? this.json.version : "WiP";
    }
}

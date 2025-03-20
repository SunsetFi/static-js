import { StaticJsUndefined } from "../types/index.js";
export default class StaticJsScope {
    constructor(_parent = null) {
        this._parent = _parent;
        this._properties = new Map();
    }
    hasProperty(name) {
        if (this._properties.has(name)) {
            return true;
        }
        if (this._parent && this._parent.hasProperty(name)) {
            return true;
        }
        return false;
    }
    getProperty(name) {
        return (this._properties.get(name)?.value ??
            this._parent?.getProperty(name) ??
            StaticJsUndefined());
    }
    declareConstProperty(name, value) {
        if (this.hasProperty(name)) {
            throw new Error(`Cannot redeclare const property ${name}`);
        }
        this._properties.set(name, { writable: false, value });
    }
    declareLetProperty(name, value) {
        if (this.hasProperty(name)) {
            throw new Error(`Cannot redeclare let property ${name}`);
        }
        this._properties.set(name, { writable: true, value });
    }
    setProperty(name, value) {
        const decl = this._properties.get(name);
        if (!decl) {
            throw new Error(`Cannot set undeclared property ${name}`);
        }
        if (!decl.writable) {
            throw new Error(`Cannot set const property ${name}`);
        }
        decl.value = value;
    }
}

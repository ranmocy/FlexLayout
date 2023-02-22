"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Attribute = void 0;
/** @internal */
class Attribute {
    constructor(name, modelName, defaultValue, alwaysWriteJson) {
        this.name = name;
        this.modelName = modelName;
        this.defaultValue = defaultValue;
        this.alwaysWriteJson = alwaysWriteJson;
        this.required = false;
        this.fixed = false;
        this.type = "any";
    }
    setType(value) {
        this.type = value;
        return this;
    }
    setRequired() {
        this.required = true;
        return this;
    }
    setFixed() {
        this.fixed = true;
        return this;
    }
}
exports.Attribute = Attribute;
Attribute.NUMBER = "number";
Attribute.STRING = "string";
Attribute.BOOLEAN = "boolean";
//# sourceMappingURL=Attribute.js.map
import StaticJsTypeSymbol from "../StaticJsTypeSymbol.js";
import { StaticJsPrimitive } from "./StaticJsPrimitive.js";
import { StaticJsValue } from "./StaticJsValue.js";

export interface StaticJsObject<T extends string = "object">
  extends StaticJsPrimitive {
  [StaticJsTypeSymbol]: T;

  hasProperty(name: string): boolean;

  getProperty(name: string): StaticJsValue;

  getIsReadOnlyProperty(name: string): boolean;

  setProperty(name: string, value: StaticJsValue): void;

  getKeys(): string[];
}
export function isStaticJsObject(value: any): value is StaticJsObject {
  if (!value || typeof value !== "object") {
    return false;
  }

  return value[StaticJsTypeSymbol] === "object";
}
export function isStaticJsObjectLike(value: any): value is StaticJsObject {
  if (!value || typeof value !== "object") {
    return false;
  }

  return ["object", "array", "function"].includes(value[StaticJsTypeSymbol]);
}

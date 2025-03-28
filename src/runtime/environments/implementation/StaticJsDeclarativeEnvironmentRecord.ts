import { StaticJsValue, StaticJsUndefined } from "../../primitives/index.js";

import StaticJsBaseEnvironment from "./StaticJsBaseEnvironmentRecord.js";
import StaticJsEnvironmentBinding from "./StaticJsEnvironmentBinding.js";
import { StaticJsEnvironmentGetBinding } from "./StaticJsEnvironmentBindingProvider.js";

export default class StaticJsDeclarativeEnvironmentRecord extends StaticJsBaseEnvironment {
  private readonly _bindings: Map<string, DeclarativeEnvironmentBinding> =
    new Map();

  createMutableBinding(name: string, deletable: boolean): void {
    if (deletable) {
      throw new Error(
        "Bindings in declarative environments cannot be deletable.",
      );
    }

    if (this._bindings.has(name)) {
      throw new Error(`Cannot create binding ${name}: Binding already exists.`);
    }

    this._bindings.set(
      name,
      new DeclarativeEnvironmentBinding(name, true, null),
    );
  }

  createImmutableBinding(name: string): void {
    if (this._bindings.has(name)) {
      throw new Error(`Cannot create binding ${name}: Binding already exists.`);
    }

    this._bindings.set(
      name,
      new DeclarativeEnvironmentBinding(name, false, null),
    );
  }

  hasThisBinding(): boolean {
    return false;
  }

  hasSuperBinding(): boolean {
    return false;
  }

  withBaseObject(): StaticJsValue {
    return StaticJsUndefined();
  }

  getThisBinding(): StaticJsValue {
    return StaticJsUndefined();
  }

  getSuperBase(): StaticJsValue {
    return StaticJsUndefined();
  }

  [StaticJsEnvironmentGetBinding](
    name: string,
  ): StaticJsEnvironmentBinding | undefined {
    return this._bindings.get(name);
  }
}

class DeclarativeEnvironmentBinding implements StaticJsEnvironmentBinding {
  private _value: StaticJsValue | null;

  constructor(
    public readonly name: string,
    public readonly isMutable: boolean,
    value: StaticJsValue | null,
  ) {
    this._value = value;
  }

  get isInitialized(): boolean {
    return this._value !== null;
  }

  get isDeletable(): boolean {
    return false;
  }

  get value(): StaticJsValue {
    if (this._value == null) {
      // TODO: Throw StaticJs ReferenceError
      throw new Error(`Cannot get value of uninitialized binding ${this.name}`);
    }

    return this._value;
  }

  set value(value: StaticJsValue) {
    if (!this.isMutable) {
      throw new Error(`Cannot set value of immutable binding ${this.name}`);
    }

    this._value = value;
  }

  initialize(value: StaticJsValue) {
    if (this.isInitialized) {
      throw new Error(
        `Cannot initialize binding ${this.name}: Already initialized`,
      );
    }

    this._value = value;
  }

  delete(): void {
    throw new Error("Cannot delete bindings in declarative environments");
  }
}

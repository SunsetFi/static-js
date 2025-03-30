import { EvaluationGenerator } from "../../../evaluator/internal.js";
import { StaticJsValue } from "../../types/interfaces/StaticJsValue.js";

import { StaticJsEnvironment } from "../interfaces/index.js";

import StaticJsBaseEnvironment from "./StaticJsBaseEnvironmentRecord.js";
import StaticJsEnvironmentBinding from "./StaticJsEnvironmentBinding.js";
import StaticJsEnvironmentBindingProvider, {
  environmentToBindingProvider,
  StaticJsEnvironmentGetBinding,
} from "./StaticJsEnvironmentBindingProvider.js";

export default class StaticJsLexicalEnvironment extends StaticJsBaseEnvironment {
  private readonly _record: StaticJsEnvironment &
    StaticJsEnvironmentBindingProvider;
  private readonly _parent:
    | (StaticJsEnvironment & StaticJsEnvironmentBindingProvider)
    | null;

  constructor(record: StaticJsEnvironment, parent: StaticJsEnvironment | null) {
    super();

    this._record = environmentToBindingProvider(record);
    this._parent = parent ? environmentToBindingProvider(parent) : null;
  }

  *createMutableBindingEvaluator(
    name: string,
    deletable: boolean,
  ): EvaluationGenerator<void> {
    yield* this._record.createMutableBindingEvaluator(name, deletable);
  }

  *createImmutableBindingEvaluator(
    name: string,
    strict: boolean,
  ): EvaluationGenerator<void> {
    yield* this._record.createImmutableBindingEvaluator(name, strict);
  }

  *hasThisBindingEvaluator(): EvaluationGenerator<boolean> {
    return yield* this._record.hasThisBindingEvaluator();
  }

  *hasSuperBindingEvaluator(): EvaluationGenerator<boolean> {
    return yield* this._record.hasSuperBindingEvaluator();
  }

  *withBaseObjectEvaluator(): EvaluationGenerator<StaticJsValue> {
    return yield* this._record.withBaseObjectEvaluator();
  }

  *getThisBindingEvaluator(): EvaluationGenerator<StaticJsValue> {
    return yield* this._record.getThisBindingEvaluator();
  }

  *getSuperBaseEvaluator(): EvaluationGenerator<StaticJsValue> {
    return yield* this._record.getSuperBaseEvaluator();
  }

  *getVarScopeEvaluator(): EvaluationGenerator<StaticJsEnvironment | null> {
    const recordScope = yield* this._record.getVarScopeEvaluator();
    if (recordScope) {
      return recordScope;
    }
    if (this._parent) {
      return yield* this._parent.getVarScopeEvaluator();
    }

    return null;
  }

  [StaticJsEnvironmentGetBinding](
    name: string,
  ): StaticJsEnvironmentBinding | undefined {
    return (
      this._record[StaticJsEnvironmentGetBinding](name) ??
      this._parent?.[StaticJsEnvironmentGetBinding](name)
    );
  }
}

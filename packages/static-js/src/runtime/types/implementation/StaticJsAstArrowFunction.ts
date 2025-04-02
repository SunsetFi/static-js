import {
  BlockStatement,
  Expression,
  Identifier,
  Pattern,
  RestElement,
} from "@babel/types";

import setLVal from "../../../evaluator/node-evaluators/LVal.js";

import {
  Completion,
  EvaluationContext,
  EvaluationGenerator,
  NormalCompletion,
  ReturnCompletion,
  ThrowCompletion,
} from "../../../evaluator/internal.js";

import StaticJsLexicalEnvironment from "../../environments/implementation/StaticJsLexicalEnvironment.js";
import StaticJsFunctionEnvironmentRecord from "../../environments/implementation/StaticJsFunctionEnvironmentRecord.js";

import { setupEnvironment } from "../../../evaluator/node-evaluators/index.js";
import { EvaluateNodeCommand } from "../../../evaluator/commands/index.js";

import StaticJsRealm from "../../realm/interfaces/StaticJsRealm.js";

import { StaticJsValue } from "../interfaces/index.js";

import StaticJsFunctionImpl from "./StaticJsFunctionImpl.js";

export type StaticJsAstArrowFunctionArgumentDeclaration =
  | Identifier
  | Pattern
  | RestElement;

export default class StaticJsAstArrowFunction extends StaticJsFunctionImpl {
  constructor(
    realm: StaticJsRealm,
    private readonly _argumentDeclarations: StaticJsAstArrowFunctionArgumentDeclaration[],
    private readonly _context: EvaluationContext,
    private readonly _body: BlockStatement | Expression,
    private readonly _bound?: StaticJsValue,
  ) {
    // FIXME: What is the name?
    super(realm, "<arrow>", (thisArg, ...args) => this._invoke(thisArg, args));
  }

  *construct(): EvaluationGenerator {
    // FIXME: Use real error.
    return ThrowCompletion(
      this.realm.types.string("Arrow functions cannot be constructed"),
    );
  }

  private *_invoke(
    thisArg: StaticJsValue,
    args: StaticJsValue[],
  ): EvaluationGenerator<Completion> {
    const functionEnv = new StaticJsLexicalEnvironment(
      this.realm,
      new StaticJsFunctionEnvironmentRecord(
        this.realm,
        this._bound ?? thisArg,
        args,
      ),
      this._context.env,
    );

    const functionContext: EvaluationContext = {
      realm: this._context.realm,
      env: functionEnv,
      label: null,
    };

    const completion = yield* this._declareArguments(args, functionContext);
    if (completion.type !== "normal") {
      return completion;
    }

    yield* setupEnvironment(this._body, functionContext);

    const evaluationCompletion = yield* EvaluateNodeCommand(
      this._body,
      functionContext,
    );

    switch (evaluationCompletion.type) {
      case "break":
      case "continue":
        throw new Error("Unexpected break/continue in function");
      case "return":
      case "throw":
        return evaluationCompletion;
      // FIXME: Functions probably shouldn't be required to return ReturnCompletions?  Should they return NormalCompletions?.
      case "normal":
        return ReturnCompletion(
          evaluationCompletion.value ?? this.realm.types.undefined,
        );
    }

    return NormalCompletion(null);
  }

  private *_declareArguments(
    args: StaticJsValue[],
    context: EvaluationContext,
  ): EvaluationGenerator {
    for (let i = 0; i < this._argumentDeclarations.length; i++) {
      const decl = this._argumentDeclarations[i];

      if (decl.type === "RestElement") {
        const value = this.realm.types.createArray(args.slice(i));
        const completion = yield* setLVal(
          decl.argument,
          value,
          context,
          function* (name, value) {
            yield* context.env.createMutableBindingEvaluator(name, false);

            // Strict mode is whatever; our binding is created above.
            yield* context.env.setMutableBindingEvaluator(name, value, true);
          },
        );

        if (completion.type !== "normal") {
          return completion;
        }

        break;
      }

      // We might not get enough arguments, so fill in the rest with undefined.
      const value: StaticJsValue = args[i] ?? this.realm.types.undefined;

      const completion = yield* setLVal(
        decl,
        value,
        context,
        function* (name, value) {
          yield* context.env.createMutableBindingEvaluator(name, false);

          // Strict mode is whatever; our binding is created above.
          yield* context.env.setMutableBindingEvaluator(name, value, true);
        },
      );

      if (completion.type !== "normal") {
        return completion;
      }
    }

    return NormalCompletion(null);
  }
}

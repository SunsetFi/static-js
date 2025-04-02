import {
  ObjectExpression,
  ObjectMethod,
  ObjectProperty,
  SpreadElement,
} from "@babel/types";

import {
  assertStaticJsValue,
  StaticJsValue,
} from "../../runtime/types/interfaces/StaticJsValue.js";

import {
  isStaticJsObject,
  StaticJsObject,
} from "../../runtime/types/interfaces/StaticJsObject.js";

import EvaluationContext from "../EvaluationContext.js";
import EvaluationGenerator from "../EvaluationGenerator.js";

import { EvaluateNodeNormalValueCommand } from "../commands/types/EvaluateNodeCommand.js";
import NormalCompletion from "../completions/NormalCompletion.js";

import createFunction from "./Function.js";
import toPropertyKey from "../../runtime/types/utils/to-property-key.js";
import { ThrowCompletion } from "../completions/index.js";

// Note: I tested the edge-case of having a computed property key that is an expression mutate the value used in the value,
// and the result is each key is computed before its property, and the next property/value pair is computed after the previous property/value pair.

export default function* objectExpressionNodeEvaluator(
  node: ObjectExpression,
  context: EvaluationContext,
): EvaluationGenerator {
  const target = context.realm.types.createObject();

  for (const property of node.properties) {
    switch (property.type) {
      case "ObjectMethod":
        yield* objectExpressionPropertyObjectMethodEvaluator(
          target,
          property,
          context,
        );
        break;
      case "ObjectProperty":
        yield* objectExpressionPropertyObjectPropertyEvaluator(
          target,
          property,
          context,
        );
        break;
      case "SpreadElement": {
        const completion =
          yield* objectExpressionPropertySpreadElementEvaluator(
            target,
            property,
            context,
          );

        if (completion.type !== "normal") {
          return completion;
        }

        break;
      }
      default: {
        // @ts-expect-error: Normally we won't get here, but include it for malformed ASTs.
        const type = property.type;
        throw new Error("Unsupported property type: " + type);
      }
    }
  }

  return NormalCompletion(target);
}

function* objectExpressionPropertyObjectMethodEvaluator(
  target: StaticJsObject,
  property: ObjectMethod,
  context: EvaluationContext,
): EvaluationGenerator<void> {
  const propertyKey = property.key;
  let propertyName: string;
  if (!property.computed && propertyKey.type === "Identifier") {
    // Identifiers evaluate to their values, but we want their name.
    propertyName = propertyKey.name;
  } else {
    const resolved = yield* EvaluateNodeNormalValueCommand(
      propertyKey,
      context,
    );

    propertyName = toPropertyKey(resolved);
  }

  const method = createFunction(propertyName, property, context);

  switch (property.kind) {
    case "method": {
      yield* target.setPropertyEvaluator(
        propertyName,
        method,
        context.realm.strict,
      );
      return;
    }
    case "get": {
      yield* target.definePropertyEvaluator(propertyName, {
        enumerable: true,
        configurable: true,
        *get() {
          const result = yield* method.call(target);
          assertStaticJsValue(result);
          return result;
        },
      });
      return;
    }
    case "set": {
      yield* target.definePropertyEvaluator(propertyName, {
        enumerable: true,
        configurable: true,
        *set(value: StaticJsValue) {
          yield* method.call(target, value);
        },
      });
      return;
    }
  }

  const kind = property.kind;
  throw new Error("Unsupported method kind: " + kind);
}

function* objectExpressionPropertyObjectPropertyEvaluator(
  target: StaticJsObject,
  property: ObjectProperty,
  context: EvaluationContext,
): EvaluationGenerator<void> {
  const propertyKey = property.key;
  let propertyName: string;
  if (!property.computed && propertyKey.type === "Identifier") {
    propertyName = propertyKey.name;
  } else if (propertyKey.type === "PrivateName") {
    throw new Error("Private fields are not supported");
  } else {
    const resolved = yield* EvaluateNodeNormalValueCommand(
      propertyKey,
      context,
    );
    propertyName = toPropertyKey(resolved);
  }

  const value = yield* EvaluateNodeNormalValueCommand(property.value, context);
  yield* target.setPropertyEvaluator(propertyName, value, context.realm.strict);
}

function* objectExpressionPropertySpreadElementEvaluator(
  target: StaticJsObject,
  property: SpreadElement,
  context: EvaluationContext,
): EvaluationGenerator {
  const value = yield* EvaluateNodeNormalValueCommand(
    property.argument,
    context,
  );
  if (!isStaticJsObject(value)) {
    // FIXME: Use real error.
    return ThrowCompletion(
      context.realm.types.string("Cannot spread non-object value"),
    );
  }

  const ownKeys = yield* value.getOwnKeysEvaluator();
  for (const key of ownKeys) {
    const propertyValue = yield* value.getPropertyEvaluator(key);
    yield* target.setPropertyEvaluator(
      key,
      propertyValue,
      context.realm.strict,
    );
  }

  return NormalCompletion(null);
}

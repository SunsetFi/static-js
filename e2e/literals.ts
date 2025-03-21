import { describe, it, expect } from "vitest";

import { evaluateExpressionString } from "static-js";

describe("E2E: Literals", () => {
  describe("Number", () => {
    it("returns a number", () => {
      const result = evaluateExpressionString("42");
      expect(result).toEqual(42);
    });
  });

  describe("String", () => {
    it("returns a string", () => {
      const result = evaluateExpressionString(`"hello"`);
      expect(result).toEqual("hello");
    });
  });

  describe("Boolean", () => {
    it("returns a boolean", () => {
      const result = evaluateExpressionString("true");
      expect(result).toEqual(true);
    });
    it("returns a false boolean", () => {
      const result = evaluateExpressionString("false");
      expect(result).toEqual(false);
    });
  });

  describe("Null", () => {
    it("returns null", () => {
      const result = evaluateExpressionString("null");
      expect(result).toEqual(null);
    });
  });

  describe("Undefined", () => {
    it("returns undefined", () => {
      const result = evaluateExpressionString("undefined");
      expect(result).toEqual(undefined);
    });
  });
});

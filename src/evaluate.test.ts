import { evaluate } from "./evaluate";
import {
  testAst1,
  testAst2,
  testResolution1,
  testResolution2,
} from "./resources/test-data";

describe("evaluate", () => {
  describe("happy paths", () => {
    it("evaluates a simple mathematical expression", () => {
      expect(evaluate(testAst1)).toStrictEqual(testResolution1);
    });

    it("evaluates an expression with a conditional", () => {
      expect(evaluate(testAst2)).toStrictEqual(testResolution2);
    });
  });
});

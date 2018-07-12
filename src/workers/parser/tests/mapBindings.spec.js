/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import mapExpressionBindings from "../mapBindings";
import cases from "jest-in-case";

const prettier = require("prettier");

function format(code) {
  return prettier.format(code, { semi: false, parser: "babylon" });
}

function excludedTest({ name, expression, bindings = [] }) {
  const safeExpression = mapExpressionBindings(expression, bindings);
  expect(format(safeExpression)).toEqual(format(expression));
}

function includedTest({ name, expression, newExpression, bindings }) {
  const safeExpression = mapExpressionBindings(expression, bindings);
  expect(format(safeExpression)).toEqual(format(newExpression));
}

describe("mapExpressionBindings", () => {
  cases("included cases", includedTest, [
    {
      name: "single declaration",
      expression: "const a = 2; let b = 3; var c = 4;",
      newExpression: "self.a = 2; self.b = 3; self.c = 4;"
    },
    {
      name: "multiple declarations",
      expression: "const a = 2, b = 3",
      newExpression: "self.a = 2; self.b = 3"
    },
    {
      name: "local bindings become assignments",
      bindings: ["a"],
      expression: `var a = 2;`,
      newExpression: `a = 2;`
    },
    {
      name: "assignments",
      expression: `a = 2;`,
      newExpression: `self.a = 2;`
    },
    {
      name: "assignments with +=",
      expression: `a += 2;`,
      newExpression: `self.a += 2;`
    }
  ]);

  cases("excluded cases", excludedTest, [
    { name: "local variables", expression: "function a() { var b = 2}" },
    { name: "functions", expression: "function a() {}" },
    { name: "classes", expression: "class a {}" },

    { name: "with", expression: "with (obj) {var a = 2;}" },
    {
      name: "with & declaration",
      expression: "with (obj) {var a = 2;}; ; var b = 3"
    },
    {
      name: "hoisting",
      expression: "{ const h = 3; }"
    },
    {
      name: "assignments",
      bindings: ["a"],
      expression: `a = 2;`
    },
    {
      name: "identifier",
      expression: `a`
    }
  ]);

  cases("cases that we should map in the future", excludedTest, [
    { name: "blocks (IF)", expression: "if (true) { var a = 3; }" },
    {
      name: "hoisting",
      expression: "{ var g = 5; }"
    },
    {
      name: "destructuring assignment",
      expression: "[a] = [3]"
    },
    {
      name: "destructuring assignment (declarations)",
      expression: "[a] = [3]; var b = 4"
    },
    {
      name: "for loops bindings",
      expression: "for (let foo = 4; false;){}"
    },
    {
      name: "destructuring (objects)",
      expression: "const { a } = {}; "
    },
    {
      name: "destructuring (arrays)",
      expression: " var [a, ...foo] = []; "
    },
    {
      name: "destructuring (declarations)",
      expression: "var {d,e} = {}, {f} = {}; "
    },
    {
      name: "destructuring & declaration",
      expression: "const { a } = {}; var b = 3"
    }
  ]);

  cases("cases that we shouldn't map in the future", includedTest, [
    {
      name: "window properties",
      expression: "var innerHeight = 3; var location = 5;",
      newExpression: "self.innerHeight = 3; self.location = 5;"
    },
    {
      name: "self declaration",
      expression: "var self = 3",
      newExpression: "self.self = 3"
    },
    {
      name: "self assignment",
      expression: "self = 3",
      newExpression: "self.self = 3"
    }
  ]);
});

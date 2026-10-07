import test from "node:test";
import assert from "node:assert/strict";
import { validateName, isValidCoordinates } from "../../shared/validation.js";

test("names reject symbols, digits, whitespace-only and non-string inputs", () => {
  for (const name of ["!@#$%!!%^", "Jane!", "User123", "  ", "--", null, {}, "A", "a".repeat(51)]) {
    assert.ok(validateName(name), `Expected rejection for ${JSON.stringify(name)}`);
  }
});

test("names support international letters and normal name punctuation", () => {
  for (const name of ["  Jane  ", "O'Connor", "Anne-Marie", "D’Arcy", "Nguyễn", "李明", "Jose\u0301", "Mary Jane"]) {
    assert.equal(validateName(name), "", name);
  }
});

test("map coordinates accept zero and geographic boundaries", () => {
  for (const point of [{ latitude: 0, longitude: 0 }, { latitude: -90, longitude: 180 }, { latitude: 90, longitude: -180 }, { latitude: -32.892, longitude: 151.704 }]) {
    assert.equal(isValidCoordinates(point), true);
  }
});

test("map coordinates reject invalid types, missing values and out-of-range numbers", () => {
  for (const point of [null, [], {}, "-32,151", { latitude: "0", longitude: 0 }, { latitude: 91, longitude: 0 }, { latitude: 0, longitude: -181 }, { latitude: NaN, longitude: 0 }, { latitude: 0, longitude: Infinity }]) {
    assert.equal(isValidCoordinates(point), false);
  }
});

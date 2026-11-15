import { describe, it, expect } from "vitest";
import { formatDateRelative, getCountdown, getDate, getTime } from "../src/index.js";

describe("getDate", () => {
  it("transforms init values to a date", () => {
    const inputString = "2020 1 11"; // 1578697200000
    const inputNumber = 1641408329089;
    const inputDate = new Date();

    expect(getDate(inputString)).toBeInstanceOf(Date);
    // assert.is(getDate(inputString).getTime(), 1578697200000);
    expect(getDate(inputNumber)).toBeInstanceOf(Date);
    expect(getDate(inputNumber).getTime()).toBe(1641408329089);
    expect(getDate(inputDate)).toBe(inputDate);
  });
});

describe("getTime", () => {
  it("transforms init values to a timestamp", () => {
    const inputString = "2020 1 11"; // 1578697200000
    const inputNumber = 1641408329089;
    const inputDate = new Date("2020 1 11");

    expect(typeof getTime(inputString)).toBe("number");
    expect(getTime(inputNumber)).toBe(1641408329089);
    expect(typeof getTime(inputDate)).toBe("number");
  });
});

describe("getCountdown", () => {
  it("returns the milliseconds left after the whole seconds", () => {
    expect(getCountdown(999)).toEqual({
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      milliseconds: 999,
    });
    expect(getCountdown(61_250)).toEqual({
      days: 0,
      hours: 0,
      minutes: 1,
      seconds: 1,
      milliseconds: 250,
    });
  });
});

describe("formatDateRelative", () => {
  it("returns justNow for differences that round to 0 seconds", () => {
    expect(formatDateRelative(0)).toBe("just now");
    expect(formatDateRelative(400)).toBe("just now");
    expect(formatDateRelative(-400)).toBe("just now");
    expect(formatDateRelative(0, { justNow: "now" })).toBe("now");
  });

  it("still formats differences of half a second or more", () => {
    expect(formatDateRelative(500)).toBe("in 1 second");
    expect(formatDateRelative(-2000)).toBe("2 seconds ago");
  });
});

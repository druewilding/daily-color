import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { contrastColor, getDailyColor, getDailyPalette, getPalette } from "../index.js";
import { contrastRatio } from "../palette.js";

const HEX = /^#[0-9a-f]{6}$/;
const cli = (...args) => spawnSync("node", ["bin/dailycolor.js", ...args], { encoding: "utf8" });

// Every day from the start of 2026 to the end of 2027
function* days() {
  for (
    let d = new Date(2026, 0, 1);
    d.getFullYear() < 2028;
    d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)
  ) {
    yield d;
  }
}

test("a day's color never changes", () => {
  assert.equal(getDailyColor(new Date(2024, 10, 9)), "#7ad2f9");
});

test("the palette starts with the day's color", () => {
  const date = new Date(2024, 10, 9);
  assert.equal(getDailyPalette(date).color, getDailyColor(date));
  assert.deepEqual(getDailyPalette(date), getPalette("#7ad2f9"));
});

test("every palette color is a hex code, every day", () => {
  for (const day of days()) {
    for (const value of Object.values(getDailyPalette(day)).flat()) assert.match(value, HEX);
  }
});

test("the palette has the right number of each", () => {
  const p = getPalette("#3fa2c1");
  assert.equal(p.splitComplementary.length, 2);
  assert.equal(p.analogous.length, 2);
  assert.equal(p.triadic.length, 2);
  assert.equal(p.tetradic.length, 3);
  assert.equal(p.tetradic[1], p.complementary);
});

test("the complement of a complement is close to where it started", () => {
  const back = getPalette(getPalette("#18c141").complementary).complementary;
  const distance = Math.max(
    ...[0, 1, 2].map((i) => Math.abs(parseInt(back.substr(1 + i * 2, 2), 16) - parseInt("18c141".substr(i * 2, 2), 16)))
  );
  assert.ok(distance <= 2, `${back} is too far from #18c141`);
});

// How far apart the red, green and blue are: 0 for a gray
const spread = (hex) => {
  const [r, g, b] = hex.match(/\w\w/g).map((h) => parseInt(h, 16));
  return Math.max(r, g, b) - Math.min(r, g, b);
};

test("gray days still get colors to go with them", () => {
  for (const gray of ["#888888", "#8e918d", "#333333", "#cccccc"]) {
    const p = getPalette(gray);
    assert.equal(p.color, gray);
    for (const partner of [p.complementary, ...p.triadic, ...p.analogous]) {
      assert.ok(spread(partner) >= 25, `${partner} goes with ${gray} but is still gray`);
    }
  }
});

test("black and white stay black and white", () => {
  assert.equal(getPalette("#ffffff").complementary, "#ffffff");
  assert.equal(getPalette("#000000").complementary, "#000000");
});

test("strong colors keep their own strength", () => {
  // #18c141 is stronger than the floor, so its partners keep its strength
  assert.equal(getPalette("#18c141").complementary, "#e068e6");
});

test("the contrast color is readable, every day", () => {
  for (const day of days()) {
    const hex = getDailyColor(day);
    assert.ok(contrastRatio(hex, contrastColor(hex)) >= 4.5, `${hex} on ${day.toDateString()}`);
  }
  assert.equal(contrastColor("#ffffff"), "#000000");
  assert.equal(contrastColor("#000000"), "#ffffff");
});

test("the CLI prints today's color", () => {
  assert.equal(execFileSync("node", ["bin/dailycolor.js"], { encoding: "utf8" }).trim(), getDailyColor());
});

test("the CLI prints the colors that go with it", () => {
  const p = getDailyPalette(new Date(2024, 10, 9));
  assert.equal(cli("complementary", "--date", "2024-11-09").stdout.trim(), p.complementary);
  assert.equal(cli("triadic", "--date=2024-11-09").stdout.trim(), p.triadic.join(" "));
  assert.equal(cli("split-complementary", "-d", "2024-11-09").stdout.trim(), p.splitComplementary.join(" "));
});

test("the CLI labels them all", () => {
  const lines = cli("all", "--date", "2024-11-09").stdout.trim().split("\n");
  assert.equal(lines.length, 7);
  assert.equal(lines[0], "color                #7ad2f9");
});

test("the CLI has --help and --version", () => {
  assert.match(cli("--help").stdout, /^Usage: dailycolor/);
  assert.match(cli("-h").stdout, /^Usage: dailycolor/);
  const { version } = JSON.parse(readFileSync("package.json", "utf8"));
  assert.equal(cli("--version").stdout.trim(), version);
  assert.equal(cli("-v").stdout.trim(), version);
});

test("the CLI explains what went wrong", () => {
  const unknown = cli("purple");
  assert.equal(unknown.status, 1);
  assert.match(unknown.stderr, /no color called "purple"/);
  const badDate = cli("--date", "2027-02-30");
  assert.equal(badDate.status, 1);
  assert.match(badDate.stderr, /isn't a date/);
});

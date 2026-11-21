import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";

import * as dailyColor from "../index.js";

const { contrastColor, contrastRatio, getDailyColor, getDailyPalette, getPalette, oklch, readableOn, toOklch } =
  dailyColor;

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

test("OKLCH there and back", () => {
  for (const hex of ["#18c141", "#1935a4", "#7ad2f9", "#8e918d", "#ff0000"]) {
    const { l, c, h } = toOklch(hex);
    assert.equal(oklch(l, c, h), hex);
  }
});

test("oklch() fits any color into sRGB", () => {
  assert.match(oklch(0.7, 0.4, 30), HEX); // far too much chroma
  assert.equal(oklch(1.2, 0.1, 30), "#ffffff"); // lighter than white
  assert.equal(oklch(0.5, 0.1, -30), oklch(0.5, 0.1, 330)); // hue goes round
});

test("contrastRatio runs from 1 to 21", () => {
  assert.equal(contrastRatio("#000000", "#ffffff"), 21);
  assert.equal(contrastRatio("#18c141", "#18c141"), 1);
});

test("readableOn makes every day's colors readable, on light and dark", () => {
  for (const background of ["#ffffff", "#fbfaf9", "#181614", "#000000"]) {
    for (const day of days()) {
      const p = getDailyPalette(day);
      for (const color of [p.color, p.complementary, ...p.triadic]) {
        const readable = readableOn(color, background);
        assert.ok(contrastRatio(readable, background) >= 4.5, `${color} -> ${readable} on ${background}`);
      }
    }
  }
});

test("readableOn keeps the hue and leaves readable colors alone", () => {
  assert.equal(readableOn("#1935a4", "#ffffff"), "#1935a4");
  const readable = readableOn("#7ad2f9", "#ffffff");
  assert.notEqual(readable, "#7ad2f9");
  assert.ok(Math.abs(toOklch(readable).h - toOklch("#7ad2f9").h) < 5);
  assert.ok(toOklch(readable).l < toOklch("#7ad2f9").l); // darker, on white
  assert.ok(toOklch(readableOn("#1935a4", "#000000")).l > toOklch("#1935a4").l); // lighter, on black
});

test("readableOn takes a stronger OKLCH color than fits at the start", () => {
  const vivid = readableOn({ l: 0.9, c: 0.25, h: 30 }, "#ffffff");
  const fromHex = readableOn(oklch(0.9, 0.25, 30), "#ffffff");
  assert.ok(contrastRatio(vivid, "#ffffff") >= 4.5);
  assert.ok(toOklch(vivid).c > toOklch(fromHex).c);
});

test("readableOn can ask for more contrast", () => {
  assert.ok(contrastRatio(readableOn("#18c141", "#ffffff", 7), "#ffffff") >= 7);
});

test("the plain-script build has everything the module has", () => {
  const sandbox = {};
  sandbox.globalThis = sandbox;
  vm.runInNewContext(readFileSync("dist/daily-color.umd.js", "utf8"), sandbox);
  assert.deepEqual(Object.keys(sandbox.DailyColor).sort(), Object.keys(dailyColor).sort());
  assert.equal(sandbox.DailyColor.getDailyColor(new Date(2024, 10, 9)), "#7ad2f9");
});

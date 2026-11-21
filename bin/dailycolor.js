#!/usr/bin/env node

import { readFileSync } from "node:fs";

import { getDailyPalette } from "../index.js";

const HELP = `Usage: dailycolor [colors...] [--date YYYY-MM-DD]

Prints today's color as a hex code. Name other colors to print the ones that
go with it instead.

Colors:
  color                 the day's color (the default)
  contrast              black or white, whichever reads better on it
  complementary         opposite on the color wheel
  split-complementary   either side of the complement
  analogous             next door on the color wheel
  triadic               a third of the way round each way
  tetradic              a square round the color wheel
  all                   all of the above, labeled

Options:
  -d, --date <date>     another day, like 2027-01-01
  -h, --help            show this help
  -v, --version         show the version number

Examples:
  dailycolor
  dailycolor complementary
  dailycolor all --date 2027-01-01`;

// "split-complementary" on the command line, splitComplementary in the palette
const NAMES = {
  color: "color",
  contrast: "contrast",
  complementary: "complementary",
  "split-complementary": "splitComplementary",
  analogous: "analogous",
  triadic: "triadic",
  tetradic: "tetradic",
};

function fail(message) {
  console.error(`dailycolor: ${message}\nRun "dailycolor --help" to see what it can do.`);
  process.exit(1);
}

const args = process.argv.slice(2);
const wanted = [];
let date = new Date();

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === "-h" || arg === "--help") {
    console.log(HELP);
    process.exit(0);
  } else if (arg === "-v" || arg === "--version") {
    const { version } = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
    console.log(version);
    process.exit(0);
  } else if (arg === "-d" || arg === "--date" || arg.startsWith("--date=")) {
    const value = arg.startsWith("--date=") ? arg.slice(7) : args[++i];
    date = parseDate(value);
  } else if (arg === "all") {
    wanted.push(...Object.keys(NAMES));
  } else if (NAMES[arg]) {
    wanted.push(arg);
  } else {
    fail(`there's no color called "${arg}"`);
  }
}

// A day where you are, not UTC midnight
function parseDate(value) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || "");
  const day = m && new Date(+m[1], +m[2] - 1, +m[3]);
  if (!day || day.getMonth() !== +m[2] - 1) fail(`"${value ?? ""}" isn't a date like 2027-01-01`);
  return day;
}

const palette = getDailyPalette(date);
const show = (name) => [palette[NAMES[name]]].flat().join(" ");

if (wanted.length === 0) {
  console.log(palette.color);
} else if (wanted.length === 1) {
  console.log(show(wanted[0]));
} else {
  // Several colors get a label each, lined up
  const width = Math.max(...wanted.map((name) => name.length));
  for (const name of new Set(wanted)) console.log(`${name.padEnd(width)}  ${show(name)}`);
}

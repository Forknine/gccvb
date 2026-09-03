import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

const repoRoot = process.cwd();
const tempDir = await mkdtemp(path.join(tmpdir(), "gccvb-calendar-"));

try {
  const calendarSource = await readFile(path.join(repoRoot, "src/backend/schedule-calendar.js"), "utf8");
  await writeFile(path.join(tempDir, "schedule-calendar.mjs"), calendarSource, "utf8");

  const { buildTeamCalendar, matchesCalendarFilters } = await import(
    pathToFileURL(path.join(tempDir, "schedule-calendar.mjs"))
  );

  const schedule = {
    games: [
      {
        id: "monday-pink-green",
        dateISO: "2026-09-28",
        time: "7:00 pm",
        displayTeams: "Monday Pink vs Green",
        homeTeam: "Pink",
        awayTeam: "Green",
        league: "Monday",
        division: "",
        location: "CCVI",
        mapUrl: "https://maps.example/ccvi"
      },
      {
        id: "wed-pink-green",
        dateISO: "2026-09-30",
        time: "8:30 pm",
        displayTeams: "Wed Uber Pink vs Green",
        homeTeam: "Pink",
        awayTeam: "Green",
        league: "Wed Uber",
        division: "",
        location: "John Galt",
        mapUrl: ""
      },
      {
        id: "monday-blue-red",
        dateISO: "2026-09-28",
        time: "7:00 pm",
        displayTeams: "Monday Blue vs Red",
        homeTeam: "Blue",
        awayTeam: "Red",
        league: "Monday",
        division: "",
        location: "CCVI",
        mapUrl: ""
      }
    ]
  };

  assert.equal(matchesCalendarFilters(schedule.games[0], { league: "Monday", team: "Pink" }), true);
  assert.equal(matchesCalendarFilters(schedule.games[1], { league: "Monday", team: "Pink" }), false);
  assert.equal(matchesCalendarFilters(schedule.games[2], { league: "Monday", team: "Pink" }), false);

  const calendar = buildTeamCalendar(schedule, { league: "Monday", team: "Pink" });

  assert.match(calendar, /^BEGIN:VCALENDAR\r\n/);
  assert.match(calendar, /X-WR-CALNAME:GCCVB Monday Pink/);
  assert.match(calendar, /REFRESH-INTERVAL;VALUE=DURATION:PT6H/);
  assert.match(calendar, /DTSTART;TZID=America\/Toronto:20260928T190000/);
  assert.match(calendar, /DTEND;TZID=America\/Toronto:20260928T203000/);
  assert.match(calendar, /SUMMARY:Monday Pink vs Green/);
  assert.doesNotMatch(calendar, /Wed Uber Pink vs Green/);
  assert.doesNotMatch(calendar, /Monday Blue vs Red/);
  assert.match(calendar, /\r\nEND:VCALENDAR\r\n$/);
} finally {
  await rm(tempDir, { recursive: true, force: true });
}

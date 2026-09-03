import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

const repoRoot = process.cwd();
const tempDir = await mkdtemp(path.join(tmpdir(), "gccvb-schedule-"));

try {
  const configSource = await readFile(path.join(repoRoot, "src/backend/schedule-config.js"), "utf8");
  const normalizerSource = await readFile(path.join(repoRoot, "src/backend/schedule-normalizer.js"), "utf8");

  await writeFile(path.join(tempDir, "schedule-config.mjs"), configSource, "utf8");
  await writeFile(
    path.join(tempDir, "schedule-normalizer.mjs"),
    normalizerSource.replace('"backend/schedule-config"', '"./schedule-config.mjs"'),
    "utf8"
  );

  const { normalizeScheduleRows } = await import(pathToFileURL(path.join(tempDir, "schedule-normalizer.mjs")));

  const rows = [
    ["Date", "Time", "Teams", "Location", "Results", "League", "Division"],
    ["2026-09-10", "7:00 PM", "Wednesday Red vs Blue", "CCVI", "red,blue", "Wednesday", "A"],
    ["", "", "", "", "", "", ""],
    ["2026-09-09", "8:00 PM", "Monday Aqua vs Pink", "Unknown Gym", "", "Monday", "B"],
    ["not a date", "9:00 PM", "Wednesday Green vs Yellow", "Rickson", "", "Wednesday", "A"],
    ["2026-09-11", "7:30 PM", "", "CCVI", "", "", ""]
  ];

  const result = normalizeScheduleRows(rows);

  assert.equal(result.games.length, 3, "blank rows and malformed rows should be ignored");
  assert.equal(result.games[0].teams, "Monday Aqua vs Pink", "valid dated games should sort chronologically");
  assert.equal(result.games[0].dateISO, "2026-09-09", "ISO dates should not shift to the previous local day");
  assert.equal(result.games[0].league, "Monday", "league should be preserved from the sheet when present");
  assert.equal(result.games[0].mapUrl, "", "unknown venues should not create map links");
  assert.ok(result.games[1].mapUrl.includes("maps.app.goo.gl"), "known venues should create map links");
  assert.equal(result.games[1].homeTeam, "Wednesday Red", "home team should keep its league/night prefix");
  assert.equal(result.games[1].awayTeam, "Wednesday Blue", "away team should inherit the league/night prefix");
  assert.equal(result.games[1].results[0].label, "Red", "result tokens should be normalized");
  assert.equal(result.games[2].dateISO, "", "invalid dates should remain renderable without ISO dates");
  assert.ok(result.warnings.length >= 2, "malformed rows should be reported as warnings");

  const derived = normalizeScheduleRows([
    ["2026-09-14", "7:00 PM", "Monday Green vs Yellow", "CCVI", "", "", ""]
  ]);

  assert.equal(derived.games[0].league, "Monday", "league should be derived from matchup text when the sheet omits it");
  assert.equal(derived.games[0].homeTeam, "Monday Green", "derived team names should stay unique across leagues");
  assert.equal(derived.games[0].awayTeam, "Monday Yellow", "away teams should inherit derived league names");
} finally {
  await rm(tempDir, { recursive: true, force: true });
}

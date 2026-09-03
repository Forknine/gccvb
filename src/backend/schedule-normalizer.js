import { RESULT_COLOR_MAP, VENUE_MAP_URLS } from "backend/schedule-config";

const WED_COMP_TEAMS = new Set(["red", "orange", "yellow", "green", "blue", "purple"]);

export function normalizeScheduleRows(rows) {
  const sourceRows = Array.isArray(rows) ? rows : [];
  const dataRows = hasHeaderRow(sourceRows) ? sourceRows.slice(1) : sourceRows;
  const warnings = [];
  const games = [];

  dataRows.forEach((row, index) => {
    if (isBlankRow(row)) {
      return;
    }

    const rowNumber = index + (hasHeaderRow(sourceRows) ? 2 : 1);
    const normalized = normalizeScheduleRow(row, rowNumber);

    if (normalized.warning) {
      warnings.push(normalized.warning);
    }

    if (normalized.game) {
      games.push(normalized.game);
    }
  });

  games.sort(compareGames);

  return {
    games,
    warnings,
    generatedAt: new Date().toISOString()
  };
}

export function normalizeScheduleRow(row, rowNumber) {
  const cells = Array.isArray(row) ? row : [];
  const date = cleanText(cells[0]);
  const time = cleanText(cells[1]);
  const teams = cleanText(cells[2]);
  const location = cleanText(cells[3]);
  const results = normalizeResults(cells[4]);
  const teamParts = splitTeams(teams);
  const league = teamParts.league || normalizeLeagueName(cells[5]);
  const division = cleanText(cells[6]);
  const parsedDate = parseDate(date);
  const parsedTime = parseTime(time);
  const dateISO = parsedDate ? formatDateISO(parsedDate) : "";
  const startTimestamp = parsedDate ? buildTimestamp(parsedDate, parsedTime) : null;
  const status = getStatus(results, startTimestamp);

  const missingRequired = [];
  if (!date) missingRequired.push("date");
  if (!time) missingRequired.push("time");
  if (!teams) missingRequired.push("teams");

  const warningParts = [];
  if (missingRequired.length > 0) {
    warningParts.push(`missing ${missingRequired.join(", ")}`);
  }
  if (date && !parsedDate) {
    warningParts.push(`invalid date "${date}"`);
  }

  if (missingRequired.includes("date") || missingRequired.includes("teams")) {
    return {
      game: null,
      warning: `Schedule row ${rowNumber} skipped: ${warningParts.join("; ")}.`
    };
  }

  return {
    game: {
      id: makeGameId(dateISO || date, time, teams, location, rowNumber),
      date,
      dateISO,
      time,
      startTimestamp,
      teams,
      homeTeam: teamParts.homeTeam,
      awayTeam: teamParts.awayTeam,
      location,
      mapUrl: VENUE_MAP_URLS[location] || "",
      results,
      league,
      division,
      status
    },
    warning: warningParts.length > 0 ? `Schedule row ${rowNumber}: ${warningParts.join("; ")}.` : ""
  };
}

export function isBlankRow(row) {
  return !Array.isArray(row) || row.every((cell) => cleanText(cell) === "");
}

export function normalizeResults(value) {
  const raw = cleanText(value);
  if (!raw) {
    return [];
  }

  return raw
    .split(",")
    .map((item) => cleanText(item).toLowerCase())
    .filter(Boolean)
    .map((token) => {
      const mapped = RESULT_COLOR_MAP[token];
      if (mapped) {
        return {
          token,
          label: mapped.label,
          color: mapped.color,
          known: true
        };
      }

      return {
        token,
        label: token,
        color: "",
        known: false
      };
    });
}

function hasHeaderRow(rows) {
  if (!Array.isArray(rows) || rows.length === 0 || !Array.isArray(rows[0])) {
    return false;
  }

  const firstCell = cleanText(rows[0][0]).toLowerCase();
  const secondCell = cleanText(rows[0][1]).toLowerCase();
  const thirdCell = cleanText(rows[0][2]).toLowerCase();

  return firstCell === "date" || secondCell === "time" || thirdCell === "teams";
}

function cleanText(value) {
  if (value === undefined || value === null) {
    return "";
  }

  return String(value).replace(/\s+/g, " ").trim();
}

function parseDate(value) {
  const text = cleanText(value);
  if (!text) {
    return null;
  }

  const isoParts = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoParts) {
    return buildLocalDate(Number(isoParts[1]), Number(isoParts[2]), Number(isoParts[3]));
  }

  const direct = new Date(text);
  if (!Number.isNaN(direct.getTime())) {
    return new Date(direct.getFullYear(), direct.getMonth(), direct.getDate());
  }

  const parts = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (!parts) {
    return null;
  }

  const day = Number(parts[2]);
  const year = Number(parts[3].length === 2 ? `20${parts[3]}` : parts[3]);
  return buildLocalDate(year, Number(parts[1]), day);
}

function parseTime(value) {
  const text = cleanText(value);
  if (!text) {
    return null;
  }

  const match = text.match(/^(\d{1,2})(?::(\d{2}))?\s*([ap]m)?$/i);
  if (!match) {
    return null;
  }

  let hours = Number(match[1]);
  const minutes = Number(match[2] || 0);
  const meridiem = (match[3] || "").toLowerCase();

  if (meridiem === "pm" && hours < 12) {
    hours += 12;
  }
  if (meridiem === "am" && hours === 12) {
    hours = 0;
  }

  return { hours, minutes };
}

function buildTimestamp(date, time) {
  const hours = time ? time.hours : 23;
  const minutes = time ? time.minutes : 59;
  const value = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hours, minutes);

  return Number.isNaN(value.getTime()) ? null : value.getTime();
}

function splitTeams(teams) {
  const parts = cleanText(teams).split(/\s+vs\.?\s+/i);
  const league = deriveLeague(teams, parts);

  if (parts.length !== 2) {
    return {
      homeTeam: "",
      awayTeam: "",
      league
    };
  }

  return {
    homeTeam: stripLeaguePrefix(parts[0]),
    awayTeam: stripLeaguePrefix(parts[1]),
    league
  };
}

function formatDateISO(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function buildLocalDate(year, month, day) {
  const parsed = new Date(year, month - 1, day);

  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return null;
  }

  return parsed;
}

function deriveLeague(value, parts) {
  const text = cleanText(value);
  if (/^Monday\b/i.test(text)) {
    return "Monday";
  }

  if (/^Wednesday\b/i.test(text)) {
    const teams = parts.length === 2 ? parts.map(stripLeaguePrefix) : [stripLeaguePrefix(text)];
    const hasCompTeam = teams.some((team) => WED_COMP_TEAMS.has(team.toLowerCase()));

    return hasCompTeam ? "Wed Comp" : "Wed Uber";
  }

  return "";
}

function normalizeLeagueName(value) {
  const text = cleanText(value);
  if (/^mon(day)?$/i.test(text)) return "Monday";
  if (/^wed(nesday)?\s*comp$/i.test(text)) return "Wed Comp";
  if (/^wed(nesday)?\s*uber$/i.test(text)) return "Wed Uber";
  if (/^wed(nesday)?$/i.test(text)) return "Wed Comp";
  return text;
}

function stripLeaguePrefix(value) {
  return cleanText(value).replace(/^(Monday|Wednesday|Wed Comp|Wed Uber)\s+/i, "");
}

function getStatus(results, startTimestamp) {
  if (Array.isArray(results) && results.length > 0) {
    return "completed";
  }

  if (startTimestamp && startTimestamp < Date.now()) {
    return "pending";
  }

  return "upcoming";
}

function compareGames(first, second) {
  const firstTime = first.startTimestamp === null ? Number.MAX_SAFE_INTEGER : first.startTimestamp;
  const secondTime = second.startTimestamp === null ? Number.MAX_SAFE_INTEGER : second.startTimestamp;

  if (firstTime !== secondTime) {
    return firstTime - secondTime;
  }

  return first.teams.localeCompare(second.teams);
}

function makeGameId(date, time, teams, location, rowNumber) {
  return [date, time, teams, location, rowNumber]
    .join("-")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

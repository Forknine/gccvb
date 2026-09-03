const DEFAULT_TIME_ZONE = "America/Toronto";
const DEFAULT_DURATION_MINUTES = 90;
const SITE_URL = "https://www.gccvb.org";

export function buildTeamCalendar(schedule, filters = {}) {
  const games = Array.isArray(schedule?.games) ? schedule.games : [];
  const team = cleanText(filters.team);
  const league = cleanText(filters.league);
  const calendarName = getCalendarName(team, league);
  const matchingGames = games.filter((game) => matchesCalendarFilters(game, { team, league }));
  const now = formatUtcDateTime(new Date());

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//GCCVB//Schedule//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeIcsText(calendarName)}`,
    `X-WR-TIMEZONE:${DEFAULT_TIME_ZONE}`,
    "REFRESH-INTERVAL;VALUE=DURATION:PT6H",
    "X-PUBLISHED-TTL:PT6H",
    ...matchingGames.flatMap((game) => buildEvent(game, now)),
    "END:VCALENDAR",
    ""
  ].join("\r\n");
}

export function matchesCalendarFilters(game, filters = {}) {
  const team = normalize(filters.team);
  const league = normalize(filters.league);

  if (league && normalize(game.league) !== league) {
    return false;
  }

  if (!team) {
    return true;
  }

  return normalize(game.homeTeam) === team || normalize(game.awayTeam) === team;
}

function buildEvent(game, now) {
  const start = getEventStart(game);
  if (!start) {
    return [];
  }

  const end = new Date(start.date.getTime() + DEFAULT_DURATION_MINUTES * 60 * 1000);
  const summary = game.displayTeams || game.teams || "GCCVB Game";
  const location = game.location || "";
  const description = [
    summary,
    game.league ? `League: ${game.league}` : "",
    game.division ? `Division: ${game.division}` : "",
    game.mapUrl ? `Map: ${game.mapUrl}` : "",
    `${SITE_URL}/schedule`
  ].filter(Boolean).join("\\n");

  return [
    "BEGIN:VEVENT",
    `UID:${escapeIcsText(game.id || `${start.localDateTime}-${summary}`)}@gccvb.org`,
    `DTSTAMP:${now}`,
    `DTSTART;TZID=${DEFAULT_TIME_ZONE}:${start.localDateTime}`,
    `DTEND;TZID=${DEFAULT_TIME_ZONE}:${formatLocalDateTime(end)}`,
    `SUMMARY:${escapeIcsText(summary)}`,
    location ? `LOCATION:${escapeIcsText(location)}` : "",
    `DESCRIPTION:${escapeIcsText(description)}`,
    "END:VEVENT"
  ].filter(Boolean);
}

function getEventStart(game) {
  const dateParts = String(game.dateISO || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!dateParts) {
    return null;
  }

  const timeParts = cleanText(game.time).match(/^(\d{1,2})(?::(\d{2}))?\s*([ap]m)?$/i);
  if (!timeParts) {
    return null;
  }

  let hours = Number(timeParts[1]);
  const minutes = Number(timeParts[2] || 0);
  const meridiem = cleanText(timeParts[3]).toLowerCase();

  if (meridiem === "pm" && hours < 12) {
    hours += 12;
  }
  if (meridiem === "am" && hours === 12) {
    hours = 0;
  }

  const date = new Date(
    Number(dateParts[1]),
    Number(dateParts[2]) - 1,
    Number(dateParts[3]),
    hours,
    minutes
  );

  return {
    date,
    localDateTime: [
      dateParts[1],
      dateParts[2],
      dateParts[3],
      "T",
      String(hours).padStart(2, "0"),
      String(minutes).padStart(2, "0"),
      "00"
    ].join("")
  };
}

function getCalendarName(team, league) {
  if (team && league) {
    return `GCCVB ${league} ${team}`;
  }
  if (team) {
    return `GCCVB ${team}`;
  }
  if (league) {
    return `GCCVB ${league}`;
  }

  return "GCCVB Schedule";
}

function formatLocalDateTime(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
    "T",
    String(date.getHours()).padStart(2, "0"),
    String(date.getMinutes()).padStart(2, "0"),
    "00"
  ].join("");
}

function formatUtcDateTime(date) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function escapeIcsText(value) {
  return cleanText(value)
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

function cleanText(value) {
  if (value === undefined || value === null) {
    return "";
  }

  return String(value).replace(/\s+/g, " ").trim();
}

function normalize(value) {
  return cleanText(value).toLowerCase();
}

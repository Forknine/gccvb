import { ok, serverError } from "wix-http-functions";
import { buildTeamCalendar } from "backend/schedule-calendar";
import { getScheduleData } from "backend/schedule-service.jsw";

const JSON_HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

const CALENDAR_HEADERS = {
  "Content-Type": "text/calendar; charset=utf-8",
  "Content-Disposition": "attachment; filename=gccvb-schedule.ics",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS"
};

export function options_schedule() {
  return ok({
    headers: JSON_HEADERS,
    body: ""
  });
}

export async function get_schedule() {
  try {
    const schedule = await getScheduleData();

    return ok({
      headers: JSON_HEADERS,
      body: JSON.stringify(schedule)
    });
  } catch (error) {
    console.error("Schedule API failed:", error);

    return serverError({
      headers: JSON_HEADERS,
      body: JSON.stringify({
        message: "Unable to load the schedule."
      })
    });
  }
}

export function options_calendar() {
  return ok({
    headers: CALENDAR_HEADERS,
    body: ""
  });
}

export async function get_calendar(request) {
  try {
    const schedule = await getScheduleData();
    const calendar = buildTeamCalendar(schedule, request?.query || {});

    return ok({
      headers: CALENDAR_HEADERS,
      body: calendar
    });
  } catch (error) {
    console.error("Schedule calendar failed:", error);

    return serverError({
      headers: JSON_HEADERS,
      body: JSON.stringify({
        message: "Unable to load the calendar."
      })
    });
  }
}

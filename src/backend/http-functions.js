import { ok, serverError } from "wix-http-functions";
import { getScheduleData } from "backend/schedule-service.jsw";

const JSON_HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
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

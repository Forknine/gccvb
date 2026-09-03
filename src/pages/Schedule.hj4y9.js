import wixLocationFrontend from "wix-location-frontend";
import { getScheduleData } from "backend/schedule-service.jsw";

const SCHEDULE_COMPONENT_ID = "#scheduleApp";
let scheduleComponent;
let scheduleDataPromise;
let hasSentSchedule = false;

$w.onReady(function () {
  try {
    scheduleComponent = $w(SCHEDULE_COMPONENT_ID);
  } catch (error) {
    console.error(`Add an HTML Component with ID ${SCHEDULE_COMPONENT_ID} to use the responsive schedule.`, error);
    return;
  }

  scheduleComponent.onMessage(handleScheduleMessage);
  sendLoadingState();
});

function handleScheduleMessage(event) {
  const message = event.data || {};

  if (message.type === "schedule:ready") {
    loadAndSendSchedule();
    return;
  }

  if (message.type === "schedule:retry") {
    hasSentSchedule = false;
    scheduleDataPromise = null;
    sendLoadingState();
    loadAndSendSchedule();
    return;
  }

  if (message.type === "schedule:filtersChanged") {
    syncFilterQuery(message.filters || {});
  }
}

async function loadAndSendSchedule() {
  if (hasSentSchedule) {
    return;
  }

  try {
    scheduleDataPromise = scheduleDataPromise || getScheduleData();
    const schedule = await scheduleDataPromise;
    hasSentSchedule = true;

    scheduleComponent.postMessage({
      type: "schedule:data",
      games: schedule.games,
      filters: getFiltersFromQuery()
    });
  } catch (error) {
    console.error("Schedule load failed:", error);
    scheduleComponent.postMessage({ type: "schedule:error" });
  }
}

function sendLoadingState() {
  if (scheduleComponent) {
    scheduleComponent.postMessage({ type: "schedule:loading" });
  }
}

function getFiltersFromQuery() {
  const query = wixLocationFrontend.query || {};

  return {
    search: query.search || "",
    team: query.team || "",
    location: query.location || "",
    league: query.league || "",
    division: query.division || "",
    range: query.range || "upcoming"
  };
}

function syncFilterQuery(filters) {
  const nextQuery = {};
  const removeKeys = ["search", "team", "location", "league", "division", "range"];

  removeKeys.forEach((key) => {
    const value = filters[key];
    if (value && !(key === "range" && value === "upcoming")) {
      nextQuery[key] = value;
    }
  });

  wixLocationFrontend.queryParams.remove(removeKeys);

  if (Object.keys(nextQuery).length > 0) {
    wixLocationFrontend.queryParams.add(nextQuery);
  }
}

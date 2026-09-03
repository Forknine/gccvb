import wixData from 'wix-data';
import wixLocationFrontend from 'wix-location-frontend';
import wixCrmFrontend from 'wix-crm-frontend';
import { currentMember } from "wix-members-frontend";
import { getValuesWrapper } from "backend/googlesheet-wrapper.jsw";
import { appendValuesWrapper } from "backend/googlesheet-wrapper.jsw";

let reportedgames = [];
let scheduledgames = [];
let filteredgames = [];
let memberInfo;

$w.onReady(async function() {
  // Show loading message while fetching sheet data
  $w('#loading').show();
  $w('#datePicker3').disable();

  await getValuesFromSheet();
  populateUnreportedDropdown();
  registerHandlers();

  $w('#loading').hide();
  $w('#datePicker3').enable();
});

async function getValuesFromSheet() {
  try {
    reportedgames = await getValuesWrapper("Scores!A2:F300") || [];
    scheduledgames = await getValuesWrapper("Schedule!A2:E300") || [];

    sortReportedGames(); // fill filteredgames
  } catch (err) {
    console.error("Error getting sheet values:", err);
  }
}

/**
 * Only include unreported matches that have already happened (<= today).
 */
function sortReportedGames() {
  const today = new Date();
  filteredgames = [];

  scheduledgames.forEach(sched => {
    /*
      sched might look like:
      [ dateString, ???, "Wednesday Red vs Blue", ???, ??? ]
    */
    const schedDate = new Date(sched[0]);
    let isReported = false;

    // Compare with reportedgames
    reportedgames.forEach(rep => {
      // rep might be [ dateStr, "Wednesday Red vs Blue", g1, g2, g3, name, email ]
      if (rep[0] === sched[0] && rep[1] === sched[2]) {
        isReported = true;
      }
    });

    // Keep only if it's not reported and date <= today
    if (!isReported && schedDate <= today) {
      filteredgames.push(sched);
    }
  });
}

/**
 * Populate #unreported dropdown with all unreported matches.
 * Example label: "YYYY-MM-DD - Wednesday Red vs Blue"
 */
function populateUnreportedDropdown() {
  const opts = filteredgames.map(game => {
    // game = [ "2025-02-05", ???, "Wednesday Red vs Blue", ???, ??? ]
    const dateStr  = game[0];
    const matchStr = game[2];
    const label    = `${dateStr} - ${matchStr}`;
    const value    = JSON.stringify(game); // store entire row
    return { label, value };
  });

  $w('#unreported').options = opts;
  $w('#unreported').placeholder = "Select an Unsubmitted Game";
}

function registerHandlers() {
  // When selecting from #unreported, auto-fill date/match
  $w('#unreported').onChange(onUnreportedDropdownChange);

  // When picking a date, show possible matches
  $w('#datePicker3').onChange(onDatePickerChange);

  // When picking a match
  $w('#match').onChange(onMatchChange);

  // Submit button
  $w('#submitscores').onClick(() => saveValuesToSheet());
}

/**
 * User selects from the #unreported dropdown.
 * We parse the full row, fill #datePicker3, set #match, etc.
 */
function onUnreportedDropdownChange(event) {
  const selectedValue = event.target.value;
  if (!selectedValue) return;

  // parse the stored row
  const game = JSON.parse(selectedValue);
  // e.g. game = [ "2025-02-05", ???, "Wednesday Red vs Blue", ???, ??? ]
  const gameDate    = new Date(game[0]);
  const matchString = game[2];

  // Fill in date picker
  $w('#datePicker3').value = gameDate;

  // Must also set #match.options so that #match.value can actually show
  $w('#match').options = [ { label: matchString, value: matchString } ];
  $w('#match').value = matchString;

  // Update winner dropdowns
  setGameWinnerDropdowns(matchString);
}

/**
 * User picks or changes a date from #datePicker3 => show matching games for that date.
 * Also reset the unreported dropdown since user is now picking from date-based approach.
 */
function onDatePickerChange() {
  $w('#text6').hide();

  // Reset the unreported dropdown
  $w('#unreported').value = undefined;

  // Reset match & game dropdowns
  $w('#match').selectedIndex = undefined;
  $w('#game1').selectedIndex = undefined;
  $w('#game2').selectedIndex = undefined;
  $w('#game3').selectedIndex = undefined;
  $w('#match').options = [];

  const pickedDate = $w('#datePicker3').value;
  if (!pickedDate) return;

  // Filter out all matches in filteredgames that have the same date
  const matchesForDate = filteredgames.filter(game => {
    const gameDate = new Date(game[0]);
    return isSameDay(gameDate, pickedDate);
  });

  if (matchesForDate.length === 0) {
    $w('#match').placeholder = 'All Games Submitted';
  } else {
    $w('#match').placeholder = 'Choose The Match';
    const opts = matchesForDate.map(item => {
      return { label: item[2], value: item[2] };
    });
    $w('#match').options = opts;
  }
}

/**
 * Simple helper to compare only the calendar day (ignoring time).
 */
function isSameDay(d1, d2) {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

/**
 * User picks or changes #match => update game winners accordingly.
 * Also reset the unreported dropdown if the user is now picking from #match manually.
 */
function onMatchChange() {
  // Reset the unreported dropdown because user is picking from #match now
  $w('#unreported').value = undefined;

  const matchString = $w('#match').value;
  setGameWinnerDropdowns(matchString);
}

/**
 * Convert "Wednesday Red vs Blue" => team1 = "Red", team2 = "Blue".
 */
function setGameWinnerDropdowns(matchString) {
  // Reset
  $w('#game1').selectedIndex = undefined;
  $w('#game2').selectedIndex = undefined;
  $w('#game3').selectedIndex = undefined;

  if (!matchString) {
    $w('#game1').options = [];
    $w('#game2').options = [];
    $w('#game3').options = [];
    return;
  }

  // Split the string: ["Wednesday", "Red", "vs", "Blue"]
  const parts = matchString.split(" ");
  const vsIndex = parts.indexOf("vs");

  // If there's no "vs", or it's at the very start, we can't parse properly
  if (vsIndex <= 0) {
    $w('#game1').options = [];
    $w('#game2').options = [];
    $w('#game3').options = [];
    return;
  }
  
  // The day is typically parts[0] => "Wednesday"
  // Team1 is everything between the day and "vs" minus the day name
  // Because your format is "<DAY> <TEAM1> vs <TEAM2>"
  // => shift out the "day"
  parts.shift(); // remove "Wednesday", now parts = ["Red", "vs", "Blue"]

  // Now find 'vs' again in the shifted array
  const vsPos = parts.indexOf("vs");
  // team1 is everything before vs
  const team1 = parts.slice(0, vsPos).join(" ");
  // team2 is everything after vs
  const team2 = parts.slice(vsPos + 1).join(" ");

  // Build options for game1, game2, game3
  const opts = [
    { label: team1, value: team1 },
    { label: team2, value: team2 }
  ];

  $w('#game1').options = opts;
  $w('#game2').options = opts;
  $w('#game3').options = opts;
}

// Fetch current member info so we know who’s reporting
async function fetchMemberInfo() {
  try {
    memberInfo = await currentMember.getMember();
    console.log("Member info fetched:", memberInfo);
  } catch (error) {
    console.error("Error fetching member info:", error);
  }
}
fetchMemberInfo();

/**
 * When the user clicks "Submit Scores", store in Google Sheets,
 * remove from filteredgames, and reset fields.
 */
async function saveValuesToSheet() {
  try {
    if (!memberInfo) {
      await fetchMemberInfo();
    }
    const name = memberInfo?.contactDetails?.firstName + " " + memberInfo?.contactDetails?.lastName;
    const email = memberInfo?.loginEmail;

    const submitDate = $w('#datePicker3').value 
      ? $w('#datePicker3').value.toISOString().split('T')[0] 
      : "";
    const matchVal = $w('#match').value || "";
    const g1Val    = $w('#game1').value || "";
    const g2Val    = $w('#game2').value || "";
    const g3Val    = $w('#game3').value || "";

    const submitline = [ submitDate, matchVal, g1Val, g2Val, g3Val, name, email ];

    // Append to your spreadsheet
    const res = await appendValuesWrapper(submitline);
    $w('#text6').show(); // success message

    // Remove this just-submitted game from filteredgames
    filteredgames = filteredgames.filter(game => {
      return !(game[0] === submitDate && game[2] === matchVal);
    });

    // Reset fields
    $w('#unreported').value = undefined;
    $w('#datePicker3').value = undefined;
    $w('#match').value = undefined;
    $w('#game1').value = undefined;
    $w('#game2').value = undefined;
    $w('#game3').value = undefined;

    $w('#match').options = [];
    $w('#game1').options = [];
    $w('#game2').options = [];
    $w('#game3').options = [];

    // Re-populate the #unreported dropdown in case something was removed
    populateUnreportedDropdown();

    showMessage(res);
  } catch (err) {
    showMessage(err.toString());
  }
}

function showMessage(msg) {
  console.log(msg);
  // Optionally show it in a text element on screen
  // e.g. $w('#someTextElement').text = msg;
}

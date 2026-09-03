import wixUsers from 'wix-users';
import { getValuesWrapper, appendValuesWrapper } from 'backend/googlesheet-wrapper.jsw';

let roster = [];
let userTeams = [];
let loggedInEmail = "";

$w.onReady(async function () {
  // Get current user and email.
  const user = wixUsers.currentUser;
  loggedInEmail = await user.getEmail();

  // Load roster data.
  try {
    roster = await getValuesWrapper("Roster!A1:E180");
  } catch (error) {
    return;
  }

  // Build team strings in the format "day color"
  userTeams = roster
    .filter(row => row[4] && row[4].trim().toLowerCase() === loggedInEmail.trim().toLowerCase())
    .map(row => `${row[1].trim().toLowerCase()} ${row[0].trim().toLowerCase()}`);
  userTeams = [...new Set(userTeams)];

  if (userTeams.length === 0) {
    $w("#noTeamMessage").show();
    return;
  } else if (userTeams.length === 1) {
    loadTeamReview(userTeams[0]);
  } else {
    const teamOptions = userTeams.map(team => ({ label: team, value: team }));
    $w("#teamDropdown").options = teamOptions;
    $w("#teamDropdown").onChange((event) => {
      const selectedTeam = event.target.value;
      loadTeamReview(selectedTeam);
    });
    $w("#teamDropdown").show();
  }
});

function loadTeamReview(team) {
  const normalizedTeam = team.trim().toLowerCase();

  // Filter roster for teammates in the selected team (excluding the logged-in user).
  const teammates = roster.filter(row =>
    (`${row[1].trim().toLowerCase()} ${row[0].trim().toLowerCase()}` === normalizedTeam) &&
    row[4].trim().toLowerCase() !== loggedInEmail.trim().toLowerCase()
  );

  // Map each teammate into an object for the repeater.
  const repeaterData = teammates.map(row => {
    const validId = row[4].replace(/[^A-Za-z0-9\-]/g, '-');
    return {
      _id: validId,
      name: row[2]  // Player's name.
    };
  });

  $w("#teammateRepeater").onItemReady(($item, itemData, index) => {
    const nameElem = $item("#playerName");
    if (nameElem) {
      nameElem.text = itemData.name;
    }
  });

  $w("#teammateRepeater").data = repeaterData;
  $w("#reviewFormContainer").show();
}

export async function submitReviewButton_click(event) {
  let reviewRows = [];

  // Loop through each repeater item and build a review row.
  $w("#teammateRepeater").forEachItem(($item, itemData, index) => {
    const selectedPositions = $item("#positionCheckbox").value;
    const hitting   = $item("#hittingRating").value;
    const passing   = $item("#passingRating").value;
    const blocking  = $item("#blockingRating").value;
    const serving   = $item("#servingRating").value;
    const setting   = $item("#settingRating").value;
    const notes     = $item("#notes").value ? $item("#notes").value.toString() : "";
    
    // Build one review row.
    // Format: [ reviewerEmail, reviewedPlayerID, positions, hitting, passing, blocking, serving, setting, notes, timestamp ]
    const row = [
      loggedInEmail,
      itemData._id,
      selectedPositions.join(','),
      hitting.toString(),
      passing.toString(),
      blocking.toString(),
      serving.toString(),
      setting.toString(),
      notes,
      new Date().toISOString()
    ];
    reviewRows.push(row);
  });

  try {
    // Submit each review row individually.
    for (let i = 0; i < reviewRows.length; i++) {
      await appendValuesWrapper(reviewRows[i]);
    }
    $w("#successMessage").show();
    // Hide the review form container to prevent resubmission.
    $w("#reviewFormContainer").hide();
  } catch (err) {
    $w("#errorMessage").show();
  }
}

$w('#button1').onClick((event) => {
  submitReviewButton_click();
});

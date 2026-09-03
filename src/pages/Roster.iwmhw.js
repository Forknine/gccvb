import { getValuesWrapper } from "backend/googlesheet-wrapper.jsw";
var names = [];
const colours = ['Red', 'Orange', 'Yellow', 'Green', 'Blue', 'Purple', 'Maroon', 'Black', 'Cyan', 'Brown', 'Aqua', 'Pink'];

$w.onReady(function () {
    getValuesFromSheet();

    // Hide Monday, Wednesday, and Uber teams initially
    $w('#MondayTeams').hide();
    $w('#WednesdayTeams').hide();
    $w('#UberTeams').hide();

    // Loop through each color for Monday
    colours.forEach(function (index) {
        const element = $w('#' + index + 'Monday');
        
        
        // Reset the text content (empty) and apply inline styles
        element.html = `<p style="color: ${index}; font-size: 16px; text-shadow: 1px 1px 1px black;"></p>`;
    });

    // Loop through each color for Wednesday
    colours.forEach(function (index) {
        const element = $w('#' + index + 'Wednesday');
        
        
        // Reset the text content (empty) and apply inline styles
        element.html = `<p style="color: ${index}; font-size: 16px; text-shadow: 1px 1px 2px black;"></p>`;
    });
});

async function getValuesFromSheet() {
    try {
        names = (await getValuesWrapper("Roster!A1:E180"));
        console.log(names);
        names.forEach(function (index) {
            const element = $w('#' + index[0] + index[1]);
            element.show();
            
            // Create a styled link for the player's name
            let playerHTML = `<p style="color: ${index[0].toLowerCase()}; font-size: 16px; text-shadow: 1px 1px 1px black;">`;
            if (index[2] !== undefined) {
                playerHTML += `<a href='https://www.gccvb.org/profile/${index[3]}' style="color: ${index[0].toLowerCase()};">${index[2]}</a>`;
            }
            playerHTML += `</p>`;
            
            // Add the formatted player HTML to the element
            element.html += playerHTML;
        });
    } finally {
        // Show Monday, Wednesday, and Uber teams once everything is ready
        $w('#MondayTeams').show();
        $w('#WednesdayTeams').show();
        $w('#UberTeams').show();
    }
   
}
 
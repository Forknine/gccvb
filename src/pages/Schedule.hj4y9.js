// Velo API Reference: https://www.wix.com/velo/reference/api-overview/introduction
	import wixLocationFrontend from 'wix-location-frontend';
	import wixWindowFrontend from "wix-window-frontend";
	import { getValuesWrapper } from "backend/googlesheet-wrapper.jsw";
	//import { CreateTable } from "backend/schedule-table.jsw";
	

var master = [];
var tabledisplay;
var originalData = [];
const map = {
	CCVI: "https://maps.app.goo.gl/G8E9VRqNi6DW1R6P7",
	Westminster: "https://maps.app.goo.gl/QC7LCK6qfnzfjkes5",
	"John Galt": "https://maps.app.goo.gl/LK87LccbSFKwDb9e7",
	Rickson: "https://maps.app.goo.gl/LK87LccbSFKwDb9e7",
  "King George": "https://maps.app.goo.gl/RCeziLar6wnT2Df99"
}
 
$w.onReady(function () {
	if (wixWindowFrontend.formFactor === "Mobile") {
  $w("#mobileschedule").show();
  $w('#button1').show();
}
 getValuesFromSheet();
//$w('#table3').updateRow( 0 , objarray);
//tablemaker();
console.log($w('#mobileschedule'));
$w('#Section1Regular').onDblClick(event => {console.log($w('#mobileschedule'));});



async function getValuesFromSheet() {
  try {   
    master = (await getValuesWrapper("Schedule!A1:G350"));
    master.shift();

    master.forEach((index, count) => {
      // Check if the row is blank by verifying all elements
      if (index.every(cell => cell === undefined || cell === null || cell === "")) {
        return; // Skip this iteration for blank rows
      }

      const x = String(index[4]);
      const result = x.split(",");
      
      const locations = "<a style='color: blue; text-decoration: underline;' href='" + map[index[3]] + "'>" + index[3] + "</a>";
      
      let objarray = {
        date: index[0],
        time: index[1],
        teams: index[2],
        location: locations,
        results: ""
      };

      if (index[4] !== undefined) {
        result.forEach(color => {
          objarray.results += `<a style='color:${color}; font-size: 20px;'>✘</a>`;
        });
      }
      
      $w('#table3').updateRow(count, objarray);
    });

    originalData = $w('#table3').rows;
  } catch (err) {
    // Handle error (e.g., log or display a message)
    console.error(err);
  }
}

	$w('#button1').onClick(function (a) {
		wixLocationFrontend.to(($w('#dropdown1').value));
		
	})
	$w('#button2').onClick(function () {
		
		const choice = $w('#dropdown1').value.toLowerCase().slice(1).split("-");
			 
			 var filteredData = originalData.filter(item => { return Object.values(item).some(value => value.toString().toLowerCase().includes(choice[0]));});
			 filteredData = filteredData.filter(item => { return Object.values(item).some(value => value.toString().toLowerCase().includes(choice[1]));});
			 console.log(filteredData);
			 $w('#table3').rows = filteredData;

	});
	
});
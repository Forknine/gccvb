import { getValuesWrapper } from "backend/bjcash-wrapper.jsw";
import { appendValuesWrapper } from "backend/bjcash-wrapper.jsw";
//import wixData from ‘wix-data’ ;
import wixLocationFrontend from "wix-location-frontend";

var names = [];
const denoms = [0,100,50,20,10,5,2,1,0.25,0.10,0.05];

$w.onReady(function () {

  $w('#input01').onChange( function() { CashInput($w('#input01')) });
  $w('#input02').onChange( function() { CashInput($w('#input02')) });
  $w('#input03').onChange( function() { CashInput($w('#input03')) });
  $w('#input04').onChange( function() { CashInput($w('#input04')) });
  $w('#input05').onChange( function() { CashInput($w('#input05')) });
  $w('#input06').onChange( function() { CashInput($w('#input06')) });
  $w('#input07').onChange( function() { CashInput($w('#input07')) });
  $w('#input08').onChange( function() { CashInput($w('#input08')) });
  $w('#input09').onChange( function() { CashInput($w('#input09')) });
  $w('#input10').onChange( function() { CashInput($w('#input10')) });
  $w('#input11').onChange( function() { CalculateCash() });

  $w('#input11').onMouseIn(function (){ $w('#textMask1').show() });

  $w('#input11').onMouseOut(function() {$w('#textMask1').hide() });

  $w('#dochange').onClick(function () {ChangeFloatLaunch($w('#dropdown1').value)});
});

function ChangeFloatLaunch(store) {
  if (isNaN(store)) { //alert the user to pick store
  }
  else {
       var myData = { key: 1, label: store };
       console.log(myData);
      // sendDataToIframe(myData);
       // Example usage

  }

}


function sendDataToIframe(data) {
  var iframe = $w('#changefloat');
   iframe.postMessage(data);
   console.log(data);
 }

function CashInput(denomchange) {

  const x = denomchange.id.slice(5,7); //determine the input number
  const y = denoms[parseInt(x)];  //determine the denomination
  const z = parseInt(denomchange.value); //determine the quantity of coins/bills
  console.log(x,y,z);

  $w('#text'+x).text = parseFloat(y*z).toFixed(2); //input the value to the corresponding text box

  TotalCash();
}

function TotalCash() {
  
  var total = 0;
  
  for(let x=1;x<11;++x) {
    
    let z = x.toLocaleString('en-US', {
      minimumIntegerDigits: 2,
      useGrouping: false
    })  
    
    if(isNaN($w('#text'+z).text)) {}
    else {  total += parseFloat($w('#text'+z).text);}
  
  }
$w('#text12').text = '$' + total.toFixed(2);
}

function CalculateCash() {
  const totalnum = parseFloat(($w('#text12').text).slice(1));
  console.log($w('#text12').text);
  console.log(totalnum);
  if(isNaN(totalnum)) {}
  else {
    const total = totalnum - parseFloat($w('#input11').value);
    $w('#text13').text = '$' + total.toFixed(2);
  }
};


$w('#Submit').onClick(function () {
  SubmitCash();
})

async function SubmitCash() {

   const values = [$w('#dropdown1').value,
                   $w('#input01').value,
                   $w('#input02').value,
                   $w('#input03').value,
                   $w('#input04').value,
                   $w('#input05').value,
                   $w('#input06').value,
                   $w('#input07').value,
                   $w('#input08').value,
                   $w('#input09').value,
                   $w('#input10').value,
                   $w('#text12').text,
                   $w('#input11').value,
                   $w('#text13').text
   ]
  appendValuesWrapper(values);

}
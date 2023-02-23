function addT(){
var totpObjects = localStorage.getItem('totpObjects');
  if (totpObjects  == "{}" || totpObjects == undefined)
 {
 document.getElementById("circle1").style.visibility = 'hidden';
  }
 else
 {
  document.getElementById("circle1").style.visibility = 'visible';
 }
}
async function populateTable()  {
 var totpObjects = getTotpObjects();
    var table = "";
      for (var key in totpObjects)
      {
        var totp = new TOTP(key);
         try {
        var code = await totp.gen();
            }
        catch (error) {
            }
         var valTotp = code;
         var idAccount = totpObjects[key];
         table += "<tr><td style='border-bottom:1px dotted grey'>"
               + " <a href='#' class='fa fa-trash-o fa-2x' aria-hidden='true' onclick=\"deleteTotp('" + key + "')\"> </a>&emsp;"  + "<span style='font-size:1.5em' id="+idAccount+">" + totpObjects[key] + "</span>"
               + "<br/><span style='font-size:2em' id="+idAccount+">"+valTotp+"</span></td></tr>" ;
        }
        document.getElementById("result").innerHTML = table;
}

addT();
populateTable();
jQuery.noConflict();

const length = 87.39775848388672;
const circle1 = document.getElementById('circle1');
var count = 0;
var time = 30000;
var epoch = new Date().getTime();
var new_count = (epoch) % time ;
circle1.style.strokeDasharray = length;
circle1.style.strokeDashoffset =  length - (new_count / time) * length;


function startTimer(){
  timer = setInterval(function(){
    epoch = new Date().getTime();
    new_count = (epoch) % time ;
    circle1.style.strokeDashoffset = length - (new_count / time) * length;
    if (new_count < count) {
      populateTable();
    }
    count = new_count;
  },500);
}
startTimer();

function deleteTotp(key) {
var totpObjects = getTotpObjects();
var result = confirm("Voulez-vous supprimer ["+totpObjects[key]+"] ?");
if (result) {
	delete totpObjects[key];
	localStorage.setItem('totpObjects',JSON.stringify(totpObjects));
	populateTable();
	addT();
	}
}

function navigate(event){
        this.currentView = event.target.name;
        $('a').parent().removeClass('active');
        $('#' + event.target.name).parent().addClass('active');
        if (document.getElementById("sidenav-overlay"))$('#navButton').click();
}

function getTotpObjects(){
var totpObjects = localStorage.getItem('totpObjects');
if (totpObjects == null) {
    totpObjects = new Object();
    }
else
{
    totpObjects=JSON.parse(totpObjects);
}
return totpObjects;
}

function addAccount(){
var totpObjects = getTotpObjects();
var name = document.getElementById("account2").value;
var key = document.getElementById("secret2").value;
if (key.length >=16 && (key.length % 2 === 0))
  {
   totpObjects[key]=name;
   localStorage.setItem('totpObjects',JSON.stringify(totpObjects));
   populateTable();
   addT();
  }
else
  {
   alert("le nombre de caractère doit être supérieur ou égal à 16 et multiple de deux ");
    }
}

function totp_scan(event){
   cordova.plugins.barcodeScanner.scan(
      function (result) {
         var s = "Result: " + result.text + "<br/>" +
          "Format: " + result.format + "<br/>" +
          "Cancelled: " + result.cancelled;
              var url = new URL(result.text);
              var params = new URLSearchParams(url.search);
              var key = params.getAll('secret');
              var name = url.pathname.replace(/%20/g, " ").replace(/\/\/totp\//g,"").replace(/\//g,"");
              var totpObjects = getTotpObjects();
              totpObjects[key]=name;
              localStorage.setItem('totpObjects',JSON.stringify(totpObjects));
              populateTable(); addT();
              var variable = "totp";
              console.log("paristotop"+$('#' +variable).parent());
              $('a').parent().removeClass('active');
              $('#' +variable).addClass('active');

      },
      function (error) {
         alert("Scanning failed: " + error);
      }
   );
      populateTable();
       addT();
}

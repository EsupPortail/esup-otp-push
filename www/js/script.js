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
          var secret = key; // Utilisez le code secret (en base32) comme clé
          var period = 30; // Par défaut, la période est de 30 secondes
          var digits = 6; // Vous pouvez spécifier le nombre de chiffres souhaité (par exemple, 6)
          var debug = false; // Vous pouvez activer ou désactiver le mode de débogage en fonction de vos besoins
          var counter = 0;
         try {
            var secrethex = Convert.base32toHex(secret); // Convertissez le code secret en hexadécimal
            var code = await TOTP.otp(secrethex, digits, counter, period, debug); // Générez le code TOTP
            }
        catch (error) {
            }
         var valTotp = code;
         var idAccount = totpObjects[key];
        table += "<tr role='presentation'><td role='presentation' style='border-bottom:1px dotted grey'>" +
                                       "<button class='button-delete' aria-label='Supprimer' onclick=\"deleteTotp('" + key + "')\">" +
                                       "<i class='fa fa-trash-o' style='font-size: 1.5em;' aria-hidden='true'></i>" +  /*Réduit la taille des icônes*/
                                       "</button>&emsp;" +
                                       "<span style='font-size:1.2em;' id=" + idAccount + " aria-label='Nom du compte: " + totpObjects[key] + "'>" + totpObjects[key] + "</span>" +  /*Réduit la taille du texte*/
                                       "<br/><span style='font-size:1.5em;' id=" + idAccount + " aria-label='Code généré: " + valTotp + "'>" + valTotp + "</span></td></tr>";
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

function setAccount(key,name){
  let totpObjects = getTotpObjects();
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

function addAccount(){

let name = document.getElementById("account2").value;
let key = document.getElementById("secret2").value;
setAccount(key,name);

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
              var name = decodeURIComponent(url.pathname.replace(/\/\/totp\//g,"").replace(/\//g,""));
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
/* NFC */
function initNfc(){
  if (typeof nfc !== 'undefined') {
    Materialize.toast('<div role="alert">NFC plugin is available</div>', 4000);
  } else {
    Materialize.toast('<div role="alert">NFC plugin is not available</div>', 4000);
  }
}
/* DarkMode */
document.addEventListener('DOMContentLoaded', function () {
  const darkModeToggle = document.getElementById('darkModeToggle');
  
  
  // Charger l'état du dark mode depuis le localStorage si défini
  if (localStorage.getItem('darkMode') === 'enabled') {
    document.body.classList.add('dark-mode');
    darkModeToggle.checked = true;
    switchDarkModeOnElements(true); // Active le dark mode sur les autres éléments
  }

  // Basculer entre le mode sombre et le mode clair
  darkModeToggle.addEventListener('change', function () {
    if (this.checked) {
      document.body.classList.add('dark-mode');
      localStorage.setItem('darkMode', 'enabled'); // Sauvegarder le choix
      switchDarkModeOnElements(true); // Activer le mode sombre sur les autres éléments
    } else {
      document.body.classList.remove('dark-mode');
      localStorage.setItem('darkMode', 'disabled'); // Sauvegarder le choix
      switchDarkModeOnElements(false); // Désactiver le mode sombre
    }
  });

  function switchDarkModeOnElements(isDarkMode) {
    const elements = document.querySelectorAll('.card, .navbar, .btn, .page-title, .side-nav');
    elements.forEach(el => {
      if (isDarkMode) {
        el.classList.add('dark-mode');
      } else {
        el.classList.remove('dark-mode');
      }
    });
  }
});
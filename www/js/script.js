function addT(){
var totpObjects = localStorage.getItem('totpObjects');
  if (totpObjects  == "{}")
 {
 document.getElementById("circleTimer").style.display = 'none';
}
 else
{
 document.getElementById("circleTimer").style.display = 'inline';
}

  var $ = jQuery.noConflict();
    $ = function(sel) {
          return document.querySelector(sel);
        };

       var updateTicker = function(tick, el) {
          el.innerText = tick;
        }

        var updateTotp = function(secret, el) {
          el.innerText = totp.getOtp(secret);
        }
}

async function populateTable()  {
 var totpObjects = getTotpObjects();
    var table = "";
<!--      var secret = "FYUHUVD5HBHSIPDNIREUUNZ2M4";-->
      for(var key in totpObjects)
      {
        var totp = new TOTP(key);
         try {
        var code = await totp.gen();
            }
        catch (error) {
            }
         var valTotp = code;
//<!--         alert("code ==" + code);-->
         var idAccount = totpObjects[key];
//<!--         alert("id account ==" + idAccount);-->
         var demo = "sdsg";
         table += "<tr>"
               + " <a href='#' class='fa fa-trash-o' aria-hidden='true' onclick=\"deleteTotp('" + key + "')\"> </a>&emsp;" +totpObjects[key] + "</tr>"
               + "<tr><h5 id="+idAccount+">"+valTotp+"</h5>" ;
         table += "</tr><br/>";
        }
document.getElementById("result").innerHTML = table;
}

//<!--function checkDouble() {-->
//<!--var totpLine = localStorage.getItem('totpObjects');-->
//<!--    for (var keys in totpLine)-->
//<!--    {-->
//<!--        if (totLine != "{}") {-->
//<!--            console.log(arr.indexOf() > -1);-->
//
//<!--        }-->
//<!--    }-->
//<!--}-->

populateTable();
jQuery.noConflict();

const circle2 = document.getElementById('circle2');
const length = 87.39775848388672;
circle2.style.strokeDasharray = length;
circle2.style.strokeDashoffset = length;
let count = 0;
let time = 30000;

function startTimer(){
  timer = setInterval(function(){
    var epoch = new Date().getTime();
    var new_count = (epoch) % time ;
    circle2.style.strokeDashoffset = length - (new_count / time) * length;
    if (new_count < count) {
      populateTable();
      startTimer();
    }
    count = new_count;
  },100);
}
startTimer();

function deleteTotp(key) {
var result = confirm("voulez-vous vraiment supprimer?");
if (result) {
var totpObjects = getTotpObjects();
delete totpObjects[key];
localStorage.setItem('totpObjects',JSON.stringify(totpObjects));
 addT();
}
};

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
  document.getElementById("circleTimer").style.display = 'inline';
var totpObjects = getTotpObjects();
var name = document.getElementById("account2").value;
var key = document.getElementById("secret2").value;
if (key.length >=16 && (key.length % 2 === 0))
  {
   totpObjects[key]=name;
   localStorage.setItem('totpObjects',JSON.stringify(totpObjects));
  }
else
  {
   alert("le nombre de caractère doit être supérieur ou égal à 16 et multiple de deux ");
}
addT();
}
addT();

function totp_scan(event){
   cordova.plugins.barcodeScanner.scan(
      function (result) {
         var s = "Result: " + result.text + "<br/>" +
          "Format: " + result.format + "<br/>" +
          "Cancelled: " + result.cancelled;
              var url = new URL(result.text);
              var params = new URLSearchParams(url.search);
              var key = params.getAll('secret');
              var name1 = url.pathname.split("//totp/")[1];
              var name = name1.replace(/%20/g, " ");
              var totpObjects = getTotpObjects();
              totpObjects[key]=name;
              localStorage.setItem('totpObjects',JSON.stringify(totpObjects));
              addT();
              var variable = "totp";
              console.log("paristotop"+$('#' +variable).parent());
              $('a').parent().removeClass('active');
              $('#' +variable).addClass('active');
      },
      function (error) {
         alert("Scanning failed: " + error);
      }
   );
   addT();
}

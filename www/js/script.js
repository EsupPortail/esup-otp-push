var sharedPreferences = undefined;

function addT() {
  var sharedPreferences =
    window.plugins.SharedPreferences.getInstance("settings");

  sharedPreferences.get(
    "totpObjects",
    (totpObjects) => {
      if (totpObjects == "{}" || totpObjects == undefined) {
        document.getElementById("circle1").style.visibility = "hidden";
      } else {
        document.getElementById("circle1").style.visibility = "visible";
      }
    },
    (error) => {
      console.error("❌ - script.js - Erreur lors de la récupération de totpObjects:", error);
    }
  );
}
async function populateTable() {
  var totpObjects = await getTotpObjects();
  var table = "";
  for (var key in totpObjects) {
    var secret = key; // Utilisez le code secret (en base32) comme clé
    var period = 30; // Par défaut, la période est de 30 secondes
    var digits = 6; // Vous pouvez spécifier le nombre de chiffres souhaité (par exemple, 6)
    var debug = false; // Vous pouvez activer ou désactiver le mode de débogage en fonction de vos besoins
    var counter = 0;
    try {
      var secrethex = Convert.base32toHex(secret); // Convertissez le code secret en hexadécimal
      var code = await TOTP.otp(secrethex, digits, counter, period, debug); // Générez le code TOTP
    } catch (error) {}
    var valTotp = code;
    var idAccount = totpObjects[key];
    table +=
      "<tr role='presentation'><td role='presentation' style='border-bottom:1px dotted grey'>" +
      "<button class='button-delete' aria-label='Supprimer' onclick=\"deleteTotp('" +
      key +
      "')\">" +
      "<i class='fa fa-trash-o' style='font-size: 1.5em;' aria-hidden='true'></i>" /*Réduit la taille des icônes*/ +
      "</button>&emsp;" +
      "<span style='font-size:1.2em;' id=" +
      idAccount +
      " aria-label='Nom du compte: " +
      totpObjects[key] +
      "'>" +
      totpObjects[key] +
      "</span>" /*Réduit la taille du texte*/ +
      "<br/><span style='font-size:1.5em;' id=" +
      idAccount +
      " aria-label='Code généré: " +
      valTotp +
      "'>" +
      valTotp +
      "</span></td></tr>";
  }
  document.getElementById("result").innerHTML = table;
}

jQuery.noConflict();

const length = 87.39775848388672;
const circle1 = document.getElementById("circle1");
var count = 0;
var time = 30000;
var epoch = new Date().getTime();
var new_count = epoch % time;
circle1.style.strokeDasharray = length;
circle1.style.strokeDashoffset = length - (new_count / time) * length;

function startTimer() {
  timer = setInterval(function () {
    epoch = new Date().getTime();
    new_count = epoch % time;
    circle1.style.strokeDashoffset = length - (new_count / time) * length;
    if (new_count < count) {
      populateTable();
    }
    count = new_count;
  }, 500);
}
startTimer();

async function deleteTotp(key) {
  var sharedPreferences =
    window.plugins.SharedPreferences.getInstance("settings");
  var totpObjects = await getTotpObjects();
  var result = confirm("Voulez-vous supprimer [" + totpObjects[key] + "] ?");
  if (result) {
    delete totpObjects[key];
    console.log("DELETETOTP--------");
    console.log(totpObjects);
    //localStorage.setItem("totpObjects", JSON.stringify(totpObjects));
    sharedPreferences.put("totpObjects", JSON.stringify(totpObjects));
    populateTable();
    addT();
  }
}

function navigate(event) {
  this.currentView = event.target.name;
  $("a").parent().removeClass("active");
  $("#" + event.target.name)
    .parent()
    .addClass("active");
  if (document.getElementById("sidenav-overlay")) $("#navButton").click();
}

function getTotpObjects() {
  return new Promise((resolve, reject) => {
    var sharedPreferences =
      window.plugins.SharedPreferences.getInstance("settings");
    sharedPreferences.get(
      "totpObjects",
      (value) => {
        let totpObjects = new Object();
        if (value) {
          totpObjects = JSON.parse(value);
          console.log("GETTOTP--------totpObjects");
          console.log(totpObjects);
        }
        resolve(totpObjects);
      },
      (error) => {
        console.error(
          "❌ - script.js - Erreurlors de la récupération de totpObjects:",
          error
        );
        reject(error);
      }
    );
  });
}

async function setAccount(key, name) {
  var sharedPreferences =
    window.plugins.SharedPreferences.getInstance("settings");
  let totpObjects = await getTotpObjects();
  if (key.length >= 16 && key.length % 2 === 0) {
    totpObjects[key] = name;
    console.log("SETACCOUNT--------");
    console.log(totpObjects);
    //localStorage.setItem("totpObjects", JSON.stringify(totpObjects));
    sharedPreferences.put("totpObjects", JSON.stringify(totpObjects));
    populateTable();
    addT();
  } else {
    alert(
      "le nombre de caractère doit être supérieur ou égal à 16 et multiple de deux "
    );
  }
}

function addAccount() {
  let name = document.getElementById("account2").value;
  let key = document.getElementById("secret2").value;
  setAccount(key, name);
}

async function totp_scan(event) {
  var sharedPreferences =
    window.plugins.SharedPreferences.getInstance("settings");
  await cordova.plugins.barcodeScanner.scan(
    async function (result) {
      var s =
        "Result: " +
        result.text +
        "<br/>" +
        "Format: " +
        result.format +
        "<br/>" +
        "Cancelled: " +
        result.cancelled;
      var url = new URL(result.text);
      var params = new URLSearchParams(url.search);
      var key = params.getAll("secret");
      var name = decodeURIComponent(
        url.pathname.replace(/\/\/totp\//g, "").replace(/\//g, "")
      );
      var totpObjects = await getTotpObjects();
      totpObjects[key] = name;
      //localStorage.setItem("totpObjects", JSON.stringify(totpObjects));
      sharedPreferences.put("totpObjects", JSON.stringify(totpObjects));
      populateTable();
      addT();
      var variable = "totp";
      console.log("paristotop" + $("#" + variable).parent());
      $("a").parent().removeClass("active");
      $("#" + variable).addClass("active");
    },
    function (error) {
      alert("Scanning failed: " + error);
    }
  );
  populateTable();
  addT();
}
/* NFC */
function initNfc() {
  if (typeof nfc !== "undefined") {
    Materialize.toast('<div role="alert">NFC plugin is available</div>', 4000);
  } else {
    Materialize.toast(
      '<div role="alert">NFC plugin is not available</div>',
      4000
    );
  }
}
/* DarkMode */
document.addEventListener("deviceready", async function () {
  console.log("Deviceready de scripts.js");

  const darkModeToggle = document.getElementById("darkModeToggle");
  let savedPreference = await app.migrationManager.getSharedPreference("darkMode");

  const prefersDarkScheme = window.matchMedia("(prefers-color-scheme: dark)");
  const darkMode = savedPreference ?? (prefersDarkScheme.matches ? "enabled" : "disabled");
  console.log("🔍 Préférence enregistrée (darkMode):", savedPreference);

  if (savedPreference === null) {
    await SETsharedPreferences("darkMode", darkMode); // On sauvegarde cette préférence
  }
  
  
  function enableDarkMode() {
    document.body.classList.add("dark-mode");
    darkModeToggle.checked = true;
    switchDarkModeOnElements(true);
  }
  function disableDarkMode() {
    document.body.classList.remove("dark-mode");
    darkModeToggle.checked = false;
    switchDarkModeOnElements(false);
  }

  // Charger l'état du dark mode depuis le localStorage si défini
  if (savedPreference === "enabled" || darkMode === "enabled") {
    enableDarkMode();
  } else if (savedPreference === "disabled") {
    disableDarkMode();
  } else if (
    savedPreference === null &&
    prefersDarkScheme.matches &&
    device.platform === "iOS"
  ) {
    // iOS
    enableDarkMode();
  } else {
    disableDarkMode();
  }

  // Basculer entre le mode sombre et le mode clair
  darkModeToggle.addEventListener("change", function () {
    var sharedPreferences =
      window.plugins.SharedPreferences.getInstance("settings");

    if (this.checked) {
      document.body.classList.add("dark-mode");
      //localStorage.setItem("darkMode", "enabled"); // A cause de migrate qui utilise le localStorage
      sharedPreferences.put("darkMode", "enabled");
      switchDarkModeOnElements(true); // Activer le mode sombre sur les autres éléments
    } else {
      document.body.classList.remove("dark-mode");
      //localStorage.setItem("darkMode", "disabled"); // A cause de migrate qui utilise le localStorage
      sharedPreferences.put("darkMode", "disabled");
      switchDarkModeOnElements(false); // Désactiver le mode sombre
    }
  });

  if (darkModeToggle.checked) {
    darkModeToggle.dispatchEvent(new Event("change"));
  }
  function switchDarkModeOnElements(isDarkMode) {
    const elements = document.querySelectorAll(
      ".card, .navbar, .btn, .page-title"
    );
    elements.forEach((el) => {
      if (isDarkMode) {
        el.classList.add("dark-mode");
      } else {
        el.classList.remove("dark-mode");
      }
    });
  }
  prefersDarkScheme.addEventListener("change", (e) => {
    if (e.matches) {
      darkModeToggle.checked = true;
      darkModeToggle.dispatchEvent(new Event("change"));
    } else {
      darkModeToggle.checked = false;
      darkModeToggle.dispatchEvent(new Event("change"));
    }
  });
});

function attachSwipeEvents() {
  document.querySelectorAll(".swipe-container").forEach((container, index) => {
    let startX;
    const swipeContent = container.querySelector(".swipe-content");
    const swipeDelete = container.querySelector(".swipe-delete");

    container.addEventListener("touchstart", (e) => {
      startX = e.touches[0].clientX;
    });

    container.addEventListener("touchmove", (e) => {
      const currentX = e.touches[0].clientX;
      const deltaX = startX - currentX;

      if (deltaX > 0) {
        swipeContent.style.transform = `translateX(-${Math.min(
          deltaX,
          100
        )}px)`;
      }
    });

    container.addEventListener("touchend", (e) => {
      const deltaX = startX - e.changedTouches[0].clientX;

      if (deltaX > 80) {
        // Atteint le seuil pour supprimer
        swipeContent.style.transform = "translateX(-100%)";
        swipeDelete.classList.add("success");
        // Appeler la méthode Vue pour supprimer l'élément
        setTimeout(() => {
          app.removeEstablishment(index); // Appelle une méthode Vue
          // Réinitialise le style après suppression
          swipeContent.style.transform = "translateX(0)";
          swipeDelete.classList.remove("success");
        }, 1000); // Supprime après 1 seconde
      } else {
        // Annule le swipe si le seuil n'est pas atteint
        swipeContent.style.transform = "translateX(0)";
      }
    });
  });
}

function GETsharedPreferences(key) {
  const sharedPreferences =
    window.plugins.SharedPreferences.getInstance("settings");

  return new Promise((resolve) => {
    sharedPreferences.get(
      key,
      (value) => {
        try {
          // Vérifie si la valeur est un JSON et parse automatiquement
          if ( typeof value === "object" ) {
            value = JSON.parse(value);
          }
          resolve(value ?? null); // Retourne `null` si la clé est absente
        } catch (error) {
          console.error(`❌ - script.js - Erreur de parsing JSON pour ${key}:`, error);
          resolve(null); // Retourne null au lieu de bloquer avec une erreur
        }
      },
      (error) => {
        console.error(
          `⚠️ - script.js - Erreur lors de la récupération de la clé ${key}:`,
          error
        );
        resolve(null); // Retourne null si erreur pour éviter blocage
      }
    );
  });
}
function SETsharedPreferences(key, value) {
  const sharedPreferences =
    window.plugins.SharedPreferences.getInstance("settings");

  return new Promise((resolve, reject) => {
    try {
      // Convertit automatiquement en JSON
      value = JSON.stringify(value);

      sharedPreferences.put(
        key,
        value,
        () => {
          console.log(`✅ Valeur enregistrée avec succès : ${key} ->`, value);
          resolve(true);
        },
        (error) => {
          console.error(`❌ - script.js - Erreur lors de l'enregistrement de ${key}:`, error);
          reject(error);
        }
      );
    } catch (error) {
      console.error(`⚠️ - script.js - Erreur interne lors du traitement de ${key}:`, error);
      reject(error);
    }
  });
}

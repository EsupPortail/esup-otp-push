// Generate dynamic page
var dynamicPageIndex = 0;
// Initialize your app
var myApp = new Framework7();

var storage = window.localStorage;
var uid = storage.getItem('uid');
var gcm_id, platform, manufacturer, model, additionalData, push;

setInterval(checkAccount, 500);

document.addEventListener("deviceready", onDeviceReady, false);

function onDeviceReady() {
    console.log("Device Ready");
    StatusBar.backgroundColorByHexString("#2196f3");
    platform = device.platform;
    manufacturer = device.manufacturer;
    model = device.model;
    framework7();
    push();
}

function framework7() {
    // Export selectors engine
    var $$ = Dom7;

    // Add view
    var mainView = myApp.addView('.view-main', {
        // Because we use fixed-through navbar we can enable dynamic navbar
        dynamicNavbar: true
    });

    // Callbacks to run specific code for specific pages, for example for About page:
    myApp.onPageInit('about', function (page) {
        // run createContentPage func after link was clicked
        $$('.create-page').on('click', function () {
            createContentPage();
        });
    });
}

function push() {
    push = PushNotification.init({
        "android": {"senderID": "499931336963"},
        "ios": {"alert": "true", "badge": "true", "sound": "true"}, "windows": {}
    });

    push.on('registration', function (data) {
        console.log(data.registrationId);
        $("#gcm_id").html(data.registrationId);
        gcm_id = data.registrationId;
        $('#open-home')[0].click();
    });

    push.on('notification', function (data) {
        console.log(JSON.stringify(data));
        additionalData = data.additionalData;
        $('#buttonNotification')[0].click();
    });

    push.on('error', function (e) {
        console.log(e.message);
        alert(e.message);
    });
}

function createContentPage() {
    mainView.router.loadContent(
        '<!-- Top Navbar-->' +
        '<div class="navbar">' +
        '  <div class="navbar-inner">' +
        '    <div class="left"><a href="#" class="back link"><i class="icon icon-back"></i><span>Back</span></a></div>' +
        '    <div class="center sliding">Dynamic Page ' + (++dynamicPageIndex) + '</div>' +
        '  </div>' +
        '</div>' +
        '<div class="pages">' +
        '  <!-- Page, data-page contains page name-->' +
        '  <div data-page="dynamic-pages" class="page">' +
        '    <!-- Scrollable page content-->' +
        '    <div class="page-content">' +
        '      <div class="content-block">' +
        '        <div class="content-block-inner">' +
        '          <p>Here is a dynamic page created on ' + new Date() + ' !</p>' +
        '          <p>Go <a href="#" class="back">back</a> or go to <a href="services.html">Services</a>.</p>' +
        '        </div>' +
        '      </div>' +
        '    </div>' +
        '  </div>' +
        '</div>'
    );
    return;
}

function checkAccount() {
    //if uid found then go to home, else show login screen
    //for dev
    if (!uid) {
        console.log("L'appareil n'est pas synchronisé");
        if (gcm_id && manufacturer && model)home_register();
    } else {
        console.log("L'appareil est synchronisé");
        home_welcome();
    }
}

function register() {
    myApp.modal({
        text: "Entrez votre identifiant et code d'activation",
        title: "",
        afterText: '<div class="input-field modal-input-double"><input type="text" name="modal-uid" placeholder="' + "Identifiant" + '" class="modal-text-input" required></div><div class="input-field modal-input-double"><input type="password" name="modal-activationCode" placeholder="' + "Code d'activation" + '" class="modal-text-input" required></div>',
        buttons: [{
            text: "Annuler",
            close : true
        }, {
            text: "Ok",
            bold: true
        }],
        onClick: function(modal, index) {
            var userId = $(modal).find('.modal-text-input[name="modal-uid"]').val();
            var code = $(modal).find('.modal-text-input[name="modal-activationCode"]').val();
            if (index === 1) confirm_activate_push(userId, code);
        }
    });
};

function notification() {
    myApp.modal({
        text: "Demande de connexion",
        title: "",
        buttons: [{
            text: "Décliner",
            close : true,
            onClick: function() {
                flush();
            }
        }, {
            text: "Accepter",
            bold: true,
            onClick: function() {
                accept();
            }
        }]
    });
};

function confirm_activate_push(userId, code) {
    if (userId && code) {
        request({
            method: 'POST',
            url: 'http://casotp.univ-lr.fr:3000/users/' + userId + '/methods/push/activate/' + code + '/' + gcm_id + '/' + platform + '/' + manufacturer + '/' + model
        }, function (response) {
            /*        request({
             method: 'POST',
             url: 'http://localhost:3000/users/' + document.getElementById('inputUid').value + '/methods/push/activate/' + document.getElementById('inputCode').value + '/' + gcm_id + '/' + platform + '/' + manufacturer + '/' + model
             }, function (response) {*/
            if (response.code == "Ok") {
                uid = userId;
                storage.setItem('uid', userId);
                myApp.alert("Synchronisation effectuée", "");
            } else {
                console.log(response);
                myApp.alert(JSON.stringify(response), "");
            }
        });
    } else alert("Veuillez entrer l'identifiant et le code d'activation")
}

function accept() {
    request({
        method: 'POST',
        url: 'http://casotp.univ-lr.fr:3000/users/' + uid + '/methods/push/' + additionalData.lt + '/' + gcm_id
    }, function (response) {
        //request({ method: 'POST', url: 'http://localhost:3000/users/'+uid+'/methods/push/'+additionalData.lt+'/'+gcm_id}, function(response) {
        if (response.code == "Ok") {
            myApp.alert("Vous êtes connecté", "");
        } else {
            myApp.alert(JSON.stringify(response), "");
            console.log(response);
        }
        flush();
    })
}

function flush() {
    additionalData = null;
}

function desync(){
    request({
        method: 'DELETE',
        url: 'http://casotp.univ-lr.fr:3000/users/' + uid + '/methods/push/' + gcm_id
    }, function (response) {
        //request({ method: 'POST', url: 'http://localhost:3000/users/'+uid+'/methods/push/'+additionalData.lt+'/'+gcm_id}, function(response) {
        if (response.code == "Ok") {
            uid = null;
            storage.removeItem('uid');
            myApp.alert("Votre compte est désynchronisé", "");
        } else {
            myApp.alert(JSON.stringify(response), "");
            console.log(response);
        }
    })
}
function request(opts, callback, next) {
    var req = new XMLHttpRequest();
    req.open(opts.method, opts.url, true);
    req.onerror = function (e) {
        console.log(e);
    };
    req.onreadystatechange = function (aEvt) {
        if (req.readyState == 4) {
            if (req.status == 200) {
                var responseObject = JSON.parse(req.responseText);
                if (typeof(callback) === "function") callback(responseObject);
            }
            if (typeof(next) === "function") next();
        }
    };
    req.send(null);
}

function home_register() {
    $('#welcome').hide();
    $('#register').show();
    $('#unregistered').show();
    $('#registered').hide();
}

function home_welcome() {
    $('#welcome').show();
    $('#register').hide();
    $('#unregistered').hide();
    $('#registered').show();
}
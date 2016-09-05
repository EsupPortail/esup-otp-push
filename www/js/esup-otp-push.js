// Generate dynamic page
var dynamicPageIndex = 0;
// Initialize your app
var myApp = new Framework7();

var storage = window.localStorage;
var uid = storage.getItem('uid');
var url = storage.getItem('url');
var gcm_id, platform, manufacturer, model, additionalData, push;

var timer = setInterval(checkAccount, 500);

document.addEventListener("deviceready", onDeviceReady, false);

function onDeviceReady() {
    console.log("Device Ready");
    if (cordova.platformId != 'android') {
        StatusBar.backgroundColorByHexString("#212121");
    }
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
    clearInterval(timer);
    myApp.modal({
        text: "Entrez votre identifiant et code d'activation",
        title: "",
        afterText: '<div class="input-field modal-input-double"><input type="text" name="modal-uid" placeholder="' + "Identifiant" + '" class="modal-text-input" required></div><div class="input-field modal-input-double"><input type="password" name="modal-activationCode" placeholder="' + "Code d'activation" + '" class="modal-text-input" required></div><div class="input-field modal-input-double"><input type="text" name="modal-url" placeholder="' + "Adresse" + '" class="modal-text-input" required></div>',
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
            var modalUrl = $(modal).find('.modal-text-input[name="modal-url"]').val();
            if (index === 1){
                confirm_activate_push(userId, code, modalUrl);
                setInterval(checkAccount, 500);
            }
        }
    });
};

function notification(){
    if(additionalData.action=='auth'){
        notification_auth();
    } else if(additionalData.action ="desync"){
        notification_desync();
    }
}
function notification_auth() {
    clearInterval(timer);
    myApp.modal({
        text: additionalData.text,
        title: "",
        buttons: [{
            text: "Décliner",
            close : true,
            onClick: function() {
                flush();
                setInterval(checkAccount, 500);
            }
        }, {
            text: "Accepter",
            bold: true,
            onClick: function() {
                accept();
                setInterval(checkAccount, 500);
            }
        }]
    });
};

function notification_desync() {
    clearInterval(timer);
    myApp.modal({
        text: additionalData.text,
        title: "",
        buttons: [
            {
                text: 'Ok',
                bold: true,
                onClick: function(){
                    setInterval(checkAccount, 500);
                }
            }
        ]
    })
    uid = null;
    url = null;
    storage.removeItem('uid');
    storage.removeItem('url');
};

function confirm_activate_push(userId, code, modalUrl) {
    if (userId && code && modalUrl) {
        request({
            method: 'POST',
            url: 'http://'+modalUrl+'/users/' + userId + '/methods/push/activate/' + code + '/' + gcm_id + '/' + platform + '/' + manufacturer + '/' + model
        }, function (response) {
            if (response.code == "Ok") {
                uid = userId;
                storage.setItem('uid', userId);
                url = modalUrl;
                storage.setItem('url', modalUrl);
                myApp.alert("Synchronisation effectuée", "");
            } else {
                console.log(response);
                myApp.alert(JSON.stringify(response), "");
            }
        });
    } else alert("Veuillez entrer l'identifiant, le code d'activation ainsi que l'adresse du service")
}

function accept() {
    request({
        method: 'POST',
        url: 'http://'+url+'/users/' + uid + '/methods/push/' + additionalData.lt + '/' + gcm_id
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
        url: 'http://'+url+'/users/' + uid + '/methods/push/' + gcm_id
    }, function (response) {
        uid = null;
        storage.removeItem('uid');
        if (response.code == "Ok") {
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
            }else myApp.alert("Le serveur est inaccessible. L'adresse enregistrée n'est peut être pas correcte.", "");
            if (typeof(next) === "function") next();
        }
    };
    req.send(null);
}

function scan(){
    cordova.plugins.barcodeScanner.scan(
        function (result) {
            if(!result.cancelled)
            {
                activateViaScan(result);
            }
            else
            {
                alert("Scan annulé");
            }
        },
        function (error) {
            alert("Scan raté: " + error);
        }
    );
}

function activateViaScan(result){
    request({
        method: 'POST',
        url: 'http://'+result.text.split('/')[0]+'/users/' + result.text.split('/')[2] + '/methods/push/activate/' + result.text.split('/')[5] + '/' + gcm_id + '/' + platform + '/' + manufacturer + '/' + model
    }, function (response) {
        if (response.code == "Ok") {
            uid = result.text.split('/')[2];
            url = result.text.split('/')[0];
            storage.setItem('uid', result.text.split('/')[2]);
            storage.setItem('url', result.text.split('/')[0]);
            myApp.alert("Synchronisation effectuée", "");
        } else {
            console.log(response);
            myApp.alert(JSON.stringify(response), "");
        }
    });
}

function home_register() {
    $('#notice').html(unregNotice);
    $('#activation_settings').html(unregActivationSettings);
}

function home_welcome() {
    $('#notice').html(regNotice);
    $('#activation_settings').html(regActivationSettings);
}

var regNotice = '<p class="notice">Connectez-vous sur un service nécessitant une authentification sécurisée. <br>Si vous sélectionnez la méthode "Notification Android" vous recevrez une notification ainsi qu\'une demande de connexion. Acceptez cette demande. Vous êtes connecté. </p>';
var unregNotice = '<p class="notice">Afin de pouvoir utiliser ce service, modifiez vos préférences et activez la méthode "Notification sur smartphone" dans l\'application Esup-OTP-Manager, un code d\'activation vous est alors affiché. <br> Cliquez ensuite sur le bouton "Activation" d\'Esup-OTP-Push et entrez votre identifiant ainsi que le code affiché. Un message vous confirmera l\'activation de ce service. <br> <a onclick="scan();" class="button button-fill button-raised color-green">Activation</a> </p>';
var regActivationSettings = '<p> <a onclick="desync();" class="button button-fill button-raised color-red">Désynchroniser le compte</a> </p>';
var unregActivationSettings = '<p> <a onclick="scan();" class="button button-fill button-raised color-green">Activation</a> <p>Si vous ne pouvez pas scanner le code :</p> <a onclick="register();" class="button button-fill button-raised color-green">Activation sans scan</a> </p>';
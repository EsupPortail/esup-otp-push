/** jQuery Initialisation **/
(function ($) {
    $(function () {
        $('.button-collapse').sideNav({'edge': 'left'});
        $('.collapsible').collapsible({
            accordion: false // A setting that changes the collapsible behavior to expandable instead of the default accordion style
        });

    }); // end of document ready
})(jQuery); // end of jQuery name space

var app = new Vue({
    el: '#app',
    data: {
        pageTitle: 'Esup Auth',
        mode : 'test',
        currentView: 'home',
        storage: undefined,
        uid: undefined,
        url: undefined,
        gcm_id: undefined,
        platform: undefined,
        manufacturer: undefined,
        model: undefined,
        tokenSecret: undefined,
        additionalData: {
            text : undefined,
            action : undefined,
            lt : undefined
        },
        push: undefined,
        notified : false

    },
    created: function () {
        document.addEventListener("deviceready", this.init, false);
    },
    methods: {
        init : function () {
            navigator.splashscreen.hide();
            if (cordova.platformId != 'android') {
                StatusBar.backgroundColorByHexString("#212121");
            }
            this.storage= window.localStorage;
            this.uid= this.storage.getItem('uid');
            this.url= this.storage.getItem('url');
            this.tokenSecret=this.storage.getItem('tokenSecret');
            this.platform = device.platform;
            this.manufacturer = device.manufacturer;
            this.model = device.model
            this.push_init();
        },
        navigate: function (event) {
            this.currentView = event.target.name;
            $('a').parent().removeClass('active');
            $('#' + event.target.name).parent().addClass('active');
            if (document.getElementById("sidenav-overlay"))$('#navButton').click();
        },

        push_init: function () {
            var self = this;
            this.push = PushNotification.init({
                "android": {"senderID": "703115166283"},
                "ios": {"alert": "true", "badge": "true", "sound": "true"}, "windows": {}
            });

            this.push.on('registration', function (data) {
                if (self.gcm_id == null)
                {
                    self.gcm_id = data.registrationId;
                }
            });

            this.push.on('notification', function (data) {
                self.additionalData = data.additionalData;
                self.notification();
            });

            this.push.on('error', function (e) {
                Materialize.toast(e.message, 4000);
            });
        },

        scan: function () {
            var self = this;
            cordova.plugins.barcodeScanner.scan(
                function (result) {
                    if (!result.cancelled) {
                        if (document.getElementById("sidenav-overlay"))$('#navButton').click();
                        self.sync(result.text.split('users')[0], result.text.split('/')[4], result.text.split('/')[7]);
                    }
                    else {
                        Materialize.toast("Scan annulé", 4000)
                    }
                },
                function (error) {
                    Materialize.toast("Scan raté: " + error, 4000)
                }
            );

        },

        scanless: function () {
            if(!this.uid_input || this.uid_input=='' ){
                Materialize.toast('Nom de compte nécessaire.', 4000);
                return;
            }
            if(!this.code_input || this.code_input==''){
                Materialize.toast('Code nécessaire.', 4000);
                return;
            }
            if(this.code_input.length<6){
                Materialize.toast('Code invalide.', 4000);
                return;
            }
            if(!this.host_input || this.host_input=='' ){
                Materialize.toast('Adresse nécessaire.', 4000);
                return;
            }
            if(this.host_input[this.host_input.length-1] !='/' ){
                this.host_input+='/';
            }
            this.sync(this.host_input,this.uid_input, this.code_input);
        },

        sync: function (host, uid, code) {
            $.ajax({
                method : "POST",
                url: host+'users/'+uid + '/methods/push/activate/' + code + '/' + this.gcm_id + '/' + this.platform + '/' + this.manufacturer + '/' + this.model,
                dataType: 'json',
                cache: false,
                success: function(data) {
                    if (data.code == "Ok") {
                        this.uid = uid;
                        this.storage.setItem('uid', uid);
                        this.url = host;
                        this.storage.setItem('url', host);
                        this.tokenSecret = data.tokenSecret;
                        this.storage.setItem('tokenSecret', data.tokenSecret);
                        Materialize.toast("Synchronisation effectuée", 4000);
                        this.navigate({target:{
                            name: 'home'
                        }});
                    } else {
                        Materialize.toast(data, 4000);
                    }
                }.bind(this),
                error: function(xhr, status, err) {
                    Materialize.toast(err.toString(),4000);
                }.bind(this)
            });

        },

        desync: function () {
            $.ajax({
                method : "DELETE",
                url: this.url + 'users/' + this.uid + '/methods/push/' + this.tokenSecret,
                dataType: 'json',
                cache: false,
                success: function(data) {
                }.bind(this),
                error: function(xhr, status, err) {
                    Materialize.toast(err.toString(),4000);
                }.bind(this)
            });
            var self = this;
            this.push.unregister(function() {
                Materialize.toast('Désactivation effectuée', 4000)
                self.uid = null;
                self.storage.removeItem('uid');
                document.location.href = 'index.html';
            }, function() {
                Materialize.toast('Désactivation échouée', 4000)
            });
        },

        notification: function () {
            if (this.additionalData.action == 'auth') {
                this.notified = true;
            } else if (this.additionalData.action == "desync") {
                this.desync();
            }
        },

        accept: function () {
            $.ajax({
                method : "POST",
               url: this.url + 'users/' + this.uid + '/methods/push/' + this.additionalData.lt + '/' + this.tokenSecret,
                dataType: 'json',
                cache: false,
                success: function(data) {
                    this.notified = false;
                    this.additionalData = undefined;
                    navigator.app.exitApp();
                }.bind(this),
                error: function(xhr, status, err) {
                    Materialize.toast(err.toString(),4000);
                }.bind(this)
            });
        },

        reject: function () {
            this.notified = false;
            this.additionalData = undefined;
            navigator.app.exitApp();
        },
    }
});
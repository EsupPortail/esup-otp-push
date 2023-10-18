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
        totp: undefined,
        totpnb: undefined,
        tokenSecret: undefined,
        additionalData: {
            text : undefined,
            action : undefined,
            lt : undefined
        },
        push: undefined,
        notified : false,
        uid_input : undefined,
	code_input : undefined,
	host_input : undefined

    },
    created: function () {
        document.addEventListener("deviceready", this.init, false);
    },

    methods: {
    checkTotp: function () {
      this.totp = localStorage.getItem('totpObjects');
      if (this.totp == "{}" || this.totp == undefined)
        {
          this.totpnb = 0;
        }
        else if(this.totpnb != 1)
        {
           this.totpnb = 1;
	   this.currentView = 'totp';
        }
    },
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
            this.checkTotp();
        },

        navigate: function (event) {
            this.currentView = event.target.name;
            $('a').parent().removeClass('active');
            $('#' + event.target.name).parent().addClass('active');
            if (document.getElementById("sidenav-overlay"))$('#navButton').click();
            this.checkTotp();
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
                        else if (self.gcm_id != data.registrationId) {
                                                        self.refresh(self.url, self.uid, self.tokenSecret, self.gcm_id, data.registrationId);
                                                             }
                                                             else {
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
                url: host+'users/'+ uid + '/methods/push/activate/' + code + '/' + this.gcm_id + '/' + this.platform + '/' + this.manufacturer + '/' + this.model,
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
                        Materialize.toast(data.message, 4000);
                    }
                }.bind(this),
                complete: function(xhr, code) {
                    if (code == "error")
                        Materialize.toast("Une erreur s'est produite", 4000);
                },
                error: function(xhr, status, err) {
                    Materialize.toast(err.toString(),4000);
                }.bind(this)

            });

        },

   refresh: function (url, uid, tokenSecret, gcm_id, registrationId) {
                       $.ajax({
                            method : "POST",
                            url: url + 'users/' + uid + '/methods/push/refresh/' + tokenSecret+ '/' + gcm_id + '/' + registrationId,
                            dataType: 'json',
                            cache: false,
                            success: function(data) {
                                                    if (data.code == "Ok") {
                                                    self.gcm_id=registrationId;
                                                    Materialize.toast("Refresh gcm_id", 4000);
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
desactivateUser: function (url, uid, tokenSecret, gcm_id) {
                       $.ajax({
                            method : "POST",
                            url: url + 'users/' + uid + '/methods/push/desactivate/' + tokenSecret+ '/' + gcm_id,
                            dataType: 'json',
                            cache: false,
                            success: function(data) {
                                                    if (data.code == "Ok") {
                                                    self.gcm_id=registrationId;
                                                    Materialize.toast("Refresh gcm_id", 4000);
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
         if (window.confirm("Voulez-vous vraiment désactiver la connexion avec votre mobile ?")){
            var self = this;
            $.ajax({
                method : "DELETE",
                url: this.url + 'users/' + this.uid + '/methods/push/' + this.tokenSecret,
                dataType: 'json',
                cache: false,
                success: function(data) {
                    document.location.href = 'index.html';
                    Materialize.toast('Désactivation effectuée', 4000)
                    self.uid = null;
                    self.storage.removeItem('uid');
                    self.checkTotp();
                }.bind(this),
                error: function(xhr, status, err) {
                    Materialize.toast(err.toString(),4000);
                }.bind(this)
            });

	}
        },

        notification: function () {
            if (this.additionalData.action == 'auth'){
		if((this.url!=null && this.uid!=null && this.tokenSecret!=null)||this.additionalData.trustGcm_id==true) {
                	this.notified = true;
			this.currentView = 'notify';
		}
   		else {
			this.currentView = 'info';
		}
            } else if (this.additionalData.action == "desync") {
                 var self = this;
                 self.uid = null;
                 self.storage.removeItem('uid');
                 document.location.href = 'index.html';
                 self.checkTotp();
            }
        },

        accept: function () {
            if(this.tokenSecret==null || this.tokenSecret==''||this.tokenSecret==undefined){
                this.tokenSecret=self.gcm_id;
                this.url=this.additionalData.url;
                this.uid=this.additionalData.uid;
            }
            $.ajax({
                method : "POST",
               url: this.url + 'users/' + this.uid + '/methods/push/' + this.additionalData.lt + '/' + this.tokenSecret,
                dataType: 'json',
                cache: false,
                success: function(data) {
                    if (data.code == "Ok" && data.tokenSecret!=null) {
                        this.storage.setItem('uid', this.uid);
                        this.storage.setItem('url', this.url);
                        this.tokenSecret = data.tokenSecret;
                        this.storage.setItem('tokenSecret', data.tokenSecret);
                        };
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

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
        gcm_id: undefined,
        platform: undefined,
        manufacturer: undefined,
        model: undefined,
        totp: undefined,
        totpnb: undefined,
        additionalData: {
            text : undefined,
            action : undefined,
            lt : undefined,
            totpKey : undefined
        },
        otpServersObjects: {},
        otpServersStack:[],
        push: undefined,
        notified : false,
        uid_input : undefined,
	code_input : undefined,
	host_input : undefined

    },
    created: function () {
        document.addEventListener("deviceready", this.init, false);
        document.addEventListener("resume", this.initAuth, false);
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
            this.initOTPServers();
            this.transfer2OtpServers();
            this.platform = device.platform;
            this.manufacturer = device.manufacturer;
            this.model = device.model
            this.gcm_id=this.storage.getItem('gcm_id');
            this.push_init();
            this.initAuth();
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
                            this.storage.setItem("gcm_id",self.gcm_id);
                        }
                        else if (self.gcm_id != data.registrationId) {
                            for(otpServer in this.otpServersObjects)
                                self.refresh(otpServer.host, otpServer.uid, otpServer.tokenSecret, self.gcm_id, data.registrationId);
                            self.gcm_id = data.registrationId;
                            this.storage.setItem("gcm_id",self.gcm_id);
                        }
                    });

                    this.push.on('notification', function (data) {
                        self.additionalData = data.additionalData;
                        self.additionalData.otpServer=data.additionalData.url+data.additionalData.uid
                        self.notification();
                    });

                    this.push.on('error', function (e) {
                        Materialize.toast(e.message, 4000);
                    });
                },
        initAuth: function(){
            this.otpServersStack=[];
            for(otpServer in this.otpServersObjects)
                this.otpServersStack.push(otpServer);

            this.otpServerStatus(this.otpServersStack.pop());
        },
        otpServerStatus: function(otpServer){
            var self = this;
            if(otpServer==null) return;
            if(this.otpServersObjects[otpServer].host!=null && this.otpServersObjects[otpServer].uid!=null && this.otpServersObjects[otpServer].tokenSecret!=null){
                $.ajax({
                    method : "GET",
                    url: this.otpServersObjects[otpServer].host + 'users/' + this.otpServersObjects[otpServer].uid + '/methods/push/' + this.otpServersObjects[otpServer].tokenSecret,
                    dataType: 'json',
                    cache: false,
                    success: function(data) {
                        if (data.code == "Ok") {
                            this.additionalData=data;
                            this.additionalData.otpServer=otpServer;
                            self.notification();
                        }
                        else{
                            this.otpServerStatus(this.otpServersStack.pop());
                        }
                    }.bind(this)
                });
            }
        },
        initOTPServers : function(){
            var otpServers = localStorage.getItem('otpServers');
            if (otpServers != null) {
                this.otpServersObjects=JSON.parse(otpServers);
            }
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
                        this.otpServersObjects[host+uid]={
                            'host':host,
                            'hostToken':data.hostToken,
                            'tokenSecret':data.tokenSecret,
                            'hostName':data.hostName,
                            'uid':uid
                        }
                        this.storage.setItem('otpServers', JSON.stringify(this.otpServersObjects));
                        Materialize.toast("Synchronisation effectuée", 4000);
                        if(data.autoActivateTotp){
                            this.additionalData.totpKey=data.totpKey;
                            this.autoActivateTotp(host+uid);
                        }
                        else
                            this.navigate({target:{
                                name: 'home'
                            }});
                             this.$forceUpdate();
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

        autoActivateTotp: function(otpServer){
            $.ajax({
                method : "POST",
                url: this.otpServersObjects[otpServer].host+'users/'+ this.otpServersObjects[otpServer].uid + '/methods/totp/autoActivateTotp/' + this.otpServersObjects[otpServer].tokenSecret,
                dataType: 'json',
                cache: false,
                success: function(data) {
                    if (data.code == "Ok") {
                        setAccount(this.additionalData.totpKey,this.getName(otpServer));
                        Materialize.toast("Activation TOTP effectuée", 4000);
                    }
                    this.navigate({target:{
                        name: 'home'
                    }});
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
        desync: function (otpServer) {
         if (window.confirm("Voulez-vous vraiment désactiver la connexion de "+ this.getName(otpServer)+" avec votre mobile ?"))
            this.user_desync(otpServer);
        },
    user_desync: function(otpServer){
        var self = this;
            $.ajax({
                method : "DELETE",
                url: this.otpServersObjects[otpServer].host + 'users/' + this.otpServersObjects[otpServer].uid + '/methods/push/' + this.otpServersObjects[otpServer].tokenSecret,
                dataType: 'json',
                cache: false,
                success: function(data) {
                    Materialize.toast('Désactivation effectuée', 4000)
                    delete this.otpServersObjects[otpServer];             
                    self.storage.setItem('otpServers',JSON.stringify(this.otpServersObjects));
                    if(this.push!=null) this.push.clearAllNotifications();
                    self.checkTotp();
                    this.$forceUpdate();
                }.bind(this),
                error: function(xhr, status, err) {
                    Materialize.toast(err.toString()+"Oups!! Probablement que le serveur n'est pas joignable",4000);
                    }.bind(this)        
            });
    },
        notification: function () {
            //trusth trustGcm_id
            if(this.otpServersObjects[this.additionalData.otpServer]==null && this.additionalData.trustGcm_id==true){
                this.otpServersObjects[this.additionalData.otpServer]={
                    host:this.additionalData.url,
                    hostToken:this.additionalData.hostToken,
                    uid:this.additionalData.uid,
                    tokenSecret:this.gcm_id
                }
            }
            //recupération du token associé au host. on pourra supprimer ce code qd tout le monde aura migré
            //il faudra remplacer ce code par
            //if(this.otpServersObjects[this.additionalData.otpServer].hostToken!=this.additionalData.hostToken) return;
   
            if(this.otpServersObjects[this.additionalData.otpServer].hostToken==null && this.additionalData.hostToken!=null){                
                this.otpServersObjects[this.additionalData.otpServer].hostToken=this.additionalData.hostToken;
                this.storage.setItem('otpServers',JSON.stringify(this.otpServersObjects));
            }  
            //MAJ libellé du serveur
            if(this.otpServersObjects[this.additionalData.otpServer].hostName!=this.additionalData.hostName && this.otpServersObjects[this.additionalData.otpServer].hostToken==this.additionalData.hostToken){
                this.otpServersObjects[this.additionalData.otpServer].hostName=this.additionalData.hostName;
                this.storage.setItem('otpServers',JSON.stringify(this.otpServersObjects));
            } 
            if (this.additionalData.action == 'auth'){
                if(this.additionalData.otpServer!=null && this.otpServersObjects[this.additionalData.otpServer].host!=null && this.additionalData.hostToken==this.otpServersObjects[this.additionalData.otpServer].hostToken){
                	this.notified = true;
                    this.additionalData.text=this.additionalData.text.replace("compte","compte "+ this.getName(this.additionalData.otpServer)+" ");
			        this.currentView = 'notify';
		        }
   		        else {
			        this.currentView = 'info';
		        }
            } else if (this.additionalData.action == "desync" && this.additionalData.hostToken==this.otpServersObjects[this.additionalData.otpServer].hostToken) {
                    this.user_desync(this.additionalData.otpServer);
                    this.otpServerStatus(this.otpServersStack.pop());
            }
        },

        accept: function () {
            if(this.additionalData.hostToken==this.otpServersObjects[this.additionalData.otpServer].hostToken)
            $.ajax({
                method : "POST",
                url: this.otpServersObjects[this.additionalData.otpServer].host + 'users/' + this.otpServersObjects[this.additionalData.otpServer].uid + '/methods/push/' + this.additionalData.lt + '/' + this.otpServersObjects[this.additionalData.otpServer].tokenSecret,
                dataType: 'json',
                cache: false,
                success: function(data) {
                    if (data.code == "Ok" && data.tokenSecret!=null) {
                        this.otpServersObjects[this.additionalData.otpServer].tokenSecret=data.tokenSecret;
                        this.storage.setItem('otpServers',JSON.stringify(this.otpServersObjects));
                    }
                    this.notified = false;
                    this.additionalData = undefined;
                    Materialize.toast("Authentification réussie!!!",4000);
                    if(this.push!=null) this.push.clearAllNotifications();
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
        //on pourra supprimer ce code qd tout le monde aura migré
        transfer2OtpServers: function(){
            let uid= this.storage.getItem('uid');
            let url= this.storage.getItem('url');
            let tokenSecret=this.storage.getItem('tokenSecret');
            if(uid!=null && url!=null && tokenSecret!=null){
                this.otpServersObjects[url+uid]={
                    "host":url,
                    "uid":uid,
                    "tokenSecret":tokenSecret
                };
                this.storage.setItem('otpServers',JSON.stringify(this.otpServersObjects));
                this.storage.removeItem('uid');
                this.storage.removeItem('url');
                this.storage.removeItem('tokenSecret');
            }
        },
        getName(otpServer){
            if(this.otpServersObjects[otpServer].hostName==null || this.otpServersObjects[otpServer].hostName=="Esup Auth"){
                let urlObj = new URL(this.otpServersObjects[otpServer].host);
                return urlObj.hostname.split('.').slice(-2).join('.')+" ("+this.otpServersObjects[otpServer].uid+")";
            }
            else
                return this.otpServersObjects[otpServer].hostName+" ("+this.otpServersObjects[otpServer].uid+")";
        }
    }
});

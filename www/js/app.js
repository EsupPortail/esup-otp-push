/** jQuery Initialisation **/
(function ($) {
  $(function () {
    $(".button-collapse").sideNav({ edge: "left" });
    $(".collapsible").collapsible({
      accordion: false, // A setting that changes the collapsible behavior to expandable instead of the default accordion style
    });
  }); // end of document ready
})(jQuery); // end of jQuery name space

var app = new Vue({
  el: "#app",
  data: {
    isMenuOpen: false,
    pageTitle: "Esup Auth",
    mode: "test",
    currentView: "home",
    storage: undefined,
    sharedPreferences: undefined,
    isMigrationDone: undefined,
    nfcListener: undefined,
    migrationManager: undefined,
    gcm_id: undefined,
    platform: undefined,
    manufacturer: undefined,
    model: undefined,
    totp: undefined,
    totpnb: undefined,
    message: "",
    esupNfcTagUrl: "",
    additionalData: {
      text: undefined,
      action: undefined,
      lt: undefined,
      totpKey: undefined,
    },
    otpServersObjects: {},
    otpServersStack: [],
    push: undefined,
    notified: false,
    uid_input: undefined,
    code_input: undefined,
    host_input: undefined,
    establishments: [],
    showBottomSheet: false,
    showSuccess: false,
  },
  created: function () {
    document.addEventListener("deviceready", this.init, false);
    document.addEventListener("resume", this.initAuth, false);
  },

  methods: {
    init: async function () {
      navigator.splashscreen.hide();
      if (cordova.platformId != "android") {
        StatusBar.backgroundColorByHexString("#212121");
      }
      
      this.storage = window.localStorage;
      this.sharedPreferences = window.plugins.SharedPreferences.getInstance("settings");
      this.migrationManager = new MigrationManager();
      this.migrationManager.hello();

      await this.migrationManager.initializeApp();
      await this.migrationManager.startMigration().then(
        async () => {
          addT();
          populateTable();
          this.push_init();
          this.checkTotp();
          this.initOTPServers();
          this.transfer2OtpServers();
          this.loadStoredEstablishments();
          this.gcm_id = await this.GETsharedPreferences("gcm_id")
        },
      );
      
      this.isMigrationDone = localStorage.getItem("isMigrationDone");
      console.log("✅ isMigrationDone :", this.isMigrationDone);

      this.showSharedPreferences();
      /*this.checkTotp();
      this.initOTPServers();
      this.transfer2OtpServers();

      await this.loadStoredEstablishments(); // Charger les établissements stockés*/

      this.platform = device.platform;
      this.manufacturer = device.manufacturer;
      this.model = device.model;

      this.requestNotificationPermission();
      this.initAuth();
    },
    handleAddAccountAndNavigate: function () {
      this.addAccount();
      this.navigate();
    },
    scanTag: function () {
      //scanTag() ne fonctionne que sur iOS
      nfc
        .scanTag()
        .then(async (tag) => {
          let cardId = nfc.bytesToHexString(tag.id);
          let cardIdArr = cardId.split(" ");
          // Le tag NFC a été scanné avec succès
          //alert(`Tag NFC détecté : ${JSON.stringify(tag)}`);
          console.log(`Tag NFC détecté : ${JSON.stringify(tag)}`);
          //await nfc.connect("android.nfc.tech.IsoDep", 500);

          this.sendCsnToServer(cardIdArr)
            .then((response) => {
              console.log("Réponse du serveur:", response);
            })
            .catch((error) => {
              console.error("Erreur lors de l'envoi des données:", error);
            });

          // Ci dessous la méthode pour le desfire
          //await this.desfireRead(cardId, tag);
        })
        .catch((err) => {
          // En cas d'échec lors du scan NFC
          alert(`Erreur lors du scan NFC: ${err}`);
        });
    },
    openMenu: function () {
      if (this.isMenuOpen) return;
      this.isMenuOpen = true;
      this.$nextTick(() => {
        document
          .getElementById("navButton")
          .setAttribute("aria-expanded", "true");
        const sidenav = document.getElementById("slide-out");
        sidenav.setAttribute("aria-hidden", "false"); // Le menu devient accessible
        sidenav.classList.add("open");
      });
    },

    closeMenu: function () {
      if (!this.isMenuOpen) return;
      this.isMenuOpen = false;
      this.$nextTick(() => {
        document
          .getElementById("navButton")
          .setAttribute("aria-expanded", "false");
        const sidenav = document.getElementById("slide-out");
        sidenav.setAttribute("aria-hidden", "true"); // Le menu est caché des lecteurs d'écran
        sidenav.classList.remove("open");
        if (document.getElementById("sidenav-overlay")) $("#navButton").click();
      });
    },
    checkTotp: function () {
      //this.totp = localStorage.getItem("totpObjects");
      var self = this;
      this.sharedPreferences.get(
        "totpObjects",
        (totp) => {
          console.log("CHECKTOTP--------");
          self.totp = totp;
          console.log(self.totp);
          console.log(self.totpnb);
          if (self.totp == "{}" || self.totp == undefined) {
            self.totpnb = 0;
          } else if (self.totpnb != 1) {
            self.totpnb = 1;
            self.currentView = "totp";
          }
          console.log(self.totpnb);
        },
        (error) => {
          console.log(
            "Erreur lors de la récupération des codes TOTP : ",
            error
          );
        }
      );
    },
    requestNotificationPermission: function () {
      if (this.platform === "Android" && parseInt(device.version) >= 13) {
        var permissions = cordova.plugins.permissions;
        var permission = permissions.POST_NOTIFICATIONS;

        permissions.checkPermission(
          permission,
          function (status) {
            if (status.hasPermission) {
              console.log("Permission already granted");
            } else {
              console.log("Permission not yet granted");
              permissions.requestPermission(
                permission,
                function (status) {
                  if (status.hasPermission) {
                    console.log("Permission granted");
                  } else {
                    console.warn("Permission denied");
                  }
                },
                function () {
                  console.error("Error requesting permission");
                }
              );
            }
          },
          function () {
            console.error("Error checking permission");
            // Gérer les erreurs lors de la vérification de la permission
          }
        );
      }
    },

    navigate: function (event) {
      this.currentView = event.target.name;
      $("button").parent().removeClass("active");
      $("#" + event.target.name)
        .parent()
        .addClass("active");
      if (document.getElementById("sidenav-overlay")) $("#navButton").click();
      // si l'utilisateur veut se déplacer vers Authentification NFC et qu'il n'y a qu'un seul établissement
      if (event.target.name == "nfc" && this.establishments.length == 1) {
        this.scanTagForEstablishment(
          this.establishments[0].url,
          this.establishments[0].numeroId
        );
      }
      this.checkTotp();
      setTimeout(() => {
        this.closeMenu();
      }, 300);
    },
    push_init: function () {
      var self = this;
      this.push = PushNotification.init({
        android: { senderID: "703115166283" },
        ios: { alert: "true", badge: "true", sound: "true" },
        windows: {},
      });

      this.push.on("registration", async function (data) {
        if (self.gcm_id == null) {
          self.gcm_id = data.registrationId;
          //self.storage.setItem("gcm_id", self.gcm_id);
          await self.migrationManager.setSharedPreference("gcm_id", self.gcm_id);
        } else if (self.gcm_id != data.registrationId) {
          for (otpServer in this.otpServersObjects)
            self.refresh(
              otpServer.host,
              otpServer.uid,
              otpServer.tokenSecret,
              self.gcm_id,
              data.registrationId
            );
          self.gcm_id = data.registrationId;
          //self.storage.setItem("gcm_id", self.gcm_id);
          await self.migrationManager.setSharedPreference("gcm_id", self.gcm_id);
        }
      });

      this.push.on("notification", function (data) {
        self.additionalData = data.additionalData;
        if (!data.additionalData.url.endsWith("/"))
          data.additionalData.url += "/";
        self.additionalData.otpServer =
          data.additionalData.url + data.additionalData.uid;
        self.notification();
      });

      this.push.on("error", function (e) {
        Materialize.toast('<div role="alert">' + e.message + "</div>", 4000);
      });
    },
    initAuth: function () {
      this.otpServersStack = [];
      for (otpServer in this.otpServersObjects)
        this.otpServersStack.push(otpServer);

      this.otpServerStatus(this.otpServersStack.pop());
    },
    otpServerStatus: function (otpServer) {
      var self = this;
      if (otpServer == null) return;
      if (
        this.otpServersObjects[otpServer].host != null &&
        this.otpServersObjects[otpServer].uid != null &&
        this.otpServersObjects[otpServer].tokenSecret != null
      ) {
        $.ajax({
          method: "GET",
          url:
            this.otpServersObjects[otpServer].host +
            "users/" +
            this.otpServersObjects[otpServer].uid +
            "/methods/push/" +
            this.otpServersObjects[otpServer].tokenSecret,
          dataType: "json",
          cache: false,
          success: function (data) {
            if (data.code == "Ok") {
              this.additionalData = data;
              this.additionalData.otpServer = otpServer;
              self.notification();
            } else {
              this.otpServerStatus(this.otpServersStack.pop());
            }
          }.bind(this),
        });
      }
    },
    initOTPServers: function () {
      this.sharedPreferences.get(
        "otpServers",
        (otpServers) => {
          if (otpServers != null) {
            this.otpServersObjects = JSON.parse(otpServers);
          }
        },
        (error) => {
          console.log(
            "Erreur lors de la récupération des serveurs OTP : ",
            error
          );
        }
      );
    },
    scan: function () {
      var self = this;
      cordova.plugins.barcodeScanner.scan(
        function (result) {
          if (!result.cancelled) {
            if (document.getElementById("sidenav-overlay"))
              $("#navButton").click();
            self.sync(
              result.text.split("users")[0],
              result.text.split("/")[4],
              result.text.split("/")[7]
            );
          } else {
            Materialize.toast('<div role="alert">Scan annulé</div>', 4000);
          }
        },
        function (error) {
          Materialize.toast(
            '<div role="alert">Scan raté: ' + error + "</div>",
            4000
          );
        }
      );
    },

    scanless: function () {
      if (!this.uid_input || this.uid_input == "") {
        Materialize.toast(
          '<div role="alert">Nom de compte nécessaire.</div>',
          4000
        );
        return;
      }
      if (!this.code_input || this.code_input == "") {
        Materialize.toast('<div role="alert">Code nécessaire.</div>', 4000);
        return;
      }
      if (this.code_input.length < 6) {
        Materialize.toast('<div role="alert">Code invalide.</div>', 4000);
        return;
      }
      if (!this.host_input || this.host_input == "") {
        Materialize.toast('<div role="alert">Adresse nécessaire.</div>', 4000);
        return;
      }
      if (this.host_input[this.host_input.length - 1] != "/") {
        this.host_input += "/";
      }
      this.sync(this.host_input, this.uid_input.trim(), this.code_input);
    },

    sync: function (host, uid, code) {
      $.ajax({
        method: "POST",
        url:
          host +
          "users/" +
          uid +
          "/methods/push/activate/" +
          code +
          "/" +
          this.gcm_id +
          "/" +
          this.platform +
          "/" +
          this.manufacturer +
          "/" +
          this.model,
        dataType: "json",
        cache: false,
        success: function (data) {
          if (data.code == "Ok") {
            this.otpServersObjects[host + uid] = {
              host: host,
              hostToken: data.hostToken,
              tokenSecret: data.tokenSecret,
              hostName: data.hostName,
              uid: uid,
            };
            /*this.storage.setItem(
              "otpServers",
              JSON.stringify(this.otpServersObjects)
            );*/
            this.migrationManager.setSharedPreference(
              "otpServers",
              this.otpServersObjects
            );
            Materialize.toast(
              '<div role="alert">Synchronisation effectuée</div>',
              4000
            );
            if (data.autoActivateTotp) {
              this.additionalData.totpKey = data.totpKey;
              this.autoActivateTotp(host + uid);
            } else
              this.navigate({
                target: {
                  name: "home",
                },
              });
            this.$forceUpdate();
          } else {
            Materialize.toast(
              '<div role="alert">' + data.message + "</div>",
              4000
            );
          }
        }.bind(this),
        complete: function (xhr, code) {
          if (code == "error")
            Materialize.toast(
              '<div role="alert">Une erreur s\'est produite</div>',
              4000
            );
        },
        error: function (xhr, status, err) {
          Materialize.toast(
            '<div role="alert">' + err.toString() + "</div>",
            4000
          );
        }.bind(this),
      });
    },

    autoActivateTotp: function (otpServer) {
      $.ajax({
        method: "POST",
        url:
          this.otpServersObjects[otpServer].host +
          "users/" +
          this.otpServersObjects[otpServer].uid +
          "/methods/totp/autoActivateTotp/" +
          this.otpServersObjects[otpServer].tokenSecret,
        dataType: "json",
        cache: false,
        success: function (data) {
          if (data.code == "Ok") {
            setAccount(this.additionalData.totpKey, this.getName(otpServer));
            Materialize.toast(
              '<div role="alert">Activation TOTP effectuée</div>',
              4000
            );
          }
          this.navigate({
            target: {
              name: "home",
            },
          });
        }.bind(this),
        complete: function (xhr, code) {
          if (code == "error")
            Materialize.toast(
              '<div role="alert">Activation TOTP effectuée</div>',
              4000
            );
        },
        error: function (xhr, status, err) {
          Materialize.toast(
            '<div role="alert">' + err.toString() + "</div>",
            4000
          );
        }.bind(this),
      });
    },

    refresh: function (url, uid, tokenSecret, gcm_id, registrationId) {
      $.ajax({
        method: "POST",
        url:
          url +
          "users/" +
          uid +
          "/methods/push/refresh/" +
          tokenSecret +
          "/" +
          gcm_id +
          "/" +
          registrationId,
        dataType: "json",
        cache: false,
        success: async function (data) {
          if (data.code == "Ok") {
            self.gcm_id = registrationId;
            //this.storage.setItem("gcm_id", registrationId);
            await this.migrationManager.setSharedPreference(
              "gcm_id",
              registrationId
            );
            Materialize.toast('<div role="alert">Refresh gcm_id</div>', 4000);
            this.navigate({
              target: {
                name: "home",
              },
            });
          } else {
            Materialize.toast(data, 4000);
          }
        }.bind(this),
        error: function (xhr, status, err) {
          Materialize.toast(
            '<div role="alert">' + err.toString() + "</div>",
            4000
          );
        }.bind(this),
      });
    },
    desactivateUser: function (url, uid, tokenSecret, gcm_id) {
      $.ajax({
        method: "POST",
        url:
          url +
          "users/" +
          uid +
          "/methods/push/desactivate/" +
          tokenSecret +
          "/" +
          gcm_id,
        dataType: "json",
        cache: false,
        success: function (data) {
          if (data.code == "Ok") {
            self.gcm_id = registrationId;
            Materialize.toast('<div role="alert">Refresh gcm_id</div>', 4000);
            this.navigate({
              target: {
                name: "home",
              },
            });
          } else {
            Materialize.toast('<div role="alert">' + data + "</div>", 4000);
          }
        }.bind(this),
        error: function (xhr, status, err) {
          Materialize.toast(
            '<div role="alert">' + err.toString() + "</div>",
            4000
          );
        }.bind(this),
      });
    },
    desync: function (otpServer) {
      if (
        window.confirm(
          "Voulez-vous vraiment désactiver la connexion de " +
            this.getName(otpServer) +
            " avec votre mobile ?"
        )
      )
        this.user_desync(otpServer);
    },
    user_desync: function (otpServer) {
      var self = this;
      $.ajax({
        method: "DELETE",
        url:
          this.otpServersObjects[otpServer].host +
          "users/" +
          this.otpServersObjects[otpServer].uid +
          "/methods/push/" +
          this.otpServersObjects[otpServer].tokenSecret,
        dataType: "json",
        cache: false,
        success: function (data) {
          Materialize.toast(
            '<div role="alert">Désactivation effectuée</div>',
            4000
          );
          delete this.otpServersObjects[otpServer];
          /*self.storage.setItem(
            "otpServers",
            JSON.stringify(this.otpServersObjects)
          );*/
          self.migrationManager.setSharedPreference(
            "otpServers",
            this.otpServersObjects
          );
          if (this.push != null) this.push.clearAllNotifications();
          self.checkTotp();
          this.$forceUpdate();
        }.bind(this),
        error: function (xhr, status, err) {
          Materialize.toast(
            '<div role="alert">' +
              err.toString() +
              " Oups!! Probablement que le serveur n'est pas joignable</div>",
            4000
          );
        }.bind(this),
      });
    },
    notification: function () {
      //trusth trustGcm_id
      if (
        this.otpServersObjects[this.additionalData.otpServer] == null &&
        this.additionalData.trustGcm_id == true
      ) {
        this.otpServersObjects[this.additionalData.otpServer] = {
          host: this.additionalData.url,
          hostToken: this.additionalData.hostToken,
          uid: this.additionalData.uid,
          tokenSecret: this.gcm_id,
        };
      }
      //recupération du token associé au host. on pourra supprimer ce code qd tout le monde aura migré
      //il faudra remplacer ce code par
      //if(this.otpServersObjects[this.additionalData.otpServer].hostToken!=this.additionalData.hostToken) return;

      if (
        this.otpServersObjects[this.additionalData.otpServer].hostToken ==
          null &&
        this.additionalData.hostToken != null
      ) {
        this.otpServersObjects[this.additionalData.otpServer].hostToken =
          this.additionalData.hostToken;
        /*this.storage.setItem(
          "otpServers",
          JSON.stringify(this.otpServersObjects)
        );*/
        this.migrationManager.setSharedPreference(
          "otpServers",
          this.otpServersObjects
        );
      }
      //MAJ libellé du serveur
      if (
        this.otpServersObjects[this.additionalData.otpServer].hostName !=
          this.additionalData.hostName &&
        this.otpServersObjects[this.additionalData.otpServer].hostToken ==
          this.additionalData.hostToken
      ) {
        this.otpServersObjects[this.additionalData.otpServer].hostName =
          this.additionalData.hostName;
        /*this.storage.setItem(
          "otpServers",
          JSON.stringify(this.otpServersObjects)
        );*/
        this.migrationManager.setSharedPreference(
          "otpServers",
          this.otpServersObjects
        );
      }
      if (this.additionalData.action == "auth") {
        if (
          this.additionalData.otpServer != null &&
          this.otpServersObjects[this.additionalData.otpServer].host != null &&
          this.additionalData.hostToken ==
            this.otpServersObjects[this.additionalData.otpServer].hostToken
        ) {
          this.notified = true;
          this.additionalData.text = this.additionalData.text.replace(
            "compte",
            "compte " + this.getName(this.additionalData.otpServer) + " "
          );
          this.currentView = "notify";
        } else {
          this.currentView = "info";
        }
      } else if (
        this.additionalData.action == "desync" &&
        this.additionalData.hostToken ==
          this.otpServersObjects[this.additionalData.otpServer].hostToken
      ) {
        this.user_desync(this.additionalData.otpServer);
        this.otpServerStatus(this.otpServersStack.pop());
      }
    },

    accept: function () {
      if (
        this.additionalData.hostToken ==
        this.otpServersObjects[this.additionalData.otpServer].hostToken
      )
        $.ajax({
          method: "POST",
          url:
            this.otpServersObjects[this.additionalData.otpServer].host +
            "users/" +
            this.otpServersObjects[this.additionalData.otpServer].uid +
            "/methods/push/" +
            this.additionalData.lt +
            "/" +
            this.otpServersObjects[this.additionalData.otpServer].tokenSecret,
          dataType: "json",
          cache: false,
          success: function (data) {
            if (data.code == "Ok" && data.tokenSecret != null) {
              this.otpServersObjects[
                this.additionalData.otpServer
              ].tokenSecret = data.tokenSecret;
              /*this.storage.setItem(
                "otpServers",
                JSON.stringify(this.otpServersObjects)
              );*/
              this.migrationManager.setSharedPreference(
                "otpServers",
                this.otpServersObjects
              );
            }
            this.notified = false;
            this.additionalData = undefined;
            Materialize.toast(
              '<div role="alert">Authentification réussie!!!</div>',
              4000
            );
            if (this.push != null) this.push.clearAllNotifications();
            navigator.app.exitApp();
          }.bind(this),
          error: function (xhr, status, err) {
            Materialize.toast(
              '<div role="alert">' + err.toString() + "</div>",
              4000
            );
          }.bind(this),
        });
    },

    reject: function () {
      this.notified = false;
      this.additionalData = undefined;
      navigator.app.exitApp();
    },
    //on pourra supprimer ce code qd tout le monde aura migré
    transfer2OtpServers: function () {
      let uid = this.storage.getItem("uid");
      let url = this.storage.getItem("url");
      let tokenSecret = this.storage.getItem("tokenSecret");
      if (uid != null && url != null && tokenSecret != null) {
        this.otpServersObjects[url + uid] = {
          host: url,
          uid: uid,
          tokenSecret: tokenSecret,
        };
        this.storage.setItem(
          "otpServers",
          JSON.stringify(this.otpServersObjects)
        );
        this.storage.removeItem("uid");
        this.storage.removeItem("url");
        this.storage.removeItem("tokenSecret");
      }
    },
    getName(otpServer) {
      if (
        this.otpServersObjects[otpServer].hostName == null ||
        this.otpServersObjects[otpServer].hostName == "Esup Auth"
      ) {
        let urlObj = new URL(this.otpServersObjects[otpServer].host);
        return (
          urlObj.hostname.split(".").slice(-2).join(".") +
          " (" +
          this.otpServersObjects[otpServer].uid +
          ")"
        );
      } else
        return (
          this.otpServersObjects[otpServer].hostName +
          " (" +
          this.otpServersObjects[otpServer].uid +
          ")"
        );
    },
    async desfireRead(cardId, tag, etablissementUrl, numeroId) {
      let result = "";
      let nfcResult = {
        code: "ERROR",
      };

      try {
        // Initialiser la communication avec la carte NFC via IsoDep
        console.log("Starting communication with Desfire tag");

        // Boucle principale pour communiquer avec le serveur
        while (true) {
          // Appel au serveur pour récupérer la prochaine commande APDU à envoyer
          let response = await this.desfireHttpRequestAsync(
            `result=${result}`,
            `cardId=${cardId}`,
            etablissementUrl,
            numeroId
          );

          // Parse la réponse du serveur
          nfcResult = JSON.parse(response);

          // Si le code est CONTINUE, on continue la séquence APDU
          if (nfcResult.code === "CONTINUE") {
            alert("Desfire error, but server requests to continue...");
            result = ""; // Réinitialiser le résultat pour recommencer la séquence APDU
          }
          // Si le code est END ou ERROR, on sort de la boucle
          else if (nfcResult.code === "END" || nfcResult.code === "ERROR") {
            break;
          }
          // Sinon, on envoie la commande APDU et récupère le résultat
          else {
            let command = nfcResult.fullApdu;
            console.log("Sending command: " + command);

            // Simuler l'envoi de la commande APDU et obtenir le résultat
            let byteResult = await this.sendApduCommandToTag(tag, command);
            console.log("Result 1 from card: " + byteResult);
            if (!byteResult) {
              console.error("Failed to receive response from card.");
              throw new Error("No response from card.");
            }
            result = this.byteArrayToHexString(byteResult); // Convertir le résultat en hexadécimal
            console.log("Result 2 from card: " + result);

            // Mettre à jour le résultat dans nfcResult pour l'étape suivante
            nfcResult.fullApdu = result;
          }
        }

        console.log("Process complete. Result: ", nfcResult);
        return nfcResult;
      } catch (error) {
        console.error("Error during Desfire read process: " + error.message);
        Materialize.toast(
          '<div role="alert">Carte invalide ou Méthode d\'authentification non activée</div>',
          5000
        );
      }
    },
    desfireHttpRequestAsync: async function (
      param1,
      param2,
      etablissementUrl,
      numeroId
    ) {
      try {
        const url = `${etablissementUrl}/desfire-ws?${param1}&${param2}&numeroId=${numeroId}`;
        console.log("Requesting URL: " + url);

        // Effectuer la requête HTTP GET avec le plugin avancé
        const response = await new Promise((resolve, reject) => {
          cordova.plugin.http.get(
            url, // URL de la requête
            {}, // Pas de paramètres supplémentaires
            {}, // Pas d'en-têtes supplémentaires
            (response) => {
              // Si la requête est réussie
              resolve(response);
            },
            (error) => {
              // Si la requête échoue
              reject(error);
            }
          );
        });

        // Vérifier la réussite de la requête en vérifiant le statut
        if (response.status !== 200) {
          throw new Error("HTTP error! Status: " + response.status);
        }

        // Lire et retourner la réponse du serveur
        return response.data; // `response.data` contient le texte de la réponse
      } catch (error) {
        console.error("Error during HTTP request: " + error.message);
        throw new Error("HTTP request failed: " + error.message);
      }
    },
    hexStringToByteArray: function (hexString) {
      if (!hexString) {
        return new Uint8Array();
      }

      let byteArray = new Uint8Array(hexString.length / 2);

      for (let i = 0; i < hexString.length; i += 2) {
        byteArray[i / 2] = parseInt(hexString.substr(i, 2), 16);
      }

      return byteArray;
    },
    byteArrayToHexString: function (byteArray) {
      return Array.from(byteArray, function (byte) {
        return ("0" + (byte & 0xff).toString(16)).slice(-2);
      }).join("");
    },
    sendApduCommandToTag: function (tag, command) {
      let responseGlobal;
      return new Promise(async (resolve, reject) => {
        try {
          console.log("Connected to tag:", tag.tag.id);

          // Envoyer la commande APDU à la carte
          try {
            console.log("Calling transceive with command: " + command);
            const response = await nfc.transceive(
              command,
              function (data) {
                console.log("Received data from card: " + data);
              },
              function (error) {
                console.error("Error during transceive: " + error.message);
              }
            );
            console.log("Transceive completed");

            // Convertir la réponse en chaîne hexadécimale
            let hexResponse = this.byteArrayToHexString(
              new Uint8Array(response)
            );
            responseGlobal = new Uint8Array(response);
            console.log("Received response from card: " + hexResponse);
          } catch (error) {
            console.error("Error during transceive: " + error.message);
          }

          resolve(responseGlobal); // Résoudre la promesse avec la réponse reçue sous forme d'ArrayBuffer
        } catch (error) {
          console.error("Error sending APDU command: " + error);
          reject(error); // Rejeter la promesse en cas d'erreur
        }
      });
    },
    sendCsnToServer: async function (cardIdArr, etablissementUrl, numeroId) {
      const url = `${etablissementUrl}/csn-ws?csn=${cardIdArr}&arduinoId=${numeroId}`;
      //console.log("Requesting URL: " + url);

      try {
        const response = await new Promise((resolve, reject) => {
          cordova.plugin.http.post(
            url, // URL avec le cardId
            {}, // paramètres supplémentaires
            {}, // en-têtes supplémentaires
            (response) => {
              // Succès
              resolve(response);
            },
            (error) => {
              // Erreur
              console.error("Erreur lors de l'envoi des données:", error);
              reject(error);
            }
          );
        });

        return response.data; // Renvoyer les données reçues du serveur
      } catch (error) {
        console.error("Erreur lors de l'envoi des données:", error);
      }
    },
    extractData: function (serverResponse) {
      let matches = serverResponse.match(/<(\w+)\s+(.+)>/);
      let heure = new Date().getHours();
      if (matches && matches.length === 3) {
        let status = matches[1];
        let userName = matches[2];

        if (status === "OK") {
          Materialize.toast(
            `<div class="alert">${
              heure >= 6 && heure < 18 ? "Bonjour" : "Bonsoir"
            } ${userName}</div>`,
            5000
          );

          console.log("Statut : " + status);
          console.log("Utilisateur : " + userName);
        } else {
          Materialize.toast(
            '<div role="alert">Carte invalide ou Méthode d\'authentification non activée</div>',
            5000
          );
        }
      } else {
        console.error("Réponse du serveur invalide.");
      }
    },
    loadStoredEstablishments: async function () {
      var self = this;
      self.sharedPreferences.get(
        "establishments",
        (value) => {
          if (value) {
            try {
              const establishments = JSON.parse(value);
              establishments.forEach((establishment) => {
                // On verifie que l'établissement n'est pas déjà dans la liste
                if (
                  !self.establishments.find((e) => e.url === establishment.url)
                ) {
                  self.establishments.push(establishment);
                }
              });

              // Attendre que Vue mette à jour l'UI avant d'attacher les événements
              this.$nextTick(() => {
                console.log("🏫 Liste des établissements chargée !");
                attachSwipeEvents();
              });
            } catch (error) {
              cconsole.error(
                "❌ Erreur lors du parsing des établissements :",
                error
              );
            }
          } else {
            console.log("⚠️ Aucun établissement trouvé.");
          }
        },
        (error) => {
          console.error(
            "❌ Erreur lors de la récupération des établissements :",
            error
          );
        }
      );
    },
    hideBottomSheet: function () {
      this.showBottomSheet = false;
      this.showSuccess = false;
    },
    scanTagForEstablishment: function (etablishmentUrl, numeroId) {
      var self = this;
      console.log("----ETAPE SCAN TAG----");
      if (device.platform === "Android") {
        // Affiche le bottom sheet
        this.showBottomSheet = true;

        // Si un listener NFC est déjà actif, on le supprime avant d'en ajouter un nouveau
        if (this.nfcListener) {
          nfc.removeTagDiscoveredListener(this.nfcListener);
          console.log("✅ NFC Listener Détecté et supprimé");
          self.nfcListener = undefined;
        }

        // Définition du callback NFC et stockage dans this.nfcListener
        this.nfcListener = (tag) => {
          let cardId = nfc.bytesToHexString(tag.tag.id);
          let cardIdArr = cardId.split(" ");
          this.showSuccess = true;
          // Le tag NFC a été scanné avec succès
          console.log(`Tag NFC détecté : ${JSON.stringify(tag)}`);
          // Connecter à la technologie IsoDep avant d'envoyer la commande APDU
          nfc.connect("android.nfc.tech.IsoDep", 1500);

          this.desfireRead(cardId, tag, etablishmentUrl, numeroId)
            .then((response) => {
              console.log("END-DesfireRead >> " + response.msg);
              // Suppression de l'écouteur NFC afin de ne pas être déclenché par un autre établissement
              nfc.removeTagDiscoveredListener(self.nfcListener); // On supprime l'écouteur NFC
              console.log("✅ NFC Listener supprimé");
              self.nfcListener = undefined; // On définit la variable nfcListener à undefined
              nfc.close(); // On ferme la connexion avec le tag NFC
              if (response.code === "END") {
                let heure = new Date().getHours();
                Materialize.toast(
                  `<div class="alert">${
                    heure >= 6 && heure < 18 ? "Bonjour" : "Bonsoir"
                  } ${response.msg}</div>`,
                  5000
                );
              } else {
                Materialize.toast(
                  '<div role="alert">Carte invalide ou Méthode d\'authentification non activée</div>',
                  5000
                );
              }
            })
            .catch((error) => {
              console.error("Erreur lors de l'envoi des données:", error);
              this.showBottomSheet = false;
              this.showSuccess = false;
            })
            .finally(() => {
              // Fermer le bottom sheet après une animation de 1,5s
              setTimeout(() => {
                this.showBottomSheet = false;
                this.showSuccess = false;
              }, 2500);
            });
        };
        nfc.addTagDiscoveredListener(
          self.nfcListener,
          () => {
            console.log(
              "The callback that is called when the listener is added."
            );
          },
          (error) => {
            console.error("Erreur lors du scan NFC :", error);
          }
        );
      }
      if (device.platform === "iOS") {
        nfc.scanTag().then(
          (tag) => {
            let cardId = nfc.bytesToHexString(tag.id);
            let cardIdArr = cardId.split(" ");
            // Le tag NFC a été scanné avec succès
            console.log(`Tag NFC détecté : ${JSON.stringify(tag)}`);

            /* this.sendCsnToServer(cardIdArr, etablishmentUrl, numeroId)
              .then((response) => {
                console.log("Réponse du serveur:", response);
                this.extractData(response);
              })
              .catch((error) => {
                console.error("Erreur lors de l'envoi des données:", error);
              }); */
          },
          (error) => {
            console.error("Erreur lors du scan NFC :", error);
          }
        );
      }
    },
    scanQrCode: function () {
      var self = this;
      cordova.plugins.barcodeScanner.scan(
        async function (result) {
          if (!result.cancelled) {
            try {
              const scannedData = JSON.parse(result.text);

              // Vérification des champs
              if (
                scannedData.numeroId &&
                scannedData.url &&
                scannedData.etablissement
              ) {
                // Stocker les informations dans le localStorage
                const establishmentData = {
                  numeroId: scannedData.numeroId,
                  url: scannedData.url,
                  etablissement: scannedData.etablissement,
                };
                // Avant de stocker les informations, on vérifie qu'on n'a pas déjà cette établissement
                if (
                  !self.establishments.find(
                    (establishment) => establishment.url === scannedData.url
                  )
                ) {
                  let establishments = JSON.parse(
                    await self.GETsharedPreferences("establishments")
                  );
                  establishments.push(establishmentData);
                  self.migrationManager.setSharedPreference(
                    "establishments",
                    establishments,
                    () => {
                      console.log(
                        "🏫 Établissement ajouté avec succès :",
                        establishmentData
                      );
                      self.loadStoredEstablishments();
                    },
                    (error) => {
                      console.error(
                        "❌ Erreur en sauvegardant le tableau d'établissements",
                        error
                      );
                    }
                  );

                  //self.establishments.push(establishmentData);
                }

                // Lancer le scanTag si tout est bon
                self.scanTagForEstablishment(
                  scannedData.url,
                  scannedData.numeroId
                );
              } else {
                console.error("QR Code invalide : informations manquantes");
              }
            } catch (error) {
              console.error("Erreur de parsing JSON", error);
              Materialize.toast(
                '<div role="alert">QR Code invalide : informations manquantes</div>',
                4000
              );
            }
          }
        },
        function (error) {
          console.error("Erreur de scan QR code : " + error);
        }
      );
    },
    removeEstablishment(index) {
      let updatedEstablishments = [...this.establishments];

      // Suppression de l'établissement ciblé
      const removedEstablishment = updatedEstablishments.splice(index, 1);

      // Mettre à jour SharedPreferences
      this.migrationManager.setSharedPreference(
        "establishments",
        JSON.stringify(updatedEstablishments),
        () => {
          console.log(
            `✅ Établissement supprimé : ${removedEstablishment[0].etablissement}`
          );
          this.establishments = updatedEstablishments; // Mettre à jour Vue.js avec le tableau modifié
        },
        (error) => {
          console.error(
            "❌ Erreur lors de la mise à jour des établissements :",
            error
          );
        }
      );
    },
    GETsharedPreferences: function (key) {
      return new Promise((resolve, reject) => {
        this.sharedPreferences.get(
          key,
          (value) => {
            if ( typeof value === "object" ) {
              value = JSON.parse(value);
            }
            resolve(value);
          },
          (error) => {
            console.log(
              `GET :: Erreur lors de la récupération de la clé ${key}: `,
              error
            );
            reject(error);
          }
        );
      });
    },
    // show sharedPreferences content
    showSharedPreferences: function () {
      console.log("LE CONTENU DES SHAREDPREFERENCES >>>>>>>>");
      this.sharedPreferences.keys(async () => {
        const keysToCheck = [
          "darkMode",
          "establishments",
          "gcm_id",
          "totpObjects",
          "otpServers",
        ];
        for (let key of keysToCheck) {
          let value = await GETsharedPreferences(key);
          console.log(key + " : " + value);
        }
      });
    },
  },
});

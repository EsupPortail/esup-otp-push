class MigrationManager {
  constructor() {
    this.sharedPreferences =
      window.plugins.SharedPreferences.getInstance("settings");
    this.migrationKey = "isMigrationDone"; // Flag de migration
    this.initializationKey = "isInitialized"; // Flag pour vérifier si l'initialisation a été faite
  }

  /**
   * Vérifie si l'application a déjà été initialisée
   */
  async isAppInitialized() {
    const initialized = localStorage.getItem(this.initializationKey);

    if (initialized !== null) {
      return true; // L'application a déjà été initialisée
    }

    // Vérifie si d'anciennes données existent
    const hasOldData =
      localStorage.getItem("darkMode") !== null ||
      localStorage.getItem("totpObjects") !== null ||
      localStorage.getItem("otpServers") !== null;

    if (hasOldData) {
      console.warn(
        "⚠️ Anciennes données détectées, mais initializationKey absent. Mise à jour nécessaire."
      );

      // ✅ Initialiser initializationKey pour éviter de refaire cette vérification
      localStorage.setItem(this.initializationKey, true);
      console.log("🔄 Mise à jour : initializationKey ajouté ✅");

      return true; // On suppose que l'app était déjà installée
    }

    return false; // C'est une première installation
  }

  /**
   * Initialise les valeurs par défaut si l'application est installée pour la première fois
   */
  async initializeApp() {
    if (await this.isAppInitialized()) {
      console.log("✅ L'application est déjà initialisée.");
      return;
    }

    console.log(
      "🆕 Première installation détectée, initialisation des valeurs..."
    );

    await this.setSharedPreference("darkMode", ""); // Mode sombre désactivé par défaut
    const darkMode = window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "enabled"
      : "disabled";
    localStorage.setItem("darkMode", darkMode);
    await this.setSharedPreference("totpObjects", JSON.parse("{}")); // Objet vide pour les TOTP
    localStorage.setItem("totpObjects", JSON.stringify({}));
    await this.setSharedPreference("otpServers", JSON.parse("{}")); // Objet vide pour les OTP Servers
    localStorage.setItem("otpServers", JSON.stringify({}));
    await this.setSharedPreference("establishments", JSON.parse("[]")); // Tableau vide pour les établissements
    localStorage.setItem("establishments", JSON.stringify([]));
    await this.setSharedPreference("gcm_id", ""); // Clé vide
    localStorage.setItem("gcm_id", "");
    localStorage.setItem(this.initializationKey, true); // Marquer l'initialisation comme faite

    console.log("🎉 Initialisation terminée avec succès !");
  }

  /**
   * Vérifie si la migration est déjà effectuée
   */
  async isMigrationAlreadyDone() {
    const done = localStorage.getItem(this.migrationKey);
    return done; // Convertir en booléen
  }

  /**
   * Démarre la migration si nécessaire
   */
  async startMigration() {
    console.log("🔄 Vérification de la nécessité de migrer les données...");

    if (await this.isMigrationAlreadyDone()) {
      console.log("✅ Migration déjà effectuée, rien à faire.");
      return;
    }

    console.log("📂 Début de la migration...");
    const establishments = [];

    for (let i = 0; i < localStorage.length; i++) {
      let key = localStorage.key(i);
      let value = localStorage.getItem(key);

      if (!key || value === null) continue;

      try {
        // Vérifier si c'est un JSON
        if (
          value.startsWith("{") ||
          value.startsWith("[") ||
          key === "darkMode"
        ) {
          value = JSON.parse(value);
        }

        if (key.startsWith("establishment_")) {
          establishments.push(value);
        } else {
          await this.setSharedPreference(key, value);
        }
      } catch (err) {
        console.error(`❌ Erreur de parsing JSON pour ${key}:`, err);
      }
    }

    // Stocker les établissements sous forme de tableau
    await this.setSharedPreference("establishments", establishments);
    console.log("✅ Migration des établissements réussie :", establishments);

    // Marquer la migration comme terminée
    localStorage.setItem(this.migrationKey, true);
    console.log("🎉 Migration terminée avec succès !");
  }

  /**
   * Récupérer une valeur depuis SharedPreferences
   */
  getSharedPreference(key) {
    return new Promise((resolve) => {
      this.sharedPreferences.get(
        key,
        (value) => {
          try {
            // Vérifie si la valeur est un JSON et parse automatiquement
            if (typeof value === "object") {
              value = JSON.parse(value);
            }
            resolve(value ?? null); // Retourne `null` si la clé est absente
          } catch (error) {
            console.error(`❌ Erreur de parsing JSON pour ${key}:`, error);
            resolve(null); // Retourne null au lieu de bloquer avec une erreur
          }
        },
        (error) => {
          console.error(
            `⚠️ - MigrationManager - Erreur lors de la récupération de ${key}:`,
            error
          );
          resolve(null);
        }
      );
    });
  }

  /**
   * Stocker une valeur dans SharedPreferences
   */
  setSharedPreference(key, value, successCallback, errorCallback) {
    return new Promise((resolve, reject) => {
      try {
        value = JSON.stringify(value);

        this.sharedPreferences.put(
          key,
          value,
          () => {
            console.log(`✅ Enregistré: ${key} ->`, value);
            if (typeof successCallback === "function") successCallback();
            resolve(true);
          },
          (error) => {
            console.error(
              `❌ Erreur lors de l'enregistrement de ${key}:`,
              error
            );
            if (typeof errorCallback === "function") errorCallback(error);
            reject(error);
          }
        );
      } catch (error) {
        console.error(
          `⚠️ - MigrationManager - Erreur interne lors du stockage de ${key}:`,
          error
        );
        reject(error);
      }
    });
  }

  /*
   * Afficher les éléments migrés dans sharedPreferences
   * darkMode, establishments, gcm_id, totpObjects, otpServers
   */
  showSharedPreferences() {
    console.log("🔎 Liste des clés et valeurs dans sharedPreferences :");
    this.sharedPreferences.keys(async () => {
      const keysToCheck = [
        "darkMode",
        "establishments",
        "gcm_id",
        "totpObjects",
        "otpServers",
      ];
      for (let key of keysToCheck) {
        let value = await this.getSharedPreference(key);
        console.log(key + " : " + value);
      }
    });
  }

  /**
   * Vérifie si la classe est bien instanciée
   */
  hello() {
    console.log("👋 Bonjour MigrationManager !");
  }
}

window.MigrationManager = MigrationManager;

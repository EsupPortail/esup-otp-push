import DefaultPreference from 'react-native-default-preference';
import { storage } from '../utils/storage';

export async function MigrateToMMKV() {
  const migrationDone = storage.getBoolean('migrationDone');

  if (migrationDone) {
    console.log("✅ Migration déjà effectuée, on ne fait rien !");
    return;
  }

  await DefaultPreference.setName('settings'); // Définit le namespace

  const keysToCheck = ["darkMode", "establishment_Paris 1 Panthéon-Sorbonne", "gcm_id", "totpObjects", "otpServers"];
  
  for (const key of keysToCheck) {
    DefaultPreference.get(key).then(value => {
      if (value){
        const parsedValue = JSON.parse(value);
        storage.set(key, parsedValue);
        console.log(`🔍 ---->>> Vérification: ${key} =>`, parsedValue);
      } else {
        console.warn("⚠️ ---->>> otpObjects n'existe pas encore, initialisation...");
      }
    }).catch(err => {
      console.error(`❌ ----->>> Erreur récupération de ${key}`, err);
    });
  }

  storage.set('migrationDone', true);
  console.log("✅ Migration terminée et flag enregistré !");
}
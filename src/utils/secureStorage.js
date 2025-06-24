import { MMKV } from 'react-native-mmkv';
import * as Keychain from 'react-native-keychain';

const generateSecureKey = () => {
    console.log('[secureStorage] Génération d’une clé avec Math.random (phase de test)');
    // Générer une clé de 16 caractères alphanumériques
    const key = Array.from({ length: 16 }, () =>
      Math.floor(Math.random() * 36).toString(36)
    ).join('');
    console.warn('[secureStorage] Clé générée avec Math.random (non cryptographiquement sécurisée)');
    return key;
};

export const initializeSecureStorage = async () => {
  try {
    console.log('[secureStorage] Initialisation du stockage sécurisé');
    let credentials = await Keychain.getGenericPassword({ service: 'esup-auth-key' });

    if (!credentials) {
      console.log('[secureStorage] Aucune clé trouvée, génération d’une nouvelle');
      const key = generateSecureKey();
      await Keychain.setGenericPassword('esup-auth', key, { service: 'esup-auth-key' });
      credentials = { password: key };
    }

    const storage = new MMKV({
      id: 'esup-auth-storage',
      encryptionKey: credentials.password,
    });

    console.log('[secureStorage] Stockage MMKV initialisé avec chiffrement');
    return storage;
  } catch (error) {
    console.error('[secureStorage] Erreur lors de l’initialisation:', error);
    throw new Error('Échec de l’initialisation du stockage sécurisé');
  }
};

let storage = new MMKV({ id: 'esup-auth-storage' });

export const getStorage = () => storage;
export const setStorage = (newStorage) => {
  storage = newStorage;
};

/**
 * Réinitialise le stockage sécurisé
 * Juste pour les tests
 */
export const resetStorage = async () => {
    try {
      console.log('[secureStorage] Réinitialisation du stockage');
      // Supprimer les données MMKV
      storage.clearAll();
      console.log('[secureStorage] Stockage MMKV supprimé');
  
      // Supprimer la clé de chiffrement dans Keychain
      await Keychain.resetGenericPassword({ service: 'esup-auth-key' });
      console.log('[secureStorage] Clé Keychain supprimée');
  
      return true;
    } catch (error) {
      console.error('[secureStorage] Erreur lors de la réinitialisation:', error);
      throw new Error('Échec de la réinitialisation du stockage');
    }
  };
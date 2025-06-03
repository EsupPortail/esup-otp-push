import NfcManager, { NfcTech } from 'react-native-nfc-manager';

let sessionActive = false;

export const nfcSessionManager = {
  async startSession(tech = NfcTech.IsoDep) {
    try {
      if (sessionActive) {
        console.warn('🚫 Une session NFC est déjà active, annulation précédente...');
        await this.cancelSession();
      }

      await NfcManager.requestTechnology(tech);
      sessionActive = true;
      console.log('✅ Session NFC démarrée');
      return true;
    } catch (err) {
      console.warn('❌ Impossible de démarrer la session NFC:', err.message || err);
      return false;
    }
  },

  async getTag() {
    try {
      const tag = await NfcManager.getTag();
      console.log('📶 Tag détecté:', tag);
      return tag;
    } catch (err) {
      console.error('❌ Erreur récupération du tag:', err.message || err);
      throw err;
    }
  },

  async cancelSession() {
    try {
      await NfcManager.cancelTechnologyRequest();
      console.log('🔕 Session NFC annulée');
    } catch (err) {
      console.warn('⚠️ Erreur lors de l’annulation NFC:', err.message || err);
    } finally {
      sessionActive = false;
    }
  },

  isActive() {
    return sessionActive;
  },
};

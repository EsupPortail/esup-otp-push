import { storage } from './storage';
import { useNfcStore } from '../stores/useNfcStore';
import { useTotpStore } from '../stores/useTotpStore';
import { useOtpServersStore } from '../stores/useOtpServersStore';
import { sync, autoActivateTotp, showToast } from '../services/auth';
import { Alert, Platform } from 'react-native';
import { Totp } from '../utils/totp';
import { getManufacturer, getModel } from 'react-native-device-info';

export const handleUniversalQrCodeScan = async (qrCodeData) => {
  try {
    console.log('[handleUniversalQrCodeScan] QR code scanné:', qrCodeData);

    // Extraire la valeur du QR code
    const data = typeof qrCodeData === 'string' ? qrCodeData : qrCodeData?.codeStringValue;
    if (!data) {
      showToast('QR code invalide');
      console.warn('[handleUniversalQrCodeScan] Aucun contenu valide');
      return { success: false, message: 'QR code invalide' };
    }

    // Essayer de parser comme JSON (pour NFC)
    let parsedJson = null;
    try {
      parsedJson = JSON.parse(data);
    } catch (e) {
      // Pas un JSON, probablement une URL
    }

    // Déterminer le type de QR code
    if (data.startsWith('otpauth://totp/')) {
      // QR code TOTP
      console.log('[handleUniversalQrCodeScan] Détection QR code TOTP');
      const totpResult = await handleTotpQrCode(data);
      //navigation.navigate('TotpScreen');
      return totpResult;
    } else if (data.includes('/methods/push/')) {
      // QR code PUSH
      console.log('[handleUniversalQrCodeScan] Détection QR code PUSH');
      const pushResult = await handlePushQrCode(data);
      //navigation.navigate('PushScreen');
      return pushResult;
    } else if (parsedJson && parsedJson.url && parsedJson.numeroId && parsedJson.etablissement) {
      // QR code NFC
      console.log('[handleUniversalQrCodeScan] Détection QR code NFC');
      const nfcResult = await handleNfcQrCode(parsedJson);
      if (nfcResult.success) {
        const { scanTagForEstablishment } = require('../services/nfcService');
        scanTagForEstablishment(parsedJson.url, parsedJson.numeroId);
      }
      //navigation.navigate('NfcScreen');
      return nfcResult;
    } else {
      showToast('Type de QR code non reconnu');
      console.warn('[handleUniversalQrCodeScan] Type de QR code inconnu:', data);
      return { success: false, message: 'Type de QR code non reconnu' };
    }
  } catch (error) {
    console.error('[handleUniversalQrCodeScan] Erreur:', error.message);
    showToast(`Erreur lors du scan: ${error.message}`);
    return { success: false, message: error.message };
  }
};

const handleTotpQrCode = async (url) => {
  try {
    const parsed = Totp.parseTotpUrl(url);
    if (!parsed || !parsed.secret || !parsed.name) {
      throw new Error('QR code TOTP invalide');
    }
    console.log('[handleTotpQrCode] Parsed TOTP:', parsed);

    const { setTotpObjects } = useTotpStore.getState();
    const currentTotpObjects = useTotpStore.getState().totpObjects;
    const updatedTotpObjects = { ...currentTotpObjects, [parsed.secret]: parsed.name };
    setTotpObjects(updatedTotpObjects);

    showToast('TOTP ajouté avec succès');
    return { success: true, totpKey: parsed.secret, serverName: parsed.name };
  } catch (error) {
    console.error('[handleTotpQrCode] Erreur:', error.message);
    throw error;
  }
};

const handlePushQrCode = async (url) => {
  try {
    const match = url.match(/\/users\/([^/]+)\/methods\/push\/([^/]+)/);
    if (!match) {
      throw new Error('URL PUSH invalide');
    }
    const [, uid, code] = match;
    const host = url.split('/users/')[0] + '/';
    const gcmId = storage.getString('gcm_id') || '';
    const manufacturer = await getManufacturer();
    const model = getModel();
    const platform = Platform.OS;

    const result = await sync(host, uid, code, gcmId, platform, manufacturer, model);
    if (!result.success) {
      showToast('Échec de la synchronisation PUSH');
    }

    console.log('[handlePushQrCode] PUSH synchronisé:', result);
    showToast('Synchronisation PUSH réussie');
    return { success: true, data: result.data };
  } catch (error) {
    console.error('[handlePushQrCode] Erreur:', error.message);
    throw error;
  }
};

const handleNfcQrCode = async (parsedJson) => {
  try {
    const { url, numeroId, etablissement } = parsedJson;
    if (!url || !numeroId || !etablissement) {
      throw new Error('Données NFC invalides');
    }

    const establishment = { url, numeroId, etablissement };
    const { addEstablishment, establishments } = useNfcStore.getState();

    // Vérifier si l'établissement existe déjà
    const exists = establishments.some((est) => est.url === url);
    if (exists) {
      return { success: false, message: 'Cet établissement est déjà ajouté.' };
    }

    addEstablishment(establishment);

    console.log('[handleNfcQrCode] Établissement ajouté:', establishment);
    showToast('Établissement NFC ajouté');
    return { success: true, establishment };
  } catch (error) {
    console.error('[handleNfcQrCode] Erreur:', error.message);
    Alert.alert('Erreur', 'QR code invalide pour un établissement.');
  }
};
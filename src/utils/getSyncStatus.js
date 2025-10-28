import DeviceInfo, { getModel } from 'react-native-device-info';
import { useTotpStore } from '../stores/useTotpStore';
import { useOtpServersStore } from '../stores/useOtpServersStore';
import { useNfcStore } from '../stores/useNfcStore';
import { browserManager } from '../stores/useBrowserStore';

/**
 * Compare les méthodes actives côté serveur avec celles configurées localement
 * et retourne un objet clair du type :
 * {
 *   totp: 'local',
 *   push: 'remote',
 *   esupnfc: 'local',
 *   webauthn: 'none'
 * }
 */
export const getSyncStatus = (methods) => {
  // Lecture des stores locaux
  const totpObjects = useTotpStore.getState().totpObjects;
  const otpServers = useOtpServersStore.getState().otpServers;
  const nfcObjects = useNfcStore.getState().establishments;

  const localPushKeys = Object.keys(otpServers);
  const localTotpKeys = Object.keys(totpObjects);
  const userData = browserManager.getUser();

  const remotePushKey = userData?.api_url && userData?.uid
  ? `${userData.api_url.replace(/\/$/, '')}/${userData.uid}`
  : null;
  console.log('[getSyncStatus] remotePushKey:', remotePushKey);
  console.log('[getSyncStatus] localPushKeys:', localPushKeys);

  // Helper : savoir si un store local est vide
  const isEmpty = (obj) => !obj || Object.keys(obj).length === 0;
  const isPushLocal = remotePushKey && localPushKeys.includes(remotePushKey);
  
  console.log('[getSyncStatus] isPushLocal:', isPushLocal);

  const syncStatus = {};

  Object.entries(methods).forEach(([key, value]) => {
    if (key === 'codeRequired' || key === 'waitingFor') return; // skip champs techniques

    const active = value.active ?? false;

    // === TOTP ===
    if (key === 'totp') {
      if (!active) syncStatus[key] = 'none';
      else syncStatus[key] = isEmpty(totpObjects) ? 'remote' : 'local';
    }

    // === NFC ===
    else if (key === 'esupnfc') {
      if (!active) syncStatus[key] = 'none';
      else syncStatus[key] = isEmpty(nfcObjects) ? 'remote' : 'local';
    }

    // === PUSH ===
    else if (key === 'push') {
      if (!active) {
        syncStatus[key] = 'none';
      } else {
        const device = value.device || {};
        if (isPushLocal) {
          syncStatus[key] = 'local';
        } else {
          syncStatus[key] = {
            status: 'remote',
            label: `${device.platform} ${device.model}`
          };
        }
      }
    }

    // === Autres méthodes ===
    else {
      syncStatus[key] = active ? 'remote' : 'none';
    }
  });
  console.log('#####[getSyncStatus] syncStatus:', syncStatus);

  return syncStatus;
};
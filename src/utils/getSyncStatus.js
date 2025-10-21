import DeviceInfo from 'react-native-device-info';
import { useTotpStore } from '../stores/useTotpStore';
import { useOtpServersStore } from '../stores/useOtpServersStore';
import { useNfcStore } from '../stores/useNfcStore';

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

  // Infos de l’appareil courant
  const platform = DeviceInfo.getSystemName(); // "Android" | "iOS"
  const model = DeviceInfo.getModel(); // ex: "Galaxy A40" ou "iPhone 7"

  // Helper : savoir si un store local est vide
  const isEmpty = (obj) => !obj || Object.keys(obj).length === 0;

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
        if (
          device.platform === platform &&
          device.model === model
        ) {
          syncStatus[key] = 'local';
        } else if (device.platform && device.model) {
          syncStatus[key] = {
            status: 'remote',
            label: `${device.platform} ${device.model}`,
          };
        } else {
          syncStatus[key] = 'remote';
        }
      }
    }

    // === Autres méthodes ===
    else {
      syncStatus[key] = active ? 'remote' : 'none';
    }
  });

  return syncStatus;
};
import messaging from '@react-native-firebase/messaging';
import {storage} from './storage';

export const initializeFirebase = async () => {
  // Demander la permission pour les notifications
  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  if (!enabled) {
    console.warn('Notifications non autorisées');
    return false;
  }

  // Récupérer ou générer gcm_id
  let gcmId = storage.getString('gcm_id');
  if (!gcmId) {
    gcmId = await messaging().getToken();
    storage.set('gcm_id', gcmId);
  }

  return gcmId;
};
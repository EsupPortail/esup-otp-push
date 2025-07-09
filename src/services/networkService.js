import NetInfo from '@react-native-community/netinfo';
import { showToast } from './auth';
import { Alert } from 'react-native';

let isConnected = true;
let unsubscribe = null;

// Initialiser la surveillance réseau
export const initNetworkMonitoring = () => {
  unsubscribe = NetInfo.addEventListener(state => {
    const wasConnected = isConnected;
    isConnected = state.isConnected && state.isInternetReachable;

    if (!isConnected && wasConnected) {
      Alert.alert('Vous êtes hors ligne', 'Certaines fonctionnalités seront indisponibles.');
      console.log('[networkService] Déconnexion détectée:', state);
    } else if (isConnected && !wasConnected) {
      showToast('Connexion rétablie.');
      console.log('[networkService] Connexion rétablie:', state);
    }
  });
};

// Arrêter la surveillance réseau
export const stopNetworkMonitoring = () => {
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }
};

// Vérifier l'état réseau actuel
export const checkNetworkStatus = async () => {
  const state = await NetInfo.fetch();
  isConnected = state.isConnected && state.isInternetReachable;
  console.log('[networkService] État réseau:', state);
  return isConnected;
};

// Vérifier la connexion avant une opération réseau
export const requireNetwork = async (operationName) => {
  const connected = await checkNetworkStatus();
  if (!connected) {
    showToast(`Connexion requise pour ${operationName}.`);
    throw new Error(`Connexion requise pour ${operationName}.`);
  }
  return connected;
};

// Obtenir l'état actuel de la connexion
export const isNetworkConnected = () => isConnected;
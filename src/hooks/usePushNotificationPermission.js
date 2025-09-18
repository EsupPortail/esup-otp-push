import { useState, useEffect, use } from 'react';
import { Alert, PermissionsAndroid, Platform } from 'react-native';
import {
  openSettings,
  PERMISSIONS,
  RESULTS,
  checkNotifications,
  requestNotifications,
} from 'react-native-permissions';
import { Toast } from 'toastify-react-native';
import { storage } from '../utils/storage';

// On sélectionne le bon type de permission en fonction de la plateforme
const permissionType = Platform.select({
  ios: PERMISSIONS.IOS.APP_TRACKING_TRANSPARENCY,
  android: PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
});

export const usePushNotificationPermission = (otpServers) => {
  const [permissionStatus, setPermissionStatus] = useState(storage.getString('pushPermissionStatus') || 'unknown');

  // 1. Au lancement, si aucun push configuré, on considère refusé
  useEffect(() => {
    if (Object.keys(otpServers).length === 0) {
      setPermissionStatus('denied');
      storage.set('pushPermissionStatus', 'denied');
    }
  }, [otpServers]);

  // 2. Quand un push est ajouté, on demande la permission si jamais demandée
  const askPermissionIfNeeded = async () => {
    const current = storage.getString('pushPermissionStatus');
    console.log('[usePushNotificationPermission] askPermissionIfNeeded, current status:', current);
    if (current === 'never_ask_again' || current === 'granted') return;

    const { status } = await requestNotifications(['alert', 'sound', 'badge']);
    console.log('[usePushNotificationPermission] askPermissionIfNeeded, new status:', status);
    if (status === RESULTS.GRANTED) {
      setPermissionStatus('granted');
      storage.set('pushPermissionStatus', 'granted');
    } else {
      setPermissionStatus('never_ask_again');
      storage.set('pushPermissionStatus', 'never_ask_again');
      Alert.alert(
        'Notifications refusées',
        'Vous avez refusé les notifications. Pour les activer, allez dans les réglages de l’application.',
        [
          { text: 'Plus tard' },
          { text: 'Ouvrir les réglages', onPress: () => openSettings('application') },
        ]
      );
    }
  };

  // Fonction pour vérifier la permission
  const checkPermission = async () => {
    console.log('[usePushNotificationPermission] checkPermission');
    if (!permissionType) {
      console.log('[usePushNotificationPermission] Aucun type de permission');
      return;
    }
    try {
      console.log('[usePushNotificationPermission] check ', permissionType);
      const status = await checkNotifications(permissionType);
      console.log('[usePushNotificationPermission] status:', status);
      setPermissionStatus(status.status);
      storage.set('pushPermissionStatus', status.status);
    } catch (error) {
      console.error('Erreur lors de la vérification de la permission:', error);
    }
  };

  // Fonction pour demander la permission
  const requestPermission = async () => {
    if (!permissionType) {
      return;
    }
    try {
      const status = await requestNotifications(['alert', 'sound', 'badge']);
      console.log('[usePushNotificationPermission-request] request status:', status);
      setPermissionStatus(status);
      handleStatus(status);
    } catch (error) {
      console.error('Erreur lors de la demande de permission:', error);
    }
  };

  // Fonction interne pour gérer les alertes en fonction du statut
  const handleStatus = (status) => {
    console.log('[usePushNotificationPermission] handleStatus', status);
    switch (status.status) {
      case RESULTS.BLOCKED:
        Alert.alert(
          'Notification bloquée',
          'Veuillez activer les notifications dans les paramètres de votre appareil pour continuer.',
          [
            { text: 'Annuler', style: 'cancel' },
            { text: 'Ouvrir les paramètres', onPress: () => openSettings('application') },
          ],
        );
        break;
      case RESULTS.DENIED:
        Alert.alert(
          'Notification refusée',
          'Vous avez refusé les notifications. Vous pouvez les activer dans les paramètres de l\'application.',
          [
            { text: 'Annuler', style: 'cancel' },
            { text: 'Demander à nouveau', onPress: requestPermission },
          ],
        );
        break;
      case RESULTS.GRANTED:
        if (permissionStatus !== RESULTS.GRANTED) Toast.show({
            type: 'success',
            text1: 'Notification activée',
        })
        setPermissionStatus(RESULTS.GRANTED);
        console.log('Notification permission granted.');
        break;
      case RESULTS.LIMITED:
        // Permission limitée, on peut gérer cela si nécessaire
        break;
      case RESULTS.UNAVAILABLE:
        // Fonctionnalité non disponible
        break;
    }
  };

  return { permissionStatus, requestPermission, checkPermission, askPermissionIfNeeded };
};
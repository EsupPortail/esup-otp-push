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

// On sélectionne le bon type de permission en fonction de la plateforme
const permissionType = Platform.select({
  ios: PERMISSIONS.IOS.APP_TRACKING_TRANSPARENCY,
  android: PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
});

export const usePushNotificationPermission = () => {
  const [permissionStatus, setPermissionStatus] = useState(RESULTS.GRANTED);

  useEffect(() => {
    console.log('[usePushNotificationPermission] useEffect');
    console.log('[usePushNotificationPermission] permissionType:', permissionType);
    console.log('[usePushNotificationPermission] permissionStatus:', permissionStatus);
    checkPermission(); // Vérifier la permission au montage du hook
    console.log('[usePushNotificationPermission] permissionStatus:', permissionStatus);
  }, []);

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
      setPermissionStatus(status);
      handleStatus(status);
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

  return { permissionStatus, requestPermission, checkPermission };
};
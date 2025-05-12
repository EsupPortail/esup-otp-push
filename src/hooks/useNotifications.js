import { useState, useEffect } from 'react';
import messaging from '@react-native-firebase/messaging';
import {storage} from '../utils/storage';
import { notification, refresh } from '../services/auth';

const useNotifications = () => {
  const [notified, setNotified] = useState(false);
  const [additionalData, setAdditionalData] = useState(null);
  const [otpServersObjects, setOtpServersObjects] = useState(
    storage.getString('otpServers') ? JSON.parse(storage.getString('otpServers')) : {}
  );

  useEffect(() => {
    // Initialiser et gérer le token Firebase
    const initializeToken = async () => {
      try {
        let currentGcmId = storage.getString('gcm_id') || '';
        // Nettoyer les guillemets éventuels
        currentGcmId = currentGcmId.replace(/^"|"$/g, '');
        const newToken = await messaging().getToken();
        console.log('📱 Nouveau token Firebase:', newToken);

        if (!currentGcmId) {
          // Premier enregistrement
          storage.set('gcm_id', newToken);
          console.log('📱 gcm_id initialisé:', newToken);
        } else if (currentGcmId !== newToken) {
          // Mise à jour du token
          console.log('📱 Mise à jour du gcm_id:', currentGcmId, '->', newToken);
          for (const [otpServerKey, serverData] of Object.entries(otpServersObjects)) {
            try {
              const result = await refresh(
                serverData.host,
                serverData.uid,
                serverData.tokenSecret,
                currentGcmId,
                newToken
              );
              console.log(`📱 Refresh pour ${otpServerKey}:`, result);
            } catch (error) {
              console.warn(`📱 Échec du refresh pour ${otpServerKey}:`, error.message);
              // Continuer avec les autres serveurs
            }
          }
          storage.set('gcm_id', newToken);
          console.log('📱 gcm_id mis à jour:', newToken);
        } else {
          console.log('📱 gcm_id inchangé:', currentGcmId);
        }
      } catch (error) {
        console.error('Erreur lors de l’initialisation du token:', error.message);
      }
    };

    initializeToken();

    // Gérer les notifications en avant-plan
    const unsubscribeForeground = messaging().onMessage(async (remoteMessage) => {
      // console data
      console.log('📱 Notification foreground', remoteMessage.data);
      //console response
      console.log('📱 Notification foreground response', remoteMessage);
      if (remoteMessage.data.action === 'auth' || remoteMessage.data.action === 'desync') {
        notification(remoteMessage.data, otpServersObjects, setOtpServersObjects, setNotified, setAdditionalData);
      }
    });

    // Gérer les notifications en arrière-plan ou fermées
    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      // console data
      console.log('📱 Notification foreground', remoteMessage.data);
      //console response
      console.log('📱 Notification foreground response', remoteMessage);
      if (remoteMessage.data.action === 'auth' || remoteMessage.data.action === 'desync') {
        notification(remoteMessage.data, otpServersObjects, setOtpServersObjects, setNotified, setAdditionalData);
      }
    });

    // Gérer le clic sur la notification
    const unsubscribeOpened = messaging().onNotificationOpenedApp((remoteMessage) => {
      if (remoteMessage.data.action === 'auth') {
        notification(remoteMessage.data, otpServersObjects, setOtpServersObjects, setNotified, setAdditionalData);
      }
    });

    // Écouter les mises à jour du token
    const unsubscribeTokenRefresh = messaging().onTokenRefresh(async (newToken) => {
      try {
        let currentGcmId = storage.getString('gcm_id') || '';
        currentGcmId = currentGcmId.replace(/^"|"$/g, '');
        console.log('📱 Token refresh:', newToken);

        if (currentGcmId !== newToken) {
          for (const [otpServerKey, serverData] of Object.entries(otpServersObjects)) {
            await refresh(
              serverData.host,
              serverData.uid,
              serverData.tokenSecret,
              currentGcmId,
              newToken
            );
          }
          storage.set('gcm_id', newToken);
          console.log('📱 gcm_id mis à jour via refresh:', newToken);
        }
      } catch (error) {
        console.error('Erreur lors du refresh du token:', error.message);
      }
    });

    // Vérifier si l’app a été ouverte via une notification
    messaging()
      .getInitialNotification()
      .then((remoteMessage) => {
        if (remoteMessage && remoteMessage.data.action === 'auth') {
          notification(remoteMessage.data, otpServersObjects, setOtpServersObjects, setNotified, setAdditionalData);
        }
      });

    return () => {
      unsubscribeForeground();
      unsubscribeOpened();
      unsubscribeTokenRefresh();
    };
  }, [otpServersObjects]);

  return { notified, setNotified, additionalData, setAdditionalData, otpServersObjects, setOtpServersObjects };
};

export default useNotifications;
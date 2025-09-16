import { useEffect, useRef } from 'react';
import messaging from '@react-native-firebase/messaging';
import { storage } from '../utils/storage';
import { notification, refresh } from '../services/auth';
import { useOtpAuth } from './useOtpAuth';

const useNotifications = () => {
  const {
    notified, setNotified,
    additionalData, setAdditionalData,
    otpServersObjects, setOtpServersObjects,
    otpServersRef, lastProcessedLtRef, initAuth
  } = useOtpAuth();

  const isProcessingRef = useRef(false);

  useEffect(() => {
    otpServersRef.current = otpServersObjects;
  }, [otpServersObjects]);

  const initializeToken = async () => {
    try {
      let currentGcmId = storage.getString('gcm_id') || '';
      currentGcmId = currentGcmId.replace(/^"|"$/g, '');
      const newToken = await Promise.race([
        messaging().getToken(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout getToken')), 10000)),
      ]);
      console.log('📱 Nouveau token Firebase:', newToken);

      if (!currentGcmId) {
        storage.set('gcm_id', newToken);
        console.log('📱 gcm_id initialisé:', newToken);
      } else if (currentGcmId !== newToken) {
        console.log('📱 Mise à jour du gcm_id:', currentGcmId, '->', newToken);
        const servers = Object.entries(otpServersRef.current);
        for (const [otpServerKey, serverData] of servers) {
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

  const checkInitialNotification = async () => {
    try {
      const remoteMessage = await messaging().getInitialNotification();
      if (remoteMessage?.data?.action === 'auth') {
        if (remoteMessage.data.lt !== lastProcessedLtRef.current) {
          notification(
            remoteMessage.data,
            otpServersRef.current,
            setOtpServersObjects,
            setNotified,
            setAdditionalData
          );
          lastProcessedLtRef.current = remoteMessage.data.lt;
        } else {
          console.log('📱 Notification initiale déjà traitée:', remoteMessage.data.lt);
        }
      } else {
        console.log('📱 Aucune notification initiale détectée');
      }
    } catch (error) {
      console.error('Erreur dans checkInitialNotification:', error.message);
    }
  };

  useEffect(() => {
    console.log('📱 useEffect exécuté');

    if (isProcessingRef.current) {
      console.log('📱 useEffect ignoré: déjà en cours de traitement');
      return;
    }
    isProcessingRef.current = true;

    const setup = async () => {
      await initializeToken();
      await checkInitialNotification();
      await initAuth();
      isProcessingRef.current = false;
    };
    setup();

    const unsubscribeForeground = messaging().onMessage(async remoteMessage => {
      console.log('📱 Notification foreground data:', remoteMessage.data);
      console.log('📱 Notification foreground ****:', remoteMessage);
      if (
        remoteMessage.data &&
        (remoteMessage.data.action === 'auth' || remoteMessage.data.action === 'desync')
      ) {
        notification(
          remoteMessage.data,
          otpServersRef.current,
          setOtpServersObjects,
          setNotified,
          setAdditionalData
        );
        lastProcessedLtRef.current = remoteMessage.data.lt;
      }
    });

    const unsubscribeOpened = messaging().onNotificationOpenedApp(remoteMessage => {
      console.log('📱 Notification ouverte (background):', remoteMessage);
      if (
        remoteMessage &&
        remoteMessage.data &&
        (remoteMessage.data.action === 'auth' || remoteMessage.data.action === 'desync')
      ) {
        notification(
          remoteMessage.data,
          otpServersRef.current,
          setOtpServersObjects,
          setNotified,
          setAdditionalData
        );
        lastProcessedLtRef.current = remoteMessage.data.lt;
      }
    });

    const unsubscribeTokenRefresh = messaging().onTokenRefresh(async newToken => {
      try {
        let currentGcmId = storage.getString('gcm_id') || '';
        currentGcmId = currentGcmId.replace(/^"|"$/g, '');
        console.log('📱 Token refresh:', newToken);

        if (currentGcmId !== newToken) {
          const servers = Object.entries(otpServersRef.current);
          for (const [otpServerKey, serverData] of servers) {
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
            }
          }
          storage.set('gcm_id', newToken);
        }
      } catch (error) {
        console.error('Erreur lors du refresh du token:', error.message);
      }
    });

    return () => {
      console.log('📱 Nettoyage useEffect');
      unsubscribeForeground();
      unsubscribeOpened();
      unsubscribeTokenRefresh();
      isProcessingRef.current = false;
    };
  }, []);

  return {
    initAuth,
    notified,
    setNotified,
    additionalData,
    setAdditionalData,
    otpServersObjects,
    setOtpServersObjects
  };
};

export default useNotifications;

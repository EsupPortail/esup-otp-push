import { useState, useEffect, useRef } from 'react';
import messaging from '@react-native-firebase/messaging';
import { storage } from '../utils/storage';
import { notification, refresh, otpServerStatus } from '../services/auth';
import { NavigationContainer, useNavigation } from '@react-navigation/native';

const useNotifications = () => {
  const [notified, setNotified] = useState(false);
  const [additionalData, setAdditionalData] = useState(null);
  const [otpServersObjects, setOtpServersObjects] = useState(
    storage.getString('otpServers') ? JSON.parse(storage.getString('otpServers')) : {}
  );
  const otpServersStackRef = useRef([]);
  const isProcessingRef = useRef(false);
  const lastProcessedLtRef = useRef(null); // Pour éviter de retraiter la même notification

  useEffect(() => {
    console.log('📱 useEffect exécuté avec otpServersObjects:', JSON.stringify(otpServersObjects), 'notified:', notified);

    if (isProcessingRef.current) {
      console.log('📱 useEffect ignoré: déjà en cours de traitement');
      return;
    }
    isProcessingRef.current = true;

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
          const servers = Object.entries(otpServersObjects);
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
        if (remoteMessage && remoteMessage.data && remoteMessage.data.action === 'auth') {
          console.log('📱 Notification initiale détectée:', remoteMessage.data);
          if (remoteMessage.data.lt !== lastProcessedLtRef.current) {
            notification(
              remoteMessage.data,
              otpServersObjects,
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

    const initAuth = async () => {
      if (Object.keys(otpServersObjects).length === 0) {
        console.warn('📱 initAuth: Aucun serveur OTP configuré');
        return;
      }

      if (notified) {
        console.log('📱 initAuth: Notification déjà trouvée, arrêt');
        return;
      }

      otpServersStackRef.current = [...Object.keys(otpServersObjects)];
      console.log('📱 initAuth: otpServersStack initialisé:', otpServersStackRef.current);

      while (otpServersStackRef.current.length > 0) {
        const otpServer = otpServersStackRef.current.pop();
        console.log('📱 initAuth: Vérification de', otpServer);
        try {
          await otpServerStatus(
            otpServer,
            otpServersObjects,
            setOtpServersObjects,
            setNotified,
            setAdditionalData,
            otpServersStackRef.current,
            lastProcessedLtRef
          );
          if (notified) {
            console.log('📱 initAuth: Notification trouvée, arrêt');
            break;
          }
        } catch (error) {
          console.error('📱 Erreur dans initAuth pour', otpServer, ':', error.message);
        }
      }
    };

    const setup = async () => {
      await initializeToken();
      await checkInitialNotification();
      await initAuth();
      isProcessingRef.current = false;
    };
    setup();

    const unsubscribeForeground = messaging().onMessage(async (remoteMessage) => {
      console.log('📱 Notification foreground data:', remoteMessage.data);
      console.log('📱 Notification foreground response:', remoteMessage);
      if (
        remoteMessage.data &&
        (remoteMessage.data.action === 'auth' || remoteMessage.data.action === 'desync') &&
        remoteMessage.data.url &&
        remoteMessage.data.uid
      ) {
        if (remoteMessage.data.lt !== lastProcessedLtRef.current) {
          notification(
            remoteMessage.data,
            otpServersObjects,
            setOtpServersObjects,
            setNotified,
            setAdditionalData
          );
          lastProcessedLtRef.current = remoteMessage.data.lt;
        } else {
          console.log('📱 Notification foreground déjà traitée:', remoteMessage.data.lt);
        }
      } else {
        console.warn('📱 Notification foreground ignorée: données invalides', remoteMessage.data);
      }
    });

    const unsubscribeOpened = messaging().onNotificationOpenedApp((remoteMessage) => {
      console.log('📱 Notification pending ouverte (background):', remoteMessage);
      if (
        remoteMessage &&
        remoteMessage.data &&
        (remoteMessage.data.action === 'auth' || remoteMessage.data.action === 'desync') &&
        remoteMessage.data.url &&
        remoteMessage.data.uid
      ) {
        if (remoteMessage.data.lt !== lastProcessedLtRef.current) {
          notification(
            remoteMessage.data,
            otpServersObjects,
            setOtpServersObjects,
            setNotified,
            setAdditionalData
          );
          lastProcessedLtRef.current = remoteMessage.data.lt;
        } else {
          console.log('📱 Notification ouverte déjà traitée:', remoteMessage.data.lt);
        }
      } else {
        console.warn('📱 Notification ouverte ignorée: données invalides', remoteMessage?.data);
      }
    });

    const unsubscribeTokenRefresh = messaging().onTokenRefresh(async (newToken) => {
      try {
        let currentGcmId = storage.getString('gcm_id') || '';
        currentGcmId = currentGcmId.replace(/^"|"$/g, '');
        console.log('📱 Token refresh:', newToken);

        if (currentGcmId !== newToken) {
          const servers = Object.entries(otpServersObjects);
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
          console.log('📱 gcm_id mis à jour via refresh:', newToken);
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
  }, [otpServersObjects, notified]);

  return { notified, setNotified, additionalData, setAdditionalData, otpServersObjects, setOtpServersObjects };
};

export default useNotifications;
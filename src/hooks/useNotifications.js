import {useState, useEffect, useRef} from 'react';
import messaging from '@react-native-firebase/messaging';
import {storage} from '../utils/storage';
import {notification, refresh, otpServerStatus} from '../services/auth';

const useNotifications = () => {
  const [notified, setNotified] = useState(false);
  const [additionalData, setAdditionalData] = useState(null);

  const [otpServersObjects, setOtpServersObjects] = useState(() => {
    try {
      const raw = storage.getString('otpServers');
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      console.warn('Erreur parsing otpServers:', e.message);
      return {};
    }
  });

  const otpServersRef = useRef(otpServersObjects);
  const otpServersStackRef = useRef([]);
  const isProcessingRef = useRef(false);
  const lastProcessedLtRef = useRef(null);

  // Garde en mémoire la dernière version de otpServersObjects
  useEffect(() => {
    otpServersRef.current = otpServersObjects;
  }, [otpServersObjects]);

  useEffect(() => {
    console.log('📱 useEffect exécuté');

    if (isProcessingRef.current) {
      console.log('📱 useEffect ignoré: déjà en cours de traitement');
      return;
    }
    isProcessingRef.current = true;

    const initializeToken = async () => {
      try {
        // 🔐 1. Demande de permission (nécessaire sur iOS)
        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        if (!enabled) {
          console.warn('📵 Permission de notifications refusée');
          return;
        }

        let currentGcmId = storage.getString('gcm_id') || '';
        currentGcmId = currentGcmId.replace(/^"|"$/g, '');
        const newToken = await Promise.race([
          messaging().getToken(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout getToken')), 10000),
          ),
        ]);
        console.log('📱 Nouveau token Firebase:', newToken);

        if (!currentGcmId) {
          storage.set('gcm_id', newToken);
          console.log('📱 gcm_id initialisé:', newToken);
        } else if (currentGcmId !== newToken) {
          console.log(
            '📱 Mise à jour du gcm_id:',
            currentGcmId,
            '->',
            newToken,
          );
          const servers = Object.entries(otpServersRef.current);
          for (const [otpServerKey, serverData] of servers) {
            try {
              const result = await refresh(
                serverData.host,
                serverData.uid,
                serverData.tokenSecret,
                currentGcmId,
                newToken,
              );
              console.log(`📱 Refresh pour ${otpServerKey}:`, result);
            } catch (error) {
              console.warn(
                `📱 Échec du refresh pour ${otpServerKey}:`,
                error.message,
              );
            }
          }
          storage.set('gcm_id', newToken);
          console.log('📱 gcm_id mis à jour:', newToken);
        } else {
          console.log('📱 gcm_id inchangé:', currentGcmId);
        }
      } catch (error) {
        console.error(
          'Erreur lors de l’initialisation du token:',
          error.message,
        );
      }
    };

    const checkInitialNotification = async () => {
      try {
        const remoteMessage = await messaging().getInitialNotification();
        if (
          remoteMessage &&
          remoteMessage.data &&
          remoteMessage.data.action === 'auth'
        ) {
          console.log('📱 Notification initiale détectée:', remoteMessage.data);
          if (remoteMessage.data.lt !== lastProcessedLtRef.current) {
            notification(
              remoteMessage.data,
              otpServersRef.current,
              setOtpServersObjects,
              setNotified,
              setAdditionalData,
            );
            lastProcessedLtRef.current = remoteMessage.data.lt;
          } else {
            console.log(
              '📱 Notification initiale déjà traitée:',
              remoteMessage.data.lt,
            );
          }
        } else {
          console.log('📱 Aucune notification initiale détectée');
        }
      } catch (error) {
        console.error('Erreur dans checkInitialNotification:', error.message);
      }
    };

    const initAuth = async () => {
      const currentOtpServers = otpServersRef.current;

      if (Object.keys(currentOtpServers).length === 0) {
        console.warn('📱 initAuth: Aucun serveur OTP configuré');
        return;
      }

      if (notified) {
        console.log('📱 initAuth: Notification déjà trouvée, arrêt');
        return;
      }

      otpServersStackRef.current = [...Object.keys(currentOtpServers)];
      console.log(
        '📱 initAuth: otpServersStack initialisé:',
        otpServersStackRef.current,
      );

      while (otpServersStackRef.current.length > 0) {
        const otpServer = otpServersStackRef.current.pop();
        console.log('📱 initAuth: Vérification de', otpServer);
        try {
          await otpServerStatus(
            otpServer,
            otpServersRef.current,
            setOtpServersObjects,
            setNotified,
            setAdditionalData,
            otpServersStackRef.current,
            lastProcessedLtRef,
          );
          if (notified) {
            console.log('📱 initAuth: Notification trouvée, arrêt');
            break;
          }
        } catch (error) {
          console.error(
            '📱 Erreur dans initAuth pour',
            otpServer,
            ':',
            error.message,
          );
        }
      }
    };

    const setup = async () => {
      try {
        await initializeToken();
        await checkInitialNotification();
        await initAuth();
      } catch (e) {
        console.error('Erreur setup:', e.message);
      } finally {
        isProcessingRef.current = false;
      }
    };

    setup();

    const unsubscribeForeground = messaging().onMessage(async remoteMessage => {
      console.log('📱 Notification foreground data:', remoteMessage.data);
      if (
        remoteMessage.data &&
        (remoteMessage.data.action === 'auth' ||
          remoteMessage.data.action === 'desync') &&
        remoteMessage.data.url &&
        remoteMessage.data.uid
      ) {
        if (remoteMessage.data.lt !== lastProcessedLtRef.current) {
          notification(
            remoteMessage.data,
            otpServersRef.current,
            setOtpServersObjects,
            setNotified,
            setAdditionalData,
          );
          lastProcessedLtRef.current = remoteMessage.data.lt;
        } else {
          console.log(
            '📱 Notification foreground déjà traitée:',
            remoteMessage.data.lt,
          );
        }
      } else {
        console.warn(
          '📱 Notification foreground ignorée: données invalides',
          remoteMessage.data,
        );
      }
    });

    const unsubscribeOpened = messaging().onNotificationOpenedApp(
      remoteMessage => {
        console.log('📱 Notification ouverte (background):', remoteMessage);
        if (
          remoteMessage &&
          remoteMessage.data &&
          (remoteMessage.data.action === 'auth' ||
            remoteMessage.data.action === 'desync') &&
          remoteMessage.data.url &&
          remoteMessage.data.uid
        ) {
          if (remoteMessage.data.lt !== lastProcessedLtRef.current) {
            notification(
              remoteMessage.data,
              otpServersRef.current,
              setOtpServersObjects,
              setNotified,
              setAdditionalData,
            );
            lastProcessedLtRef.current = remoteMessage.data.lt;
          } else {
            console.log('📱 Notification déjà traitée:', remoteMessage.data.lt);
          }
        } else {
          console.warn(
            '📱 Notification ignorée: données invalides',
            remoteMessage?.data,
          );
        }
      },
    );

    const unsubscribeTokenRefresh = messaging().onTokenRefresh(
      async newToken => {
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
                  newToken,
                );
                console.log(`📱 Refresh pour ${otpServerKey}:`, result);
              } catch (error) {
                console.warn(
                  `📱 Échec du refresh pour ${otpServerKey}:`,
                  error.message,
                );
              }
            }
            storage.set('gcm_id', newToken);
            console.log('📱 gcm_id mis à jour via refresh:', newToken);
          }
        } catch (error) {
          console.error('Erreur lors du refresh du token:', error.message);
        }
      },
    );

    return () => {
      console.log('📱 Nettoyage useEffect');
      unsubscribeForeground();
      unsubscribeOpened();
      unsubscribeTokenRefresh();
      isProcessingRef.current = false;
    };
  }, [notified]); // otpServersObjects retiré pour éviter les boucles

  return {
    notified,
    setNotified,
    additionalData,
    setAdditionalData,
    otpServersObjects,
    setOtpServersObjects,
  };
};

export default useNotifications;

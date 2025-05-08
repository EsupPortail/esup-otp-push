import { useState, useEffect } from 'react';
import messaging from '@react-native-firebase/messaging';
import {storage} from '../utils/storage';
import { notification } from '../services/auth';

const useNotifications = () => {
  const [notified, setNotified] = useState(false);
  const [additionalData, setAdditionalData] = useState(null);
  const [otpServersObjects, setOtpServersObjects] = useState(
    storage.getString('otpServers') ? JSON.parse(storage.getString('otpServers')) : {}
  );

  useEffect(() => {
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
    };
  }, [otpServersObjects]);

  return { notified, setNotified, additionalData, setAdditionalData, otpServersObjects, setOtpServersObjects };
};

export default useNotifications;
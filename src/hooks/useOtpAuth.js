import { useState, useEffect, useRef } from 'react';
import { storage } from '../utils/storage';
import { otpServerStatus } from '../services/auth';
import { useOtpServersStore } from '../stores/useOtpServersStore';

export const useOtpAuth = () => {
  const [notified, setNotified] = useState(false);
  const [additionalData, setAdditionalData] = useState(null);
  const otpServersObjectsZustand = useOtpServersStore(state => state.otpServers);
  const [otpServersObjects, setOtpServersObjects] = useState(otpServersObjectsZustand);

  const otpServersRef = useRef(otpServersObjects);
  const lastProcessedLtRef = useRef(null);

  useEffect(() => {
    setOtpServersObjects(otpServersObjectsZustand);
  }, [otpServersObjectsZustand]);

  useEffect(() => {
    console.log('[useOtpAuth] otpServersObjects changed:', otpServersObjects);
    otpServersRef.current = otpServersObjects;
  }, [otpServersObjects]);

  const initAuth = async () => {
    console.log('[useOtpAuth] initAuth OtpServersObject:', otpServersObjects);
    console.log('[useOtpAuth] initAuth OtpServersRef:', otpServersRef.current);
    // check on zustand store
    const otpServersFromStore = useOtpServersStore.getState().otpServers;
    console.log('[useOtpAuth] initAuth OtpServersFromStore:', otpServersFromStore);
    const servers = otpServersRef.current;
    if (Object.keys(servers).length === 0) {
      console.warn('📱 initAuth: Aucun serveur OTP configuré');
      return;
    }

    if (notified) {
      console.log('📱 initAuth: Notification déjà trouvée, arrêt');
      return;
    }

    const stack = [...Object.keys(servers)];
    while (stack.length > 0) {
      const otpServer = stack.pop();
      try {
        await otpServerStatus(
          otpServer,
          servers,
          setOtpServersObjects,
          setNotified,
          setAdditionalData,
          stack,
          lastProcessedLtRef
        );
        if (notified) break;
      } catch (error) {
        console.error('Erreur initAuth pour', otpServer, error.message);
      }
    }
  };

  return {
    notified, setNotified,
    additionalData, setAdditionalData,
    otpServersObjects, setOtpServersObjects,
    otpServersRef, lastProcessedLtRef,
    initAuth,
  };
};

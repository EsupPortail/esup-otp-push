import { useState, useEffect, useRef } from 'react';
import { AppState } from 'react-native';

export const useAppLifecycle = () => {
  const [appState, setAppState] = useState(AppState.currentState);
  const [isAppResumed, setIsAppResumed] = useState(false); // On gère l'état de reprise ici
  const appStateRef = useRef(AppState.currentState); // Pour se souvenir de l'état précédent

  const handleAppStateChange = (nextAppState) => {
    const previousAppState = appStateRef.current;
    setAppState(nextAppState);
    appStateRef.current = nextAppState;

    // Détecter la transition vers l'état actif
    if (
      previousAppState.match(/inactive|background/) &&
      nextAppState === 'active'
    ) {
      // On met à jour l'état de "reprise" à true
      setIsAppResumed(true);
      console.log('App has resumed from background!');
    }
  };

  // Une fonction pour que le composant puisse réinitialiser l'état
  const resetIsAppResumed = () => {
    setIsAppResumed(false);
  };

  useEffect(() => {
    const subscription = AppState.addEventListener(
      'change',
      handleAppStateChange,
    );

    // Vérifier l'état initial
    if (appStateRef.current === 'active') {
      console.log('App is currently active.');
    }

    return () => {
      subscription.remove();
    };
  }, []); // On garde le tableau de dépendances vide, car la fonction handleAppStateChange utilise une ref

  return {
    appState,
    isForeground: appState === 'active',
    isAppResumed,
    resetIsAppResumed, // On expose la fonction pour réinitialiser l'état
  };
};
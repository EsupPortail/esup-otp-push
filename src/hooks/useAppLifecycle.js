import { useState, useEffect, useRef } from 'react';
import { AppState } from 'react-native';

export const useAppLifecycle = () => {
  const [appState, setAppState] = useState(AppState.currentState);
  const appStateRef = useRef(AppState.currentState); // Pour garder la valeur précédente
  const isAppResumedRef = useRef(false); // Pour indiquer si l'app est revenue au premier plan

  const handleAppStateChange = (nextAppState) => {
    const previousAppState = appStateRef.current;
    setAppState(nextAppState);
    appStateRef.current = nextAppState;

    // Détecter la transition vers l'état actif
    if (
      previousAppState.match(/inactive|background/) &&
      nextAppState === 'active'
    ) {
      isAppResumedRef.current = true;
      console.log('App has resumed from background!');
    }
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
  }, []);

  return {
    appState, // Etat de l'app ('active', 'background', 'inactive')
    isForeground: appState === 'active', // Booléen indiquant si l'app est au premier plan
    isAppResumed: isAppResumedRef.current, // Booléen indiquant si l'app est revenue au premier plan
  };
};
import { useState, useEffect, useRef } from 'react';
import { AppState } from 'react-native';

export const useAppLifecycle = (onResume) => {
  const [appState, setAppState] = useState(AppState.currentState);
  const [isAppResumed, setIsAppResumed] = useState(false);
  const appStateRef = useRef(AppState.currentState);

  const handleAppStateChange = (nextAppState) => {
    const previous = appStateRef.current;
    setAppState(nextAppState);
    appStateRef.current = nextAppState;

    if (previous.match(/inactive|background/) && nextAppState === 'active') {
      setIsAppResumed(true);
      onResume?.(); // 🔥 exécute la callback si elle existe
    }
  };

  const resetIsAppResumed = () => setIsAppResumed(false);

  useEffect(() => {
    const sub = AppState.addEventListener('change', handleAppStateChange);
    return () => sub.remove();
  }, [onResume]);

  return {
    appState,
    isForeground: appState === 'active',
    isAppResumed,
    resetIsAppResumed,
  };
};
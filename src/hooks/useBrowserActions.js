import { useRef, useState, useCallback, useEffect } from 'react';
import { fetchAllUserInfo, fetchPushActivationData, fetchUserCredentials, fetchUserInfo } from '../services/browserService';
import { browserManager, useBrowserStore } from '../stores/useBrowserStore';

export function useBrowserActions(initialUrl) {
  const webviewRef = useRef(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [currentUrl, setCurrentUrl] = useState(initialUrl);
  const [hideWebview, setHideWebview] = useState(false);
  //const [methods, setMethods] = useState(null);
  const {visible, user} = useBrowserStore();

  useEffect(() => {
    if (!visible) return;
    fetchAllUserInfo();
    console.log('[USEEFFECT] user from store:', user);
    console.log('[useBrowserActions-UseEffect] visible changed:', visible);
  }, [visible]);

  const onNavigationStateChange = useCallback(async (navState) => {
    // Intercepteur
    if (navState.url.includes('/preferences#')) {
        fetchAllUserInfo();

        setHideWebview(true);
        return;
    }

    setCanGoBack(navState.canGoBack);
    setCanGoForward(navState.canGoForward);
    setCurrentUrl(navState.url);
  }, []);

  const goBack = useCallback(() => {
    if (canGoBack) webviewRef.current?.goBack();
  }, [canGoBack]);

  const goForward = useCallback(() => {
    if (canGoForward) webviewRef.current?.goForward();
  }, [canGoForward]);

  const reload = useCallback(() => {
    webviewRef.current?.reload();
  }, []);

  return {
    webviewRef,
    canGoBack,
    canGoForward,
    currentUrl,
    hideWebview,
    onNavigationStateChange,
    goBack,
    goForward,
    reload,
  };
}

import { useRef, useState, useCallback, useEffect } from 'react';
import { fetchUserInfo } from '../services/browserService';
import { useBrowserStore } from '../stores/useBrowserStore';

export function useBrowserActions(initialUrl) {
  const webviewRef = useRef(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [currentUrl, setCurrentUrl] = useState(initialUrl);
  const [hideWebview, setHideWebview] = useState(false);
  const [methods, setMethods] = useState(null);
  const {visible} = useBrowserStore();

  useEffect(() => {
    fetchUserInfo().then(userInfo => {
      setMethods(userInfo.user);
    });
    console.log('[useBrowserActions-UseEffect] visible changed:', visible);
  }, [visible]);

  const onNavigationStateChange = useCallback(async (navState) => {
    // Intercepteur
    if (navState.url.includes('/preferences#')) {
        const userInfo = await fetchUserInfo();
        console.log('📱 onNavigationStateChange: userInfo :', userInfo);
        console.log('📱 onLoadEnd: userInfo :', userInfo);
        setMethods(userInfo.user);

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
    methods,
    onNavigationStateChange,
    goBack,
    goForward,
    reload,
  };
}

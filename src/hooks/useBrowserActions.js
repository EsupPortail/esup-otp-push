import { useRef, useState, useCallback } from 'react';

export function useBrowserActions(initialUrl) {
  const webviewRef = useRef(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [currentUrl, setCurrentUrl] = useState(initialUrl);
  const [hideWebview, setHideWebview] = useState(false);

  const onNavigationStateChange = useCallback((navState) => {
    // Intercepteur
    if (navState.url.includes('/preferences#')) {
        console.log('📱 onNavigationStateChange: url contient ', navState.url);
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

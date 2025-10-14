import { useRef, useState, useCallback } from 'react';

export function useBrowserActions(initialUrl = 'https://www.google.com') {
  const webviewRef = useRef(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [currentUrl, setCurrentUrl] = useState(initialUrl);

  const onNavigationStateChange = useCallback((navState) => {
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
    onNavigationStateChange,
    goBack,
    goForward,
    reload,
  };
}

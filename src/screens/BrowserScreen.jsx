import React, {useEffect, useMemo, useRef} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Platform,
} from 'react-native';
import BottomSheet, {BottomSheetView} from '@gorhom/bottom-sheet';
import {WebView} from 'react-native-webview';
import {useBrowserStore} from '../stores/useBrowserStore';
import Icon from 'react-native-vector-icons/Ionicons';
import Material from 'react-native-vector-icons/MaterialCommunityIcons';
import { useBrowserActions } from '../hooks/useBrowserActions';

export default function BrowserBottomSheet() {
  const bottomSheetRef = useRef(null);
  const {visible, url, hide} = useBrowserStore();
  const snapPoints = useMemo(() => ['40%','70%','90%'], []);
  const {
    webviewRef,
    canGoBack,
    canGoForward,
    currentUrl,
    onNavigationStateChange,
    goBack,
    goForward,
    reload,
  } = useBrowserActions(url);

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={visible ? 1 : -1}
      snapPoints={snapPoints}
      enablePanDownToClose
      onClose={hide}
      enableContentPanningGesture={false}
    >
      <BottomSheetView style={styles.sheetContent}>
        {/* --- Barre de navigation --- */}
          <View style={styles.navBar}>
            <View style={styles.actionButtons}>
              <TouchableOpacity onPress={goBack} disabled={!canGoBack}>
                <Material name="arrow-left" size={24} color={canGoBack ? "#000" : "#ccc"} />
              </TouchableOpacity>
              <TouchableOpacity onPress={reload}>
                <Material name="reload" size={24} color="#000" />
              </TouchableOpacity>
              <TouchableOpacity onPress={goForward} disabled={!canGoForward}>
                <Material name="arrow-right" size={24} color={canGoForward ? "#000" : "#ccc"} />
              </TouchableOpacity>
            </View>
          </View>

        <WebView 
          ref={webviewRef} 
          source={{uri: url}} 
          style={styles.webview}
          onNavigationStateChange={onNavigationStateChange}
        />
      </BottomSheetView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  sheetContent: {
    flex: 1,
    height: '100%',
  },
  browserContainer: {
    flex: 1,
  },
  webview: {},
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: '#ddd',
    marginTop: 8,
  },
  urlText: {
    fontSize: 13,
    color: '#444',
  },
  urlContainer: {
    flexDirection: 'row', 
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4, 
    borderBottomWidth: 1, 
    borderColor: '#ddd' 
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
  }
});

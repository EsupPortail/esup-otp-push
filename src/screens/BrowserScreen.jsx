import React, {useEffect, useMemo, useRef} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Platform,
} from 'react-native';
import BottomSheet, {BottomSheetBackdrop, BottomSheetView} from '@gorhom/bottom-sheet';
import {WebView} from 'react-native-webview';
import {browserManager, useBrowserStore} from '../stores/useBrowserStore';
import Icon from 'react-native-vector-icons/Ionicons';
import Material from 'react-native-vector-icons/MaterialCommunityIcons';
import { useBrowserActions } from '../hooks/useBrowserActions';
import MethodsScreen, { ManagerChooser } from './MethodsScreen';
import { useTheme } from '@react-navigation/native';
import Animated, { interpolate } from 'react-native-reanimated';

export default function BrowserBottomSheet() {
  const {colors} = useTheme();
  const bottomSheetRef = useRef();
  const {visible, url, hide} = useBrowserStore();
  const snapPoints = useMemo(() => ['10%','40%','70%','75%', '90%'], []);
  const {webviewRef, hideWebview, onNavigationStateChange, canGoBack, canGoForward, currentUrl, goBack, goForward, reload} = useBrowserActions(url);

  if (url === '') return (
    <BottomSheet
      ref={bottomSheetRef}
      index={visible ? 3 : -1}
      snapPoints={snapPoints}
      enablePanDownToClose
      onClose={hide}
      enableContentPanningGesture={false}
      backdropComponent={renderBackdrop}
    >
      <BottomSheetView style={styles.sheetContent}>
        <ManagerChooser />
      </BottomSheetView>
    </BottomSheet>
  )

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={visible ? 3 : -1}
      snapPoints={snapPoints}
      enablePanDownToClose
      onClose={hide}
      enableContentPanningGesture={false}
      backdropComponent={renderBackdrop}
    >
      <BottomSheetView style={styles.sheetContent}>
        {/* <BrowserNavBar currentUrl={currentUrl} canGoBack={canGoBack} canGoForward={canGoForward} goBack={goBack} goForward={goForward} reload={reload} /> */}
        {!hideWebview ?
        <WebView 
          ref={webviewRef} 
          source={{uri: url}} 
          style={styles.webview}
          onNavigationStateChange={onNavigationStateChange}
          sharedCookiesEnabled={true}
          userAgent="Mozilla/5.0 (Linux; Android 13; Pixel 6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
        /> :
        <MethodsScreen user={browserManager.getUser()?.methods} bottomSheetRef={bottomSheetRef} />
        }
      </BottomSheetView>
    </BottomSheet>
  );
}

const BrowserNavBar = ({ currentUrl, canGoBack, canGoForward, goBack, goForward, reload }) => {
  return (
    <>
      {/* --- URL --- */}
      <View style={styles.urlContainer}>
        <Text style={styles.urlText}>{currentUrl}</Text>
      </View>
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
    </>
  )
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

const renderBackdrop = props => (
  <BottomSheetBackdrop
    {...props}
    appearsOnIndex={2}
    disappearsOnIndex={1}
    pressBehavior="none"
    opacity={0.3}   //correspond à rgba(0,0,0,0.5)
    enableTouchThrough={true}
  />
);
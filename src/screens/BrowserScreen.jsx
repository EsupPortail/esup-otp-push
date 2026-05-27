import React, {useEffect, useMemo, useRef, useState} from 'react';
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
import { ActivityIndicator } from 'react-native';
import {browserManager, useBrowserStore} from '../stores/useBrowserStore';
import Icon from 'react-native-vector-icons/Ionicons';
import Material from 'react-native-vector-icons/MaterialCommunityIcons';
import { useBrowserActions } from '../hooks/useBrowserActions';
import MethodsScreen, { ManagerChooser } from './MethodsScreen';
import { useTheme } from '@react-navigation/native';
import useAccessibilityCheck from '../hooks/useAccessibilityCheck';
import Animated, { interpolate } from 'react-native-reanimated';
import DeviceInfo from 'react-native-device-info';

export default function BrowserBottomSheet() {
  const {colors} = useTheme();
  const bottomSheetRef = useRef();
  const {visible, url, hide} = useBrowserStore();
  const [userAgent, setUserAgent] = React.useState('');
  const [logoutInProgress, setLogoutInProgress] = useState(false);
  const snapPoints = useMemo(() => ['10%','40%','70%','75%', '90%'], []);
  const {webviewRef, hideWebview, onNavigationStateChange, canGoBack, canGoForward, currentUrl, goBack, goForward, reload} = useBrowserActions(url);
  const { status, retry } = useAccessibilityCheck(url, 5000);
  const showLogoutButton = currentUrl?.includes('/preferences') && !logoutInProgress;

  // Construction de l'UA
  async function buildEsupUserAgent() {
    const baseUA = DeviceInfo.getUserAgentSync();
    const appVersion = DeviceInfo.getVersion();

    console.log('[buildEsupUserAgent] baseUA:', `${baseUA} Esup Auth/${appVersion}`);

    return `${baseUA} Esup Auth/${appVersion}`;
  }

  useEffect(() => {
    buildEsupUserAgent().then(ua => setUserAgent(ua));
  }, []);

  useEffect(() => {
    setLogoutInProgress(false);
  }, [visible]);

  if (url === '') return (
    <BottomSheet
      ref={bottomSheetRef}
      index={visible ? 4 : -1}
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
      index={visible ? 4 : -1}
      snapPoints={snapPoints}
      enablePanDownToClose
      onClose={hide}
      enableContentPanningGesture={false}
      backdropComponent={renderBackdrop}
    >
      <BottomSheetView style={styles.sheetContent}>
        {/* <BrowserNavBar currentUrl={currentUrl} canGoBack={canGoBack} canGoForward={canGoForward} goBack={goBack} goForward={goForward} reload={reload} /> */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <TouchableOpacity style={{ paddingHorizontal: 12, paddingVertical: 2 }} onPress={() => {
            browserManager.setUrl('');
            browserManager.setUser({}); // Réinitialiser l'utilisateur pour éviter de garder les données du manager précédent
            hide();
          } }>
            <Material name="arrow-left-circle" size={32} color="#284758" />
          </TouchableOpacity>
          {showLogoutButton && (
            <TouchableOpacity style={{ paddingHorizontal: 12, paddingVertical: 2 }} onPress={() => {
              setLogoutInProgress(true);
              if (!url) return;
              const baseUrl = url.replace(/\/login\/?$/, '');
              browserManager.setUrl(`${baseUrl}/logout`);
              browserManager.setUser({});
            }}>
              <Material name="logout" size={32} color="#284758" />
            </TouchableOpacity>
          )}
        </View>
        {!hideWebview ? (
          status === 'checking' ? (
            <View style={styles.centered}>
              <View style={styles.messageBox}>
                <ActivityIndicator size="large" />
                <Text style={styles.messageTitle}>Vérification en cours</Text>
                <Text style={styles.messageText}>Nous testons la disponibilité du service...</Text>
              </View>
            </View>
          ) : status === 'failed' ? (
            <View style={styles.centered}>
              <View style={styles.messageBox}>
                <Text style={styles.messageTitle}>Service inaccessible</Text>
                <Text style={styles.messageText}>
                  Nous ne parvenons pas à joindre le service. Vérifiez votre connexion Internet et assurez-vous d'être bien connecté au réseau intranet de l'établissement
                </Text>
                <View style={styles.buttonsRow}>
                  <TouchableOpacity onPress={() => retry()} style={styles.primaryBtn}>
                    <Text style={styles.btnText}>Réessayer</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => { browserManager.setUrl(''); hide(); }} style={styles.secondaryBtn}>
                    <Text style={styles.btnText}>Retour</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ) : (
            <WebView 
              ref={webviewRef} 
              source={{uri: url}} 
              style={styles.webview}
              onNavigationStateChange={onNavigationStateChange}
              sharedCookiesEnabled={true}
              userAgent={userAgent}
            />
          )
        ) : (
          <MethodsScreen user={browserManager.getUser()?.methods} bottomSheetRef={bottomSheetRef} />
        )}
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
  ,
  centered: {
    flex: 1,
    justifyContent: 'top',
    alignItems: 'center',
    padding: 20,
  },
  messageBox: {
    width: '100%',
    maxWidth: 520,
    padding: 18,
    backgroundColor: '#fff',
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  messageTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
    color: '#222',
  },
  messageText: {
    textAlign: 'center',
    color: '#555',
    marginTop: 8,
    marginBottom: 12,
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    gap: 8,
  },
  primaryBtn: {
    backgroundColor: '#e6f0ff',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginRight: 8,
  },
  secondaryBtn: {
    backgroundColor: '#f2f2f2',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  btnText: {
    color: '#184e8a',
    fontWeight: '600',
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
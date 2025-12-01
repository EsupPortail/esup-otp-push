import {NavigationContainer} from '@react-navigation/native';
import AppStack from './navigation/AppStack';
import {useState, useMemo, useEffect, useRef} from 'react';
import {View} from 'react-native';
import DarkTheme from './theme/DarkTheme';
import LightTheme from './theme/LightTheme';
import {AppContext} from './theme/AppContext';
import {storage} from './utils/storage';
import {MigrateToMMKV} from './components/MigrateStorage';
import useNotifications from './hooks/useNotifications';
import {initializeFirebase} from './utils/firebase';
import MireActionSheet from './components/MireActionSheet';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import NfcBottomSheet from './components/NfcBottomSheet';
import {setBottomSheetRef} from './services/nfcBottomSheetService';
import AppSplashScreen from './components/AppSplashScreen';
import { initializeSecureStorage, setStorage } from './utils/secureStorage';
import ToastManager from 'toastify-react-native'
import { toastConfig } from './components/Toast';
import { usePushNotificationPermission } from './hooks/usePushNotificationPermission';
import { useAppLifecycle } from './hooks/useAppLifecycle';
import NfcManager from 'react-native-nfc-manager';
import { useNfcStore } from './stores/useNfcStore';
import { useOtpServersStore } from './stores/useOtpServersStore';
import BrowserBottomSheet from './screens/BrowserScreen';

export default function App() {
  const [isDarkTheme, setIsDarkTheme] = useState(
    storage.getString('darkMode') == 'enabled' ? true : false,
  );
  const [isMigrated, setIsMigrated] = useState(
    storage.getBoolean('migrationDone') || false,
  );
  const appContext = useMemo(() => {
    return {isDarkTheme, setIsDarkTheme};
  }, [isDarkTheme]);
  const bottomSheetRef = useRef(null);
  const {
    initAuth,
    notified,
    setNotified,
    additionalData,
    setAdditionalData,
    otpServersObjects,
    setOtpServersObjects,
  } = useNotifications();
  const setIsNfcEnabled = useNfcStore(state => state.setIsNfcEnabled);
  const otpServers = useOtpServersStore(state => state.otpServers);
  const { checkPermission } = usePushNotificationPermission(otpServers);

// Gestion du Resume de l'application
  useAppLifecycle(async () => {
    console.log('📱 [APP] App resumed');
    await initAuth();
    const stateOfNfc = await NfcManager.isEnabled();
    setIsNfcEnabled(stateOfNfc);

    if (Object.keys(otpServers).length > 0) {
      checkPermission();
    }
  });

  // initStorage
  useEffect(() => {
    const initStorage = async () => {
      const storage = await initializeSecureStorage();
      setStorage(storage);
    }
    initStorage();
  }, []);

  useEffect(() => {
    const migrate = async () => {
      if (!isMigrated) {
        await MigrateToMMKV();
        setIsMigrated(true);
      }

      // Voir le contenu de mmkv
      console.log(
        storage
          .getAllKeys()
          .forEach(key => console.log(key, ':::', storage.getString(key))),
      );
    };

    migrate(); // Exécute la fonction asynchrone
    initializeFirebase(); // Initialiser firebase
  }, []);

  useEffect(() => {
    if (bottomSheetRef.current) {
      setBottomSheetRef(bottomSheetRef.current);
      console.log('📱 bottomSheetRef initialisé:', bottomSheetRef.current);
    }
  }, [bottomSheetRef.current]);

  useEffect(() => {
    if (isMigrated) {
      const darkValue = storage.getString('darkMode');
      setIsDarkTheme(darkValue === 'enabled');
    }
  }, [isMigrated]);

  const config = {
    screens: {
      Home: {
        path: 'accueil/:userId',
        parse: {
          userId: userId => `${userId}`,
          foo: foo => `${foo}`,
          bar: bar => `${bar}`,
        }
      },
      QRCodeScanner: 'qr-code-scanner',
      ManualInput: 'saisie-manuelle',
    }
  }

  if (!isMigrated) return <AppSplashScreen />;

  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <NavigationContainer 
        linking={{
          prefixes: ["esupauth://app"],
          config: config,
        }}
        theme={isDarkTheme ? DarkTheme : LightTheme}
      >
        <AppContext.Provider value={appContext}>
          <AppStack />
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            }}>
            <MireActionSheet
              visible={notified}
              additionalData={additionalData}
              otpServersObjects={otpServersObjects}
              setOtpServersObjects={setOtpServersObjects}
              setNotified={setNotified}
              setAdditionalData={setAdditionalData}
            />
          </View>
          <NfcBottomSheet ref={bottomSheetRef} />
          <BrowserBottomSheet />
          <ToastManager config={toastConfig} />
        </AppContext.Provider>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}

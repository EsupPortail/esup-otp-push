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
import { cleanOtpServers } from './services/auth';
import { Gesture, GestureHandlerRootView } from 'react-native-gesture-handler';
import NfcBottomSheet from './components/NfcBottomSheet';
import { setBottomSheetRef } from './services/nfcBottomSheetService';

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
    notified,
    setNotified,
    additionalData,
    setAdditionalData,
    otpServersObjects,
    setOtpServersObjects,
  } = useNotifications();

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

    if (bottomSheetRef.current) {
      setBottomSheetRef(bottomSheetRef.current);
    }

    migrate(); // Exécute la fonction asynchrone
    initializeFirebase(); // Initialiser firebase
  }, []);

  return (
    <GestureHandlerRootView style={{flex: 1}}>
    <NavigationContainer theme={isDarkTheme ? DarkTheme : LightTheme}>
      <AppContext.Provider value={appContext}>
        <AppStack />
        <View style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0}}>
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
      </AppContext.Provider>
    </NavigationContainer>
    </GestureHandlerRootView>
  );
}

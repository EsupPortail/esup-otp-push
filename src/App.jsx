import {NavigationContainer} from '@react-navigation/native';
import AppStack from './navigation/AppStack';
import {useState, useMemo, useEffect} from 'react';
import DarkTheme from './theme/DarkTheme';
import LightTheme from './theme/LightTheme';
import {AppContext} from './theme/AppContext';
import {storage} from './utils/storage';
import {MigrateToMMKV} from './components/MigrateStorage';

export default function App() {
  const [isDarkTheme, setIsDarkTheme] = useState(storage.getString('darkMode') == 'enabled' ? true : false);
  const [isMigrated, setIsMigrated] = useState(
    storage.getBoolean('migrationDone') || false,
  );
  const appContext = useMemo(() => {
    return {isDarkTheme, setIsDarkTheme};
  });

  useEffect(() => {
    if (!isMigrated) {
      MigrateToMMKV().then(() => setIsMigrated(true));
    }
    //voir le contenu de mmkv
    console.log(
      storage
        .getAllKeys()
        .forEach(key => console.log(key, ':::', storage.getString(key))),
    );
  }, [isMigrated]);

  return (
    <NavigationContainer theme={isDarkTheme ? DarkTheme : LightTheme}>
      <AppContext.Provider value={appContext}>
        <AppStack />
      </AppContext.Provider>
    </NavigationContainer>
  );
}

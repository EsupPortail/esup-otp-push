import {NavigationContainer} from '@react-navigation/native';
import AppStack from './navigation/AppStack';
import {useState, useMemo} from 'react';
import DarkTheme from './theme/DarkTheme';
import LightTheme from './theme/LightTheme';
import {AppContext} from './theme/AppContext';

export default function App() {
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const appContext = useMemo(() => {
    return {isDarkTheme, setIsDarkTheme};
  });
  return (
    <AppContext.Provider value={appContext}>
      <NavigationContainer theme={isDarkTheme ? DarkTheme : LightTheme}>
        <AppStack />
      </NavigationContainer>
    </AppContext.Provider>
  );
}

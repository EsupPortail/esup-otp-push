import { useCallback, useContext } from 'react';
import { View, Switch, Text, StyleSheet } from 'react-native';
import { AppContext } from '../theme/AppContext';
import { storage } from '../utils/storage';

const DarkModeToggle = () => {
  const { isDarkTheme, setIsDarkTheme } = useContext(AppContext);
  // save the state of the switch in storage
  const toggleTheme = () => {
    const newThemeState = !isDarkTheme;
    try {
      setIsDarkTheme(newThemeState);
      storage.set('darkMode', newThemeState ? 'enabled' : 'disabled');
      console.log(`[DarkModeToggle] Thème changé: ${newThemeState ? 'sombre' : 'clair'}`);
    } catch (error) {
      console.error('[DarkModeToggle] Erreur lors du changement de thème:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={{ color: isDarkTheme ? '#fff' : '#000' }}>Sombre</Text>
      <Switch value={isDarkTheme} onValueChange={() => toggleTheme()} trackColor={{ false: '#767577', true: '#81b0ff' }} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default DarkModeToggle;

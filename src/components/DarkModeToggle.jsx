import { useContext } from 'react';
import { View, Switch, Text, StyleSheet } from 'react-native';
import { AppContext } from '../theme/AppContext';

const DarkModeToggle = () => {
  const { isDarkTheme, setIsDarkTheme } = useContext(AppContext);

  return (
    <View style={styles.container}>
      <Text style={{ color: isDarkTheme ? '#fff' : '#000' }}>Sombre</Text>
      <Switch value={isDarkTheme} onValueChange={() => setIsDarkTheme(!isDarkTheme)} trackColor={{ false: '#767577', true: '#81b0ff' }} />
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

import { useTheme } from '@react-navigation/native';
import {SafeAreaView, StatusBar, StyleSheet, Text, View} from 'react-native';
import MigrateStorage from '../components/MigrateStorage';

export default function HomeScreen() {
  const {colors} = useTheme();
  return (
      <View style={styles.container}>
        <Text style={{color: colors.text}}>Home Screen</Text>
        <MigrateStorage />
      </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

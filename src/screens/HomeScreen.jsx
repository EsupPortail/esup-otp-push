import { useTheme } from '@react-navigation/native';
import {SafeAreaView, StatusBar, StyleSheet, Text, View} from 'react-native';
import NfcScreen from './NfcScreen';
import TotpScreen from './TotpScreen';
import PushScreen from './PushScreen';
import { ScrollView } from 'react-native-gesture-handler';

export default function HomeScreen() {
  const {colors} = useTheme();
  return (
      <ScrollView style={styles.container}>
        <NfcScreen withoutAddButton />
        <View style={[styles.separator, {borderColor: 'grey'}]} />
        <TotpScreen withoutAddButton />
        <View style={[styles.separator, {borderColor: 'grey'}]} />
        <PushScreen withoutAddButton />
      </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  separator: {
    borderWidth: 1,
    borderRadius: 1,
    marginHorizontal: 12, 
    borderStyle: 'dotted'
  }
});

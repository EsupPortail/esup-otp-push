import {useTheme} from '@react-navigation/native';
import {StyleSheet, Text, View, FlatList} from 'react-native';
import NfcScreen from './NfcScreen';
import TotpScreen from './TotpScreen';
import PushScreen from './PushScreen';
import {ScrollView} from 'react-native-gesture-handler';

export default function HomeScreen() {
  const {colors} = useTheme();
  const data = [];
  return (
    <FlatList
      data={data}
      renderItem={null}
      keyExtractor={(_, index) => index.toString()}
      ListHeaderComponent={
        <>
          <TotpScreen />
          <View style={[styles.separator, {borderColor: 'grey'}]} />
          <NfcScreen />
          <View style={[styles.separator, {borderColor: 'grey'}]} />
          <PushScreen />
        </>
      }
      ListFooterComponent={
        <View style={{height: 80}} />
      }
    />
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
    borderStyle: 'dotted',
  },
});

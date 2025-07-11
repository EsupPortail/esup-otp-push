import {useNavigation, useTheme} from '@react-navigation/native';
import {StyleSheet, Text, View, FlatList, TouchableOpacity, Alert} from 'react-native';
import NfcScreen from './NfcScreen';
import TotpScreen from './TotpScreen';
import PushScreen from './PushScreen';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import CustomActionSheet from '../components/CustomActionSheet';
import { useState } from 'react';

export default function HomeScreen() {
  const {colors} = useTheme();
  const navigation = useNavigation();
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);
  const data = [];

  const handleScanQrCode = () => {
    console.log('handleScanQrCode appelé');
    navigation.navigate('QRCodeScanner');
  };
  const handleManualInput = () => {
    navigation.navigate('ManualInput');
  };

  return (
    <>
    <FlatList
      data={data}
      renderItem={null}
      keyExtractor={(_, index) => index.toString()}
      ListHeaderComponent={
        <>
          <TotpScreen />
          <View style={[styles.separator, {borderColor: 'grey'}]} />
          <PushScreen />
          <View style={[styles.separator, {borderColor: 'grey'}]} />
          <NfcScreen />
        </>
      }
      ListFooterComponent={
        <View style={{height: 80}} />
      }
    />
    <TouchableOpacity style={styles.floattingButton} onPress={() => setIsActionSheetOpen(true)}>
      <Icon name="plus-circle" color={colors.primary} size={56} />
    </TouchableOpacity>
    <CustomActionSheet
        visible={isActionSheetOpen}
        onClose={() => setIsActionSheetOpen(false)}
        actions={[
          {label: 'Scanner QR code', onPress: handleScanQrCode},
          {label: 'Saisie manuelle', onPress: handleManualInput},
        ]}
      />
    </>
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
  floattingButton: {
    position: 'absolute',
    elevation: 5,
    bottom: 5,
    right: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});

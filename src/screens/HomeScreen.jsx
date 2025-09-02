import {useNavigation, useTheme} from '@react-navigation/native';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import NfcScreen from './NfcScreen';
import TotpScreen from './TotpScreen';
import PushScreen from './PushScreen';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import CustomActionSheet from '../components/CustomActionSheet';
import {useEffect, useState} from 'react';
import nfcManager from 'react-native-nfc-manager';
import {useNfcStore} from '../stores/useNfcStore';
import {useTotpStore} from '../stores/useTotpStore';
import EmptyScreen from './EmptyScreen';
import {useOtpServersStore} from '../stores/useOtpServersStore';

export default function HomeScreen() {
  const {colors} = useTheme();
  const navigation = useNavigation();
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);
  const [isNfcSupported, setIsNfcSupported] = useState(null);
  const data = [];

  // Utilisez les hooks Zustand pour récupérer l'état.
  // Le composant s'abonne maintenant aux changements de ces états.
  const {establishments} = useNfcStore();
  const {totpObjects} = useTotpStore();
  const {otpServers} = useOtpServersStore();

  const handleScanQrCode = () => {
    console.log('handleScanQrCode appelé');
    navigation.navigate('QRCodeScanner');
  };
  const handleManualInput = () => {
    navigation.navigate('ManualInput');
  };

  const checkNfc = async () => {
    const isSupported = await nfcManager.isSupported();
    return isSupported;
  };

  useEffect(() => {
    checkNfc().then(isSupported => {
      setIsNfcSupported(isSupported);
    });
  }, []);

  // On retourne un écran spécial si dans le storage aucun moyen de connexion n'est configuré
  // totpOject vide && pushObject vide && nfcObject vide
  const isEmpty =
    establishments.length === 0 &&
    Object.keys(totpObjects).length === 0 &&
    Object.keys(otpServers).length === 0;

  return (
    <>
      {isEmpty && (
        <EmptyScreen
          isActionSheetOpen={isActionSheetOpen}
          setIsActionSheetOpen={setIsActionSheetOpen}
        />
      )}
      {!isEmpty && (
        <FlatList
          data={data}
          renderItem={null}
          keyExtractor={(_, index) => index.toString()}
          ListHeaderComponent={
            <>
              {Object.keys(totpObjects).length > 0 && (
                <>
                  <TotpScreen />
                  <View style={[styles.separator, {borderColor: 'grey'}]} />
                </>
              )}
              {Object.keys(otpServers).length > 0 && (
                <>
                  <PushScreen />
                  <View style={[styles.separator, {borderColor: 'grey'}]} />
                </>
              )}
              {isNfcSupported && establishments.length > 0 && (
                <>
                  <NfcScreen />
                </>
              )}
            </>
          }
          ListFooterComponent={<View style={{height: 80}} />}
        />
      )}
      {!isEmpty && (
        <TouchableOpacity
          style={styles.floattingButton}
          onPress={() => setIsActionSheetOpen(true)}>
          <Icon name="plus-circle" color={colors.primary} size={56} />
        </TouchableOpacity>
      )}
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
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});

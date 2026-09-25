import {useNavigation, useRoute, useTheme} from '@react-navigation/native';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { set } from 'react-hook-form';
import { browserManager } from '../stores/useBrowserStore';
import useDeepLinking from '../hooks/useDeepLinking';

export default function HomeScreen() {
  const {colors, dark} = useTheme();
  const navigation = useNavigation();
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);
  const [isNfcSupported, setIsNfcSupported] = useState(null);
  const data = [];
  const insets = useSafeAreaInsets();

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
  const handleBrowser = () => {
    setIsActionSheetOpen(false);
    browserManager.show();
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
  useDeepLinking();

  // On retourne un écran spécial si dans le storage aucun moyen de connexion n'est configuré
  // totpOject vide && pushObject vide && nfcObject vide
  const isEmpty =
    establishments.length === 0 &&
    Object.keys(totpObjects).length === 0 &&
    Object.keys(otpServers).length === 0;
  const homeBackground = dark ? colors.background : '#EAF0F2';
  const cardBorderColor = dark ? colors.border : '#D6E0E5';

  return (
    <>
      {isEmpty && (
        <EmptyScreen
          setIsActionSheetOpen={setIsActionSheetOpen}
        />
      )}
      {!isEmpty && (
        <FlatList
          style={{backgroundColor: homeBackground}}
          data={data}
          renderItem={null}
          keyExtractor={(_, index) => index.toString()}
          ListHeaderComponent={
            <View style={styles.content}>
              {Object.keys(totpObjects).length > 0 && (
                <View style={[styles.methodCard, !dark && styles.lightMethodCard, {backgroundColor: colors.card, borderColor: cardBorderColor}]}>
                  <TotpScreen containerStyle={{backgroundColor: colors.card}} />
                </View>
              )}
              {Object.keys(otpServers).length > 0 && (
                <View style={[styles.methodCard, !dark && styles.lightMethodCard, {backgroundColor: colors.card, borderColor: cardBorderColor}]}>
                  <PushScreen containerStyle={{backgroundColor: colors.card}} />
                </View>
              )}
              {isNfcSupported && establishments.length > 0 && (
                <View style={[styles.methodCard, !dark && styles.lightMethodCard, {backgroundColor: colors.card, borderColor: cardBorderColor}]}>
                  <NfcScreen containerStyle={{backgroundColor: colors.card}} />
                </View>
              )}
            </View>
          }
          ListFooterComponent={<View style={{height: 80}} />}
        />
      )}
      {!isEmpty && (
        <TouchableOpacity
          accessibilityRole='button'
          accessibilityLabel='Ajouter'
          style={[  styles.floattingButton, {bottom: insets.bottom + 20}]}
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
          {label: 'Activation rapide', onPress: handleBrowser},
        ]}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 20,
    gap: 14,
  },
  methodCard: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  lightMethodCard: {
    shadowOpacity: 0.04,
    elevation: 1,
  },
  floattingButton: {
    position: 'absolute',
    elevation: 5,
    right: 30,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});

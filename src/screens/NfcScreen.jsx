/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, {useState, useEffect, useCallback, useRef} from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  TouchableOpacity,
  View,
  FlatList,
  Alert,
} from 'react-native';
import NfcManager, {NfcTech} from 'react-native-nfc-manager';
import {desfireRead} from '../services/nfcService';
import {useNavigation, useTheme} from '@react-navigation/native';
import {storage} from '../utils/storage';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {Swipeable, GestureHandlerRootView} from 'react-native-gesture-handler';
import NfcBottomSheet from '../components/NfcBottomSheet';
import BottomSheet, {BottomSheetView} from '@gorhom/bottom-sheet';

const getEstablishments = () => {
  var establishments = storage.getString('establishments');
  return establishments ? JSON.parse(establishments) : [];
};
const setEstablishmentsStorage = newEstablishments => {
  //storage.set('establishments', JSON.stringify(newEstablishments));
};
function NfcScreen() {
  const {colors} = useTheme();
  const isScanningRef = useRef(false);
  const bottomSheetRef = useRef(null);
  const navigation = useNavigation();
  const [establishments, setEstablishments] = useState(getEstablishments());

  useEffect(() => {
    NfcManager.start();
    return () => {
      NfcManager.close();
    };
  }, []);

  const cleanupNfc = async () => {
    if (isScanningRef.current) {
      try {
        await NfcManager.cancelTechnologyRequest();
        console.log('Session NFC nettoyée');
      } catch (error) {
        console.log('Annulation NFC ignorée:', error);
      }
      isScanningRef.current = false;
    }
  };
  const handleBottomSheetCancel = useCallback(() => {
    cleanupNfc();
  }, []);

  /**
   * Permet de lancer la lecture d'un QR code et de l'ajouter à la liste des établissements
   */
  const handleScanQrCode = useCallback(() => {
    console.log('handleScanQrCode appelé');
    navigation.navigate('QRCodeScanner', {
      onScan: qrData => {
        try {
          const parsed = JSON.parse(qrData);
          if (!parsed.url || !parsed.numeroId || !parsed.etablissement) {
            throw new Error('Données QR code invalides');
          }
          const newEstablishment = {
            url: parsed.url,
            numeroId: parsed.numeroId,
            etablissement: parsed.etablissement,
          };
          const newEstablishments = [...establishments, newEstablishment];
          setEstablishments(newEstablishments);
          //setEstablishmentsStorage(newEstablishments);
          console.log('Établissement ajouté:', newEstablishment);
        } catch (error) {
          console.error('Erreur parsing QR:', error);
          Alert.alert('Erreur', 'QR code invalide pour un établissement.');
        }
      },
    });
  }, [navigation, establishments]);
  /**
   * Permet de supprimer un établissement de la liste
   */
  const deleteEstablishment = useCallback(
    index => {
      const newEstablishments = establishments.filter((_, i) => i !== index);
      setEstablishments(newEstablishments);
      //setEstablishmentsStorage(newEstablishments);
      console.log('Établissement supprimé, index:', index);
    },
    [establishments],
  );
  /**
   * Permet de définir les actions à afficher sur la droite d'un élément de la liste
   */
  const renderRightActions = useCallback(
    index => (
      <TouchableOpacity
        style={[styles.deleteButton, {backgroundColor: 'red'}]}
        onPress={() => deleteEstablishment(index)}>
        <Icon name="delete" size={24} color="#fff" />
      </TouchableOpacity>
    ),
    [deleteEstablishment],
  );
  /**
   * Permet de définir le contenu d'un élément de la liste
   */
  const renderItem = useCallback(
    ({item, index}) => (
      <Swipeable renderRightActions={() => renderRightActions(index)}>
        <TouchableOpacity
          style={[
            styles.establishmentButton,
            {backgroundColor: colors.secondary},
          ]}
          onPress={() => scanTagForEstablishment(item.url, item.numeroId)}>
          <Text style={styles.establishmentText}>{item.etablissement}</Text>
        </TouchableOpacity>
      </Swipeable>
    ),
    [colors, scanTagForEstablishment],
  );
  /**
   * Permet de lancer la lecture d'un tag NFC et retourne le résultat
   */
  const scanTagForEstablishment = useCallback(async (url, numeroId) => {
    try {
      // Annuler toute session active avant d'en démarrer une nouvelle
      await NfcManager.cancelTechnologyRequest().catch(() => {});

      bottomSheetRef.current?.open();

      // register for the NFC tag with NDEF in it
      await NfcManager.requestTechnology(NfcTech.IsoDep);
      // the resolved tag object will contain `ndefMessage` property
      const tag = await NfcManager.getTag();
      console.warn('Tag found', tag);
      const result = await desfireRead(tag.id, url, numeroId);
      console.warn('Result', result);

      if (result.code === 'END') {
        bottomSheetRef.current?.setSuccess();
        var heure = new Date().getHours();
        Alert.alert(
          'Succès',
          `${heure >= 6 && heure < 18 ? 'Bonjour' : 'Bonsoir'} ${result.msg}`,
        );
      } else {
        bottomSheetRef.current?.setError();
        /*Alert.alert(
          'Erreur',
          "Carte invalide ou Méthode d'authentification non activée",
        );*/
      }
    } catch (ex) {
      console.error('Erreur NFC:', err instanceof Error ? err.stack : JSON.stringify(err));
      bottomSheetRef.current?.setError();
    } finally {
      await NfcManager.cancelTechnologyRequest().catch(() => {});
      // stop the nfc scanning
      NfcManager.cancelTechnologyRequest();
    }
  }, []);
  const handleSheetChanges = useCallback(index => {
    console.log('handleSheetChanges', index);
  }, []);

  return (
    <GestureHandlerRootView
      style={[styles.container, {backgroundColor: colors.background}]}>
      <TouchableOpacity style={styles.qrButton} onPress={handleScanQrCode}>
        <Icon name="qrcode-scan" size={30} color={colors.text} />
      </TouchableOpacity>
      <View style={styles.card}>
        <Text style={[styles.cardTitle, {color: colors.text}]}>
          Authentification via NFC
        </Text>
        {establishments.length > 0 ? (
          <FlatList
            data={establishments}
            renderItem={renderItem}
            keyExtractor={(item, index) => index.toString()}
            extraData={establishments}
          />
        ) : (
          <Text style={[styles.emptyText, {color: colors.text}]}>
            Authentifiez-vous en toute sécurité via votre carte NFC. Scannez le
            QR code de votre établissement et suivez les instructions.
          </Text>
        )}
      </View>
      <NfcBottomSheet ref={bottomSheetRef} />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  qrButton: {
    position: 'absolute',
    top: 15,
    right: 20,
    padding: 10,
    width: 50,
    height: 50,
    borderRadius: 50,
  },
  card: {
    borderRadius: 8,
    padding: 10,
    marginTop: 60,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  establishmentButton: {
    padding: 15,
    borderRadius: 8,
    marginVertical: 5,
  },
  establishmentText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#fff',
  },
  deleteButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 60,
    borderRadius: 8,
    marginVertical: 5,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
  wrapper: {},
});

export default React.memo(NfcScreen);

/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, {useState, useEffect, useCallback, useRef} from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  FlatList,
  Alert,
  Platform,
} from 'react-native';
import NfcManager, {NfcTech} from 'react-native-nfc-manager';
import {desfireRead, fetchEtablissement} from '../services/nfcService';
import {useNavigation, useTheme} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {Swipeable, GestureHandlerRootView} from 'react-native-gesture-handler';
import {
  openBottomSheet,
  showError,
  showSuccess,
  showWaiting,
} from '../services/nfcBottomSheetService';
import CustomActionSheet from '../components/CustomActionSheet';
import { useNfcStore } from '../stores/useNfcStore';
import { nfcSessionManager } from '../utils/nfcSessionManager';

function NfcScreen({withoutAddButton}) {
  const {colors} = useTheme();
  const platform = Platform.OS;
  const isScanningRef = useRef(false);
  const navigation = useNavigation();
  const establishments = useNfcStore(state => state.establishments);
  const addEstablishment = useNfcStore(state => state.addEstablishment);
  const removeEstablishment = useNfcStore(state => state.removeEstablishment);
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);

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
   * Permet de lancer la lecture d'un tag NFC et retourne le résultat
   */
  const scanTagForEstablishment = useCallback(async (url, numeroId) => {
    try {
     if(platform === "android") openBottomSheet();

      const started = await nfcSessionManager.startSession();
      if (!started) return;

      const tag = await nfcSessionManager.getTag();
      console.warn('Tag found', tag);

      showWaiting();
      const result = await desfireRead(tag.id, url, numeroId);
      console.warn('Result', result);

      if (result.code === 'END') {
        var heure = new Date().getHours();
        var msg = `${heure >= 6 && heure < 18 ? 'Bonjour' : 'Bonsoir'} ${
          result.msg
        }`;
        showSuccess(msg);
      } else {
        showError();
      }
    } catch (err) {
      if (err?.name === 'UserCancel') {
        console.warn('🚫 NFC annulé par l’utilisateur');
      } else {
        console.error('❌ Erreur NFC:', err.stack || err.message);
        showError();
      }
    } finally {
      await nfcSessionManager.cancelSession();
    }
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
          // Vérifier si l'URL existe déjà
          const exists = establishments.some(
            est => est.url === newEstablishment.url,
          );
          if (exists) {
            Alert.alert('Erreur', 'Cet établissement est déjà ajouté.');
            return;
          }
          addEstablishment(newEstablishment);
          scanTagForEstablishment(
            newEstablishment.url,
            newEstablishment.numeroId,
          );
          console.log('Établissement ajouté:', newEstablishment);
        } catch (error) {
          console.error('Erreur parsing QR:', error);
          Alert.alert('Erreur', 'QR code invalide pour un établissement.');
        }
      },
    });
  }, [navigation, establishments]);
  /**
   * Permet de lancer la saisie manuelle d'un établissement
   */
  const handleManualInput = () => {
    navigation.navigate('ManualNfc', {
      onPress: async (url) => {
        try {
          const nfcInfos = await fetchEtablissement(url+'/esupnfc/infos');
        if (!nfcInfos){
          Alert.alert('Erreur', 'Authentification NFC non disponible pour ce serveur.');
          return;
        };
        const newEstablishment = {
          url: nfcInfos.url,
          numeroId: nfcInfos.numeroId,
          etablissement: nfcInfos.etablissement,
        };
        const exists = establishments.some((est) => est.url === newEstablishment.url);
        if (exists) {
          Alert.alert('Erreur', 'Cet établissement est déjà ajouté.');
          return;
        }
        addEstablishment(newEstablishment);
        scanTagForEstablishment(newEstablishment.url, newEstablishment.numeroId);
        console.log('Établissement ajouté:', newEstablishment);
        } catch (error) {
          console.error('[ManualNfc] Erreur:', error.message);
        }
      }
    });
  };
  /**
   * Permet de supprimer un établissement de la liste
   */
  const deleteEstablishment = url => {
    removeEstablishment(url);
    console.log('Établissement supprimé, url:', url);
  };
  /**
   * Permet de définir les actions à afficher sur la droite d'un élément de la liste
   */
  const renderRightActions = url => (
    <TouchableOpacity
      style={[styles.deleteButton, {backgroundColor: 'red'}]}
      onPress={() => deleteEstablishment(url)}>
      <Icon name="delete" size={24} color="#fff" />
    </TouchableOpacity>
  );
  /**
   * Permet de définir le contenu d'un élément de la liste
   */
  const renderItem = useCallback(
    ({item}) => (
      <Swipeable renderRightActions={() => renderRightActions(item.url)}>
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
    [colors, establishments],
  );

  const handleSheetChanges = useCallback(index => {
    console.log('handleSheetChanges', index);
  }, []);

  return (
    <View
      style={[styles.container, {backgroundColor: colors.background}]}>
      {!withoutAddButton && (
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setIsActionSheetOpen(true)}>
            <Icon name="plus-circle" color={colors.primary} size={50} />
          </TouchableOpacity>
          <Text style={[styles.cardTitle, {color: colors.text}]}>NFC</Text>
        </View>
      )}
      <View style={styles.card}>
        {establishments.length > 0 ? (
          <FlatList
            data={establishments}
            renderItem={renderItem}
            keyExtractor={item => item.url}
            extraData={establishments}
          />
        ) : (
          <Text style={[styles.emptyText, {color: colors.text}]}>
            Authentifiez-vous en toute sécurité via votre carte NFC. Scannez le
            QR code de votre établissement et suivez les instructions.
          </Text>
        )}
      </View>
      <CustomActionSheet
        visible={isActionSheetOpen}
        onClose={() => setIsActionSheetOpen(false)}
        actions={[
          {label: 'Scanner QR code', onPress: handleScanQrCode},
          {label: 'Saisie manuelle', onPress: handleManualInput},
        ]}
      />
    </View>
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
    left: 20,
    padding: 10,
    width: 50,
    height: 50,
    borderRadius: 50,
  },
  card: {
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  wrapper: {},
});

export default React.memo(NfcScreen);

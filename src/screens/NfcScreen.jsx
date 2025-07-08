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
import NfcManager from 'react-native-nfc-manager';
import {fetchEtablissement, scanTagForEstablishment} from '../services/nfcService';
import {useNavigation, useTheme} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {Swipeable} from 'react-native-gesture-handler';
import { useNfcStore } from '../stores/useNfcStore';

function NfcScreen({withoutAddButton}) {
  const {colors} = useTheme();
  const isScanningRef = useRef(false);
  const navigation = useNavigation();
  const establishments = useNfcStore(state => state.establishments);
  const addEstablishment = useNfcStore(state => state.addEstablishment);
  const removeEstablishment = useNfcStore(state => state.removeEstablishment);

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
    navigation.navigate('QRCodeScanner');
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
          <Icon name="cellphone-nfc" color={colors.text} size={30} />
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
          <Text style={[styles.emptyText, {color: colors.text, marginTop: 15}]}>
            Authentifiez-vous en toute sécurité via votre carte NFC. Scannez le
            QR code de votre établissement et suivez les instructions.
          </Text>
        )}
      </View>
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  wrapper: {},
});

export default React.memo(NfcScreen);

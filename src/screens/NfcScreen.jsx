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
import {
  scanTagForEstablishment,
} from '../services/nfcService';
import {useTheme} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {Swipeable} from 'react-native-gesture-handler';
import {useNfcStore} from '../stores/useNfcStore';
import { getHelpByKey } from '../data/helpData';
import { useAppLifecycle } from '../hooks/useAppLifecycle';
import { canNfcStart, checkNfc, howToEnable } from '../utils/nfcUtils';

function NfcScreen({withoutAddButton}) {
  const {colors} = useTheme();
  const isScanningRef = useRef(false);
  const [isNfcSupported, setIsNfcSupported] = useState(null); // null = en cours de vérification
  const {isAppResumed, resetIsAppResumed} = useAppLifecycle();
  const setIsNfcEnabled = useNfcStore(state => state.setIsNfcEnabled);
  const isNfcEnabled = useNfcStore(state => state.isNfcEnabled);
  const establishments = useNfcStore(state => state.establishments);
  const removeEstablishment = useNfcStore(state => state.removeEstablishment);

  useEffect(() => {
    checkNfc().then(({ isSupported, isEnabled }) => {
      setIsNfcEnabled(isEnabled);
      setIsNfcSupported(isSupported);
    });
    console.log('[NFC] isNfcEnabled:', isNfcEnabled);
    console.log('[NFC] isNfcSupported:', isNfcSupported);
    console.log('[NFC] isAppResumed:', isAppResumed);
    resetIsAppResumed(); // On réinitialise l'état après l'avoir utilisé
  }, [isAppResumed]);

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
          onPress={async () => {
            const canStart = await canNfcStart();
            //if (!canStart) return;
            scanTagForEstablishment(item.url, item.numeroId, canStart);
          }}>
          <Text style={styles.establishmentText}>{item.etablissement}</Text>
        </TouchableOpacity>
      </Swipeable>
    ),
    [colors, establishments],
  );

  // En cours de vérification
  if (isNfcSupported === null) {
    return (
      <View style={styles.container}>
        <Text style={[styles.text, { color: colors.text }]}>Vérification du support NFC...</Text>
      </View>
    );
  }

  // NFC non supporté
  if (!isNfcSupported) {
    return (
      <View style={styles.container}>
        <Text style={[styles.text, { color: colors.text }]}>
          NFC non supporté sur cet appareil.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      {!withoutAddButton && (
        <TouchableOpacity style={styles.header} onPress={howToEnable}>
          <Icon name="cellphone-nfc" color={colors.text} size={30} />
          <Text style={[styles.cardTitle, {color: colors.text}]}>NFC</Text>
        </TouchableOpacity>
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

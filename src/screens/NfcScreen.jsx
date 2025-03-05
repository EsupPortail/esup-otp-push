/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
import {useEffect} from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  TouchableOpacity,
  View,
} from 'react-native';
import NfcManager, {NfcTech} from 'react-native-nfc-manager';
import {desfireRead} from '../services/nfcService';
import MigrateStorage from '../components/MigrateStorage';
import { useTheme } from '@react-navigation/native';

function NfcScreen() {
  const {colors} = useTheme();
  useEffect(() => {
    NfcManager.start();
    return () => {
      NfcManager.stop();
    };
  }, []);

  async function readNdef() {
    // Annuler toute session active avant d'en démarrer une nouvelle
    await NfcManager.cancelTechnologyRequest().catch(() => {});

    try {
      // register for the NFC tag with NDEF in it
      await NfcManager.requestTechnology(NfcTech.IsoDep);
      // the resolved tag object will contain `ndefMessage` property
      const tag = await NfcManager.getTag();
      console.warn('Tag found', tag);
      const result = await desfireRead(tag.id);
      console.warn('Result', result);

      if (result.code === 'END') {
        Alert.alert(
          'Succès',
          `${heure >= 6 && heure < 18 ? 'Bonjour' : 'Bonsoir'} ${response.msg}`,
        );
      } else {
        Alert.alert(
          'Erreur',
          "Carte invalide ou Méthode d'authentification non activée",
        );
      }
    } catch (ex) {
      console.warn('Oops!', ex);
    } finally {
      // stop the nfc scanning
      NfcManager.cancelTechnologyRequest();
    }
  }

  return (
    <View style={styles.container}>
      <View>
        <Text style={{color: colors.text}}>Hello World</Text>
      </View>
      <View style={styles.wrapper}>
        <TouchableOpacity onPress={readNdef}>
          <Text style={{color: colors.text}}>Scan a Tag</Text>
        </TouchableOpacity>
      </View>
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
  wrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default NfcScreen;

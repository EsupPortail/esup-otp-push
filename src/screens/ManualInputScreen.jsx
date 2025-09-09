import {Platform, StyleSheet, Text, View, ScrollView} from 'react-native';
import React from 'react';
import RadioButton from '../components/RadioButton';
import ManualNfcScreen from './ManualNfcScreen';
import ManualPushScreen from './ManualPushScreen';
import ManualTotpScreen from './ManualTotpScreen';
import {useNfcStore} from '../stores/useNfcStore';
import { fetchEtablissement, scanTagForEstablishment } from '../services/nfcService';
import { storage } from '../utils/storage';
import { showToast, sync } from '../services/auth';
import { getManufacturer, getModel } from 'react-native-device-info';
import { useTotpStore } from '../stores/useTotpStore';

const ManualInputScreen = () => {
  const [selectedOption, setSelectedOption] = React.useState('nfc');
  const establishments = useNfcStore(state => state.establishments);
  const addEstablishment = useNfcStore(state => state.addEstablishment);
  const setTotpObjects = useTotpStore(state => state.setTotpObjects);

  const handleNfcSubmit = async url => {
    try {
      const nfcInfos = await fetchEtablissement(url + '/esupnfc/infos');
      if (!nfcInfos) {
        Alert.alert(
          'Erreur',
          'Authentification NFC non disponible pour ce serveur.',
        );
        return;
      }
      const newEstablishment = {
        url: nfcInfos.url,
        numeroId: nfcInfos.numeroId,
        etablissement: nfcInfos.etablissement,
      };
      const exists = establishments.some(
        est => est.url === newEstablishment.url,
      );
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
  };
  const handlePushSubmit = async ({uid, code, host}) => {
    const manufacturer = await getManufacturer();
            const model = getModel();
            const gcmId = storage.getString('gcm_id') || '';
            const platform = Platform.OS;
            const result = await sync(host, uid, code, gcmId, platform, manufacturer, model);
    
            if (result.success) {
              console.log('📱 Sync réussi ✅', result.data);
              showToast('Synchronisation effectuée');
              //refreshScreen();
            }
  };
  const handleTotpSubmit = newTotpObjects => {
    setTotpObjects(newTotpObjects);
    console.log('[ManualInputScreen] totpObjects mis à jour:', newTotpObjects);
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.inputContainer}>
        <RadioButton
          options={[
            {label: 'TOTP', value: 'totp'},
            {label: 'PUSH', value: 'push'},
            {label: 'NFC', value: 'nfc'},
          ]}
          checked={selectedOption}
          onChange={option => setSelectedOption(option)}
        />
      </View>
      {selectedOption === 'push' && (
        <ManualPushScreen onPressFn={{onPress: handlePushSubmit}} />
      )}
      {selectedOption === 'totp' && (
        <ManualTotpScreen onPressFn={{onPress: handleTotpSubmit}} />
      )}
      {selectedOption === 'nfc' && (
        <ManualNfcScreen onPressFn={{onPress: handleNfcSubmit}} />
      )}
    </ScrollView>
  );
};

export default ManualInputScreen;

const styles = StyleSheet.create({
  inputContainer: {
    width: '100%',
  },
  container: {
    padding: 20,
  },
});

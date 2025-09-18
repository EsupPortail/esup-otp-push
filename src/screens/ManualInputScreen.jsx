import {Platform, StyleSheet, Text, View, ScrollView} from 'react-native';
import React, { useEffect, useState } from 'react';
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
import { Toast } from 'toastify-react-native';
import { canNfcStart, checkNfc } from '../utils/nfcUtils';

const ManualInputScreen = () => {
  const [selectedOption, setSelectedOption] = React.useState('nfc');
  const establishments = useNfcStore(state => state.establishments);
  const addEstablishment = useNfcStore(state => state.addEstablishment);
  const setTotpObjects = useTotpStore(state => state.setTotpObjects);
  const [isNfcSupported, setIsNfcSupported] = useState(null);

  useEffect(() => {
    checkNfc().then(({ isSupported, isEnabled }) => {
      setIsNfcSupported(isSupported);
      if (!isSupported) {
        setSelectedOption('totp');
      }
    });
  }, []);

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
      const canstart = await canNfcStart();
      scanTagForEstablishment(newEstablishment.url, newEstablishment.numeroId, canstart);
      console.log('Établissement ajouté:', newEstablishment);
      return {success: true};
    } catch (error) {
      console.error('[ManualNfc] Erreur:', error.message);
      return {success: false, error: error.message};
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
              Toast.success('Synchronisation effectuée')
              return {success: true};
              //refreshScreen();
            }
            return {success: false};
  };
  const handleTotpSubmit = async newTotpObjects => {
    setTotpObjects(newTotpObjects);
    console.log('[ManualInputScreen] totpObjects mis à jour:', newTotpObjects);
  }

  const options = [
    {label: 'TOTP', value: 'totp'},
    {label: 'PUSH', value: 'push'},
  ];
  if (isNfcSupported) {
    options.push({label: 'NFC', value: 'nfc'});
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.inputContainer}>
        <RadioButton
          options={options}
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
      {selectedOption === 'nfc' && isNfcSupported && (
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

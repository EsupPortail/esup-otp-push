import { Alert } from 'react-native';
import NfcManager from 'react-native-nfc-manager';
import { getHelpByKey } from '../data/helpData';

/**
 * Activer le NFC en ouvrant les paramètres système
 */
export const enableNfc = async () => {
    try {
      await NfcManager.goToNfcSetting().then(result => {
        console.log('[NFC setting result:]', result);
      });
      // Vérifier à nouveau si NFC est activé après retour des paramètres
      const enabled = await NfcManager.isEnabled();
      console.log('[NFC enabled after setting:]', enabled);
      //setIsNfcEnabled(enabled);
      //if (enabled) NfcManager.start();
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d’ouvrir les paramètres NFC.');
    }
};

/**
* Vérifier que le NFC est activé ou supporté et afficher un message d'alerte
*/
export const checkNfc = async () => {
    try {
      const isSupported = await NfcManager.isSupported();
      if (!isSupported) {
        Alert.alert(
          'NFC - Informations',
          'Pour utiliser la méthode NFC, votre appareil doit supporter la fonctionnalité NFC.',
        );
      }

      const isEnabled = await NfcManager.isEnabled();

      return { isEnabled, isSupported };
    } catch (error) {
      console.error('Erreur lors de la vérification du NFC:', error);
    }
};
/**
 * Vérifier que le NFC est activable et afficher un message d'alerte si besoin
 */
export const canNfcStart = async () => {
    console.log('[canNfcStart] Vérification avant démarrage NFC');
    const {isSupported, isEnabled} = await checkNfc();
    try {
      if (!isEnabled && isSupported) {
        Alert.alert(
          'Activer NFC',
          'Pour utiliser la méthode NFC, vous devez activer la fonctionnalité NFC dans les paramètres de votre appareil.',
          [
            {
              text: 'Ouvrir les paramètres',
              onPress: enableNfc,
            },
            {
              text: 'Plus tard',
            }
          ]
        );
        return;
      }

      if (isEnabled) {
        NfcManager.start();
      }

      return isEnabled && isSupported;
    } catch (error) {
      console.error('[NFC] Erreur lors de la vérification:', error);
      return false;
    }
};

export const howToEnable = async () => {
    const data = getHelpByKey('nfc');
    const {isEnabled} = await checkNfc();
    if (!isEnabled) {
      Alert.alert(
        'Activer NFC',
        'Pour utiliser cette méthode, activez la fonctionnalité NFC dans les paramètres de votre appareil.',
        [
          {
            text: 'Ouvrir les paramètres',
            onPress: enableNfc,
          },
          {
            text: 'Plus tard',
          }
        ]
      );
      return;
    }
    Alert.alert(data.title, data.content);
};
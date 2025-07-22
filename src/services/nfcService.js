import axios from 'axios';
import {Alert, Platform} from 'react-native';
import NfcManager, {NfcTech, Ndef} from 'react-native-nfc-manager';
import { nfcSessionManager } from '../utils/nfcSessionManager';
import { showToast } from './auth';
import { showError, openBottomSheet, showWaiting, showSuccess, showDisabled } from './nfcBottomSheetService';
import { useNfcStore } from '../stores/useNfcStore';

// Fonction pour envoyer une commande APDU au tag NFC
async function sendApduCommandToTag(tag, command) {
  try {
    console.log('Connected to tag:', tag.id);
    console.log('Sending command:', command);

    let commandBytes = command.match(/.{1,2}/g).map(byte => parseInt(byte, 16));
    console.log('Command bytes:', commandBytes);

    // Envoyer la commande APDU sous forme de tableau en notation hexadécimale
    const response =
      Platform.OS === 'ios'
        ? await NfcManager.sendCommandAPDUIOS(commandBytes)
        : await NfcManager.transceive(commandBytes);
    console.log('Response from card:', response);
    // Convertir la réponse en chaîne hexadécimale
    if (response) {
      if (Platform.OS === 'ios') {
        // Convertir SW1 et SW2 en hexadécimal
        let sw1Hex = response.sw1.toString(16).padStart(2, '0');
        let sw2Hex = response.sw2.toString(16).padStart(2, '0');
        if (
          response.sw1 === 0x91 &&
          response.sw2 === 0x00 &&
          response.response.length === 0
        ) {
          // Convertir SW1 et SW2 en une chaîne hexadécimale
          let result = sw1Hex + sw2Hex;
          console.log('Received response from card:', result);
          return result;
        }
        // Conversion de la réponse en hexadécimal
        let responseHex = byteArrayToHexString(
          new Uint8Array(response.response),
        );
        let finalResult = responseHex + sw1Hex + sw2Hex;
        console.log('Received response from card before return:', finalResult);
        return finalResult;
      } else {
        let responseHex = byteArrayToHexString(new Uint8Array(response));
        console.log('ANDROID:Received response from card:', responseHex);
        return responseHex;
      }
    }
  } catch (error) {
    console.error('Error sending APDU command:', error);
    throw error;
  }
}

// Fonction principale pour lire une carte Desfire
export async function desfireRead(cardId, etablissementUrl, numeroId) {
  let result = '';
  let nfcResult = {code: 'ERROR'};

  try {
    console.log('Starting communication with Desfire tag');

    let tag = await NfcManager.getTag();

    while (true) {
      let response = await desfireHttpRequestAsync(
        `result=${result}`,
        `cardId=${cardId}`,
        etablissementUrl,
        numeroId,
      );
      nfcResult = JSON.parse(response);

      if (nfcResult.code === 'CONTINUE') {
        console.warn('Desfire error, but server requests to continue...');
        result = '';
      } else if (nfcResult.code === 'END' || nfcResult.code === 'ERROR') {
        break;
      } else {
        let command = nfcResult.fullApdu;
        console.log('Sending APDU command:', command);

        let byteResult = await sendApduCommandToTag(tag, command);
        console.log('Result from card AFTER sending APDU:', byteResult);
        result = byteResult;

        nfcResult.fullApdu = result;
      }
    }

    console.log('Process complete. Result:', nfcResult);
    return nfcResult;
  } catch (error) {
    console.error('Error during Desfire read process:', error);
    throw error;
  } finally {
    NfcManager.cancelTechnologyRequest();
  }
}

// Fonction pour faire une requête HTTP
async function desfireHttpRequestAsync(
  param1,
  param2,
  etablissementUrl,
  numeroId,
) {
  try {
    const url = `${etablissementUrl}/desfire-ws?${param1}&${param2}&numeroId=${numeroId}`;
    console.log('Requesting URL:', url);

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    return await response.text();
  } catch (error) {
    console.error('Error during HTTP request:', error);
    throw error;
  }
}

// Utilitaires de conversion
function hexStringToByteArray(hexString) {
  if (!hexString) return new Uint8Array();
  let byteArray = new Uint8Array(hexString.length / 2);
  for (let i = 0; i < hexString.length; i += 2) {
    byteArray[i / 2] = parseInt(hexString.substr(i, 2), 16);
  }
  return byteArray;
}

function byteArrayToHexString(byteArray) {
  return Array.from(byteArray, byte =>
    ('0' + (byte & 0xff).toString(16)).slice(-2),
  ).join('');
}

// Utilitaire pour obtenir les infos de l'établissement
export async function fetchEtablissement(url) {
  try {
    console.log('[Requesting URL]--- :', url);

    const response = await axios.post(url, {
      headers: {'Content-Type': 'application/json'},
      timeout: 10000,
    });
    console.log('[NFCSERVICE fetchEtablissement] Réponse:', response.data);

    if (response.data.code !== 'Ok') {
      console.error(`Réponse invalide: ${response.data.message || 'Code non Ok'}`);
      // Authentification NFC non disponible pour ce serveur
      return null;
    }

    const {server_infos} = response.data;
    if (
      !server_infos?.numeroId ||
      !server_infos?.etablissement ||
      !server_infos?.url
    ) {
      throw new Error('Données server_infos incomplètes');
    }

    return {
      numeroId: server_infos.numeroId,
      etablissement: server_infos.etablissement,
      url: server_infos.url,
    };
  } catch (error) {
    console.error(
      "Erreur lors de la récupération de l'établissement:",
      error.message,
    );
    throw error;
  }
}

export const scanTagForEstablishment = async (url, numeroId) => {
  try {
    const { isNfcEnabled } = useNfcStore.getState();
    console.log('[scanTagForEstablishment] état NFC:', isNfcEnabled);
    console.log('[scanTagForEstablishment] Début lecture NFC pour:', { url, numeroId });
    
    // Ouvrir le BottomSheet sur Android
    if (Platform.OS === 'android') {
      openBottomSheet();
    }

    // Afficher un message d'erreur si NFC n'est pas activé
    if (!isNfcEnabled) {
      showDisabled();
      return;
    }

    // Démarrer la session NFC
    const started = await nfcSessionManager.startSession();
    if (!started) {
      console.warn('[scanTagForEstablishment] Échec démarrage session NFC');
      showError();
      return;
    }

    // Obtenir le tag NFC
    const tag = await nfcSessionManager.getTag();
    console.warn('[scanTagForEstablishment] Tag trouvé:', tag);

    // Afficher l'état d'attente
    showWaiting();

    // Lire la carte NFC
    const result = await desfireRead(tag.id, url, numeroId);
    console.warn('[scanTagForEstablishment] Résultat lecture:', result);

    if (result.code === 'END') {
      const heure = new Date().getHours();
      const msg = `${heure >= 6 && heure < 18 ? 'Bonjour' : 'Bonsoir'} ${result.msg}`;
      showSuccess(msg);
    } else {
      showError();
    }
  } catch (err) {
    if (err?.name === 'UserCancel') {
      console.warn('[scanTagForEstablishment] NFC annulé par l’utilisateur');
    } 
    
    if (err.message.includes('Network request failed')) {
      showToast('NFC - Connexion réseau indispoible.');
    } else {
      showToast(err.message || 'Échec de la lecture de la balise NFC.');
      console.error('[scanTagForEstablishment] Erreur NFC:', err.stack || err.message);
    }
    showError();

  } finally {
    await nfcSessionManager.cancelSession();
  }
};

import axios from 'axios';
import { browserManager, useBrowserStore } from '../stores/useBrowserStore';
import { act, use } from 'react';
import { storage } from '../utils/storage';
import { getManufacturer, getModel } from 'react-native-device-info';
import { Platform } from 'react-native';
import { sync } from './auth';
import Totp from '../utils/totp';
import { useTotpStore } from '../stores/useTotpStore';
import { Toast } from 'toastify-react-native';
import { fetchEtablissement } from './nfcService';
import { useNfcStore } from '../stores/useNfcStore';
import httpClient from './httpClient';

// Récupère l'URL de base du gestionnaire depuis le store en enlevant login si présent
const getBaseUrl = () => useBrowserStore.getState().url.replace(/\/login\/?$/, '');

/**
 * Récupère le nom de domaine du BASE_URL
 */
export function getDomainFromBaseUrl() {
  return getBaseUrl().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
}

export async function fetchUserInfo() {
  try {
    const response = await httpClient.get(`${getBaseUrl()}/api/user`);

    console.log('✅ Données utilisateur reçues:', response.data);
    const oldUser = browserManager.getUser();
    browserManager.setUser({...oldUser, methods: response.data.user});
    return response.data;
  } catch (error) {
    console.error('❌ Erreur récupération user info:', error.message);
  }
}

/**
 * Obtenir api_url, uid, name, nfcurl si existant
 */
export async function fetchUserCredentials() {
  let nfcUrl = '';
  try {
    const response = await httpClient.get(`${getBaseUrl()}/manager/infos`);
    console.log('✅ User credentials reçus:', response.data);

    const nfcInfos = await fetchEtablissement(response.data.api_url + '/esupnfc/infos');
    if (nfcInfos) {
      nfcUrl = nfcInfos.url;
    }
    const oldUser = browserManager.getUser();
    browserManager.setUser({...oldUser, api_url: response.data.api_url, uid: response.data.uid, name: response.data.name, nfcUrl: nfcUrl});
    return response.data;
  } catch (error) {
    console.error('❌ Erreur récupération user credentials:', error.message);
  }
}

/**
 * Obtenir {activationCode} pour push activation
 */
export async function fetchPushActivationData() {
  try {
    const response = await httpClient.put(`${getBaseUrl()}/api/push/activate`);

    console.log('✅ [fetchPushActivationData] Activation data reçues:', response.data);
    const oldUser = browserManager.getUser();
    browserManager.setUser({...oldUser, activationCode: response.data.activationCode});
    return response.data;
  } catch (error) {
    console.error('❌ Erreur récupération push activation data:', error.message);
  }
}

export async function deactivatePush() {
  try {
    const response = await httpClient.put(`${getBaseUrl()}/api/push/deactivate`);
    
    console.log('✅ [deactivatePush] Activation data reçues:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Erreur désactivation push:', error.message);
  }
}

export async function deactivateTotp(){
  try {
    const response = await httpClient.put(`${getBaseUrl()}/api/totp/deactivate`);
    console.log('✅ [deactivateTotp] Activation data reçues:', response.data);
    return response.data; //{code: 'Ok'}
  } catch (error) {
    console.error('❌ Erreur désactivation totp:', error.message);
  }
}

//POST https://esup-otp-manager-test.univ-paris1.fr/api/totp/activate/confirm/274441 -> {code: 'Ok'}
//POST https://esup-otp-manager-test.univ-paris1.fr/api/generate/totp?require_method_validation=true -> {code: "Ok", message: "HIYAVDDQTOMHOYH5Z4J5PPGC6Q7MDBYW",…} message est le secret partagé

/**
 * Récupère toutes les informations de l'utilisateur
 */
export async function fetchAllUserInfo() {
  await fetchUserInfo();
  await fetchUserCredentials();
  //await fetchPushActivationData();
}

/**
 * Synchroniser la méthode PUSH
 */
export async function syncPush(){
  const gcmId = storage.getString('gcm_id') || '';
  const manufacturer = await getManufacturer();
  const model = getModel();
  const platform = Platform.OS;
  // api_url, uid
  const { api_url, uid } = browserManager.getUser();
  //activationCode
  const isdeactivated = await deactivatePush();
  if(isdeactivated?.code === 'Ok'){
    console.log('🔔 Push désactivé avec succès avant resync');
    const { activationCode } = await fetchPushActivationData();

    const result = await sync(api_url, uid, activationCode, gcmId, platform, manufacturer, model);
    console.log('[syncPush] result:', result);

    if(result?.success){
      console.log('🔔 Push resynchronisé avec succès');
      Toast.show({
        type: 'success',
        text1: 'Authentification mobile activée',
        position: 'top',
        visibilityTime: 6000,
      });
      await fetchUserInfo();
      
    }
    return result;
  }
  return null;
}

const deleteTotp = async () => {
  ///api/delete_method_secret/totp retourne le secret {"deleted_secret": xxx}
  try {
    const response = await httpClient.delete(`${getBaseUrl()}/api/delete_method_secret/totp`);

    console.log('✅ [deleteTotp] Activation data reçues:', response.data);
    return response.data.deleted_secret;
  } catch (error) {
    console.error('❌ Erreur lors de la désactivation:', error.message);
  }
}

const generateAndConfirmTotp = async () => {
  try {
        const generateResponse = await httpClient.post(`${getBaseUrl()}/api/generate/totp?require_method_validation=true`);

      console.log('✅ [generateAndConfirmTotp] Activation data reçues:', generateResponse);

      if (generateResponse.data.code === 'Ok') {
        const {secret, name} = Totp.parseTotpUrl(generateResponse.data.uri);
        const token = Totp.token(secret);
        console.log('✅ [generateAndConfirmTotp] TOTP généré:', token);
        const confirmResponse = await httpClient.post(`${getBaseUrl()}/api/totp/activate/confirm/${token}`);
        console.log('✅ [generateAndConfirmTotp] Activation data reçues:', confirmResponse.data);
        if (confirmResponse.data.code === 'Ok') {
          return {success: true, data: {secret: generateResponse.data.message, token: token, name: name}};
        }
      }
    } catch (error) {
      console.error('❌ Erreur lors de la validation:', error.message);
    }
}
/**
 * Synchroniser la méthode TOTP
 */
export const syncTotp = async () => {
  const totpToDelete = await deleteTotp();
  useTotpStore.getState().removeTotp(totpToDelete);

  const {success, data} = await generateAndConfirmTotp();
  if (success) {
    useTotpStore.getState().updateTotp(data.secret, data.name);
    Toast.show({
      type: 'success',
      text1: 'TOTP synchronisé',
      position: 'top',
      visibilityTime: 6000,
    })
    await fetchUserInfo();
  } else {
    Toast.show({
      type: 'error',
      text1: 'Erreur',
      text2: "Impossible de synchroniser le TOTP",
      position: 'top',
    });
  }
  console.log('[syncTotp] data:', data);
}

/**
 * Permet de vérifier si un établissement est déjà ajouté dans le store
 * @param {*} url 
 * @returns 
 */
export const isNfcExists = () => {
  const establishments = useNfcStore.getState().establishments;
  const url = browserManager.getUser()?.nfcUrl;
  return establishments.some(item => item.url === url);
};

/**
 * Synchroniser la méthode NFC
 */
export const syncNfc = async () => {
  const url = browserManager.getUser()?.api_url;
  console.log('[syncNfc] url:', url);
  const nfcInfos = await fetchEtablissement(url + '/esupnfc/infos');

  if (!nfcInfos) {
    Toast.show({
      type: 'error',
      text1: 'Authentification NFC non disponible pour ce serveur.',
      position: 'bottom',
      visibilityTime: 6000,
    })
    return;
  }
  console.log('[syncNfc] nfcInfos:', nfcInfos);
  const exists = isNfcExists();

  if (exists) {
    Toast.show({
      type: 'info',
      text1: 'Cet établissement est déjà configuré.',
      position: 'top',
      visibilityTime: 6000,
    })
    return;
  }

  const newEstablishment = {
    url: nfcInfos.url,
    numeroId: nfcInfos.numeroId,
    etablissement: nfcInfos.etablissement,
  };
  useNfcStore.getState().addEstablishment(newEstablishment);
  console.log('[syncNfc] Établissement ajouté:', newEstablishment);
  await fetchUserInfo();
  Toast.show({
    type: 'success',
    text1: 'Activation NFC effectuée',
    position: 'top',
    visibilityTime: 6000,
  });
}

export const syncHandlers = {
  push: syncPush,
  totp: syncTotp,
  esupnfc: syncNfc,
  // d'autres méthodes de synchronisation peuvent être ajoutées ici
}


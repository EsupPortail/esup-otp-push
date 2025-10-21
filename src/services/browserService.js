import axios from 'axios';
import { browserManager } from '../stores/useBrowserStore';
import { act } from 'react';

const BASE_URL = 'https://esup-otp-manager-test.univ-paris1.fr';
// voici a quoi ressemble l'objet dans le store qui va stocker les infos utilisateur :  {api_url, uid, name, activationCode}

export async function fetchUserInfo() {
  try {
    const response = await axios.get(`${BASE_URL}/api/user`, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      withCredentials: true, // parfois utile sur iOS
    });

    console.log('✅ Données utilisateur reçues:', response.data);
    const oldUser = browserManager.getUser();
    browserManager.setUser({...oldUser, methods: response.data.user});
    return response.data;
  } catch (error) {
    console.error('❌ Erreur récupération user info:', error.message);
  }
}

/**
 * Obtenir api_url, uid, name
 */
export async function fetchUserCredentials() {
  try {
    const response = await axios.get(`${BASE_URL}/manager/infos`, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      withCredentials: true,
    });

    console.log('✅ User credentials reçus:', response.data);
    const oldUser = browserManager.getUser();
    browserManager.setUser({...oldUser, api_url: response.data.api_url, uid: response.data.uid, name: response.data.name});
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
    const response = await axios.put(`${BASE_URL}/api/push/activate`, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      withCredentials: true,
    });

    console.log('✅ [fetchPushActivationData] Activation data reçues:', response.data);
    const oldUser = browserManager.getUser();
    browserManager.setUser({...oldUser, activationCode: response.data.activationCode});
    return response.data;
  } catch (error) {
    console.error('❌ Erreur récupération push activation data:', error.message);
  }
}

/**
 * Récupère toutes les informations de l'utilisateur
 */
export async function fetchAllUserInfo() {
  await fetchUserInfo();
  await fetchUserCredentials();
  //await fetchPushActivationData();
}


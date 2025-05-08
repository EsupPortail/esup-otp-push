import axios from 'axios';
import { storage } from '../utils/storage';
import { Platform, ToastAndroid, Alert } from 'react-native';

const showToast = (message) => {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.LONG);
  } else {
    Alert.alert('Info', message);
  }
};

export const notification = (data, otpServersObjects, setOtpServersObjects, setNotified, setAdditionalData) => {
  try {
    if (!data.url || !data.uid) {
      showToast('Données de notification incomplètes (url ou uid manquant)');
      return;
    }

    const cleanedUrl = data.url.endsWith('/') ? data.url : `${data.url}/`;
    const otpServerKey = `${cleanedUrl}${data.uid}`;
    console.log('otpServerKey généré:', otpServerKey);

    let updatedOtpServers = { ...otpServersObjects };

    const gcmId = storage.getString('gcm_id') || '';
    if (!updatedOtpServers[otpServerKey] && data.trustGcm_id === 'true') {
      updatedOtpServers[otpServerKey] = {
        host: cleanedUrl,
        hostToken: data.hostToken || '',
        uid: data.uid,
        tokenSecret: gcmId,
        hostName: data.hostName || 'Serveur inconnu',
      };
      console.log('Nouveau serveur initialisé avec tokenSecret = gcm_id:', gcmId);
    }

    if (updatedOtpServers[otpServerKey] && !updatedOtpServers[otpServerKey].hostToken && data.hostToken) {
      updatedOtpServers[otpServerKey].hostToken = data.hostToken;
    }

    if (
      updatedOtpServers[otpServerKey] &&
      updatedOtpServers[otpServerKey].hostName !== data.hostName &&
      updatedOtpServers[otpServerKey].hostToken === data.hostToken
    ) {
      updatedOtpServers[otpServerKey].hostName = data.hostName;
    }

    setOtpServersObjects(updatedOtpServers);
    storage.set('otpServers', JSON.stringify(updatedOtpServers));
    console.log('otpServers mis à jour:', updatedOtpServers);

    if (
      data.action === 'auth' &&
      updatedOtpServers[otpServerKey]?.host &&
      (!data.hostToken || data.hostToken === updatedOtpServers[otpServerKey].hostToken)
    ) {
      setAdditionalData({
        ...data,
        url: cleanedUrl,
        otpServer: otpServerKey,
        text: data.text
          ? data.text.replace('compte', `compte ${updatedOtpServers[otpServerKey].hostName || 'inconnu'} `)
          : 'Veuillez valider votre connexion.',
      });
      setNotified(true);
    } else if (
      data.action === 'desync' &&
      updatedOtpServers[otpServerKey]?.hostToken === data.hostToken
    ) {
      desync(otpServerKey, updatedOtpServers, setOtpServersObjects);
    }
  } catch (error) {
    console.error('Erreur dans notification:', error.message);
    showToast(`Erreur de notification : ${error.message}`);
  }
};

export const accept = async (additionalData, otpServersObjects, setOtpServersObjects, setNotified, setAdditionalData) => {
  try {
    if (
      !otpServersObjects[additionalData.otpServer] ||
      !otpServersObjects[additionalData.otpServer].host ||
      !otpServersObjects[additionalData.otpServer].uid ||
      !otpServersObjects[additionalData.otpServer].tokenSecret ||
      !additionalData.lt
    ) {
      showToast('Données manquantes pour accept');
      return;
    }

    if (
      additionalData.hostToken != null &&
      otpServersObjects[additionalData.otpServer].hostToken !== additionalData.hostToken
    ) {
      showToast('hostToken non correspondant');
      return;
    }

    const serverData = otpServersObjects[additionalData.otpServer];
    const url = `${serverData.host}users/${serverData.uid}/methods/push/${additionalData.lt}/${serverData.tokenSecret}`;
    console.log('Requête accept URL:', url, 'tokenSecret:', serverData.tokenSecret);

    const response = await axios.post(
      url,
      {},
      { headers: { 'Content-Type': 'application/json' }, timeout: 10000 }
    );

    if (response.data.code === 'Ok') {
      let updatedOtpServers = { ...otpServersObjects };
      if (response.data.tokenSecret) {
        updatedOtpServers[additionalData.otpServer] = {
          ...serverData,
          tokenSecret: response.data.tokenSecret,
        };
        setOtpServersObjects(updatedOtpServers);
        storage.set('otpServers', JSON.stringify(updatedOtpServers));
        console.log('Nouveau tokenSecret:', response.data.tokenSecret);
      }
      setNotified(false);
      setAdditionalData(null);
      showToast('Authentification réussie !');
    } else {
      throw new Error('Réponse serveur invalide');
    }
  } catch (error) {
    console.error('Erreur dans accept:', error.message, error.response?.data);
    setNotified(false);
    setAdditionalData(null);
    showToast(`${error.message}${error.response ? `: ${error.response.data?.message || ''}` : ''}`);
  }
};

export const reject = (setNotified, setAdditionalData) => {
  try {
    setNotified(false);
    setAdditionalData(null);
    showToast('Authentification refusée');
  } catch (error) {
    console.error('Erreur dans reject:', error.message);
    showToast(`Erreur dans reject: ${error.message}`);
  }
};

export const sync = async (host, uid, code, gcmId, platform = Platform.OS, manufacturer = 'unknown', model = 'unknown') => {
  try {
    const cleanedHost = host.endsWith('/') ? host : `${host}/`;
    const url = `${cleanedHost}users/${uid}/methods/push/activate/${code}/${gcmId}/${platform}/${manufacturer}/${model}`;
    console.log('Requête sync URL:', url, 'code:', code, 'gcmId:', gcmId);

    const response = await axios.post(
      url,
      {},
      { headers: { 'Content-Type': 'application/json' }, timeout: 10000 }
    );

    if (response.data.code === 'Ok') {
      const otpServerKey = `${cleanedHost}${uid}`;
      const updatedOtpServers = {
        ...JSON.parse(storage.getString('otpServers') || '{}'),
        [otpServerKey]: {
          host: cleanedHost,
          hostToken: response.data.hostToken || '',
          tokenSecret: response.data.tokenSecret,
          hostName: response.data.hostName || 'Serveur inconnu',
          uid,
        },
      };
      storage.set('otpServers', JSON.stringify(updatedOtpServers));
      console.log('otpServers mis à jour:', updatedOtpServers);
      showToast('Synchronisation effectuée');
      return { success: true, data: response.data };
    } else {
      throw new Error(response.data.message || 'Erreur lors de la synchronisation');
    }
  } catch (error) {
    console.error('Erreur dans sync:', error.message, error.response?.data);
    showToast(`${error.message}${error.response ? `: ${error.response.data?.message || ''}` : ''}`);
    return { success: false, message: error.message };
  }
};

export const desync = async (otpServer, otpServersObjects, setOtpServersObjects) => {
  try {
    if (!otpServersObjects[otpServer]) {
      showToast('Serveur introuvable');
      return;
    }

    const confirm = await new Promise((resolve) => {
      Alert.alert(
        'Confirmation',
        `Voulez-vous vraiment désactiver la connexion de ${otpServersObjects[otpServer].hostName || 'ce serveur'} avec votre mobile ?`,
        [
          { text: 'Annuler', style: 'cancel', onPress: () => resolve(false) },
          { text: 'Confirmer', onPress: () => resolve(true) },
        ]
      );
    });

    if (!confirm) {
      return;
    }

    const serverData = otpServersObjects[otpServer];
    const url = `${serverData.host}users/${serverData.uid}/methods/push/${serverData.tokenSecret}`;
    console.log('Requête desync URL:', url);

    await axios.delete(url, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000,
    });

    const updatedOtpServers = { ...otpServersObjects };
    delete updatedOtpServers[otpServer];
    setOtpServersObjects(updatedOtpServers);
    storage.set('otpServers', JSON.stringify(updatedOtpServers));
    console.log('otpServers mis à jour:', updatedOtpServers);
    showToast('Désactivation effectuée');
  } catch (error) {
    console.error('Erreur dans desync:', error.message, error.response?.data);
    showToast(`${error.message}${error.response ? `: ${error.response.data?.message || ''} - Probablement que le serveur n'est pas joignable` : ''}`);
  }
};

export const refresh = async (url, uid, tokenSecret, gcmId, registrationId) => {
  try {
    const cleanedUrl = url.endsWith('/') ? url : `${url}/`;
    const cleanedTokenSecret = tokenSecret.replace(/^"|"$/g, '');
    const requestUrl = `${cleanedUrl}users/${uid}/methods/push/refresh/${cleanedTokenSecret}/${gcmId}/${registrationId}`;
    console.log('Requête refresh URL:', requestUrl);

    const response = await axios.post(
      requestUrl,
      {},
      { headers: { 'Content-Type': 'application/json' }, timeout: 10000 }
    );

    if (response.data.code === 'Ok') {
      storage.set('gcm_id', registrationId);
      showToast('Refresh gcm_id');
      return { success: true };
    } else {
      throw new Error(response.data.message || 'Erreur lors du refresh');
    }
  } catch (error) {
    console.error('Erreur dans refresh:', error.message, error.response?.data);
    showToast(`${error.message}${error.response ? `: ${error.response.data?.message || ''}` : ''}`);
    return { success: false, message: error.message };
  }
};

export const desactivateUser = async (url, uid, tokenSecret, gcmId) => {
  try {
    const cleanedUrl = url.endsWith('/') ? url : `${url}/`;
    const cleanedTokenSecret = tokenSecret.replace(/^"|"$/g, '');
    const requestUrl = `${cleanedUrl}users/${uid}/methods/push/desactivate/${cleanedTokenSecret}/${gcmId}`;
    console.log('Requête desactivateUser URL:', requestUrl);

    const response = await axios.post(
      requestUrl,
      {},
      { headers: { 'Content-Type': 'application/json' }, timeout: 10000 }
    );

    if (response.data.code === 'Ok') {
      showToast('Désactivation effectuée');
      return { success: true };
    } else {
      throw new Error(response.data.message || 'Erreur lors de la désactivation');
    }
  } catch (error) {
    console.error('Erreur dans desactivateUser:', error.message, error.response?.data);
    showToast(`${error.message}${error.response ? `: ${error.response.data?.message || ''}` : ''}`);
    return { success: false, message: error.message };
  }
};
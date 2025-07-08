import axios from 'axios';
import { storage } from '../utils/storage';
import { useOtpServersStore } from '../stores/useOtpServersStore';
import { useTotpStore } from '../stores/useTotpStore';
import { Platform, ToastAndroid, Alert } from 'react-native';
import { fetchEtablissement } from './nfcService';
import { useNfcStore } from '../stores/useNfcStore';

export const showToast = (message) => {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.LONG);
  } else {
    Alert.alert('Info', message);
  }
};

const zustandStore = useOtpServersStore.getState();
const zustandTotpStore = useTotpStore.getState();
const zustandNfcStore = useNfcStore.getState();

const updateOtpServers = (updated, setOtpServersObjects) => {
  setOtpServersObjects(prev => {
    const prevStr = JSON.stringify(prev);
    const nextStr = JSON.stringify(updated);
    if (prevStr !== nextStr) {
      storage.set('otpServers', nextStr);
      console.log('otpServers mis à jour:', updated);
      return updated;
    }
    return prev; // aucune modification
  });
};
export const updateOtpServersZustand = (updated) => {
  const prev = useOtpServersStore.getState().otpServers;
  const prevStr = JSON.stringify(prev);
  const nextStr = JSON.stringify(updated);
  if (prevStr !== nextStr) {
    useOtpServersStore.getState().setOtpServers(updated);
    console.log('🟢 otpServers Zustand mis à jour:', updated);
  }
};

// ===============================
// Notification reçue
// ===============================

export const notification = (
  data,
  otpServersFromRef,
  setOtpServersObjects,
  setNotified,
  setAdditionalData
) => {
  try {
    const isAuth = data.action === 'auth';
    const isDesync = data.action === 'desync';

    if (!isAuth && !isDesync) {
      console.warn('🔕 Notification ignorée : action inconnue');
      return;
    }

    // Ref clone
    const updatedOtpServers = { ...otpServersFromRef };

    // Clé serveur unique
    let otpServerKey = null;
    if (data.url && data.uid) {
      const cleanedUrl = data.url.endsWith('/') ? data.url : `${data.url}/`;
      otpServerKey = `${cleanedUrl}${data.uid}`;
      data.otpServer = otpServerKey;

      // Fallback: injecter hostToken si absent
      if (
        updatedOtpServers[otpServerKey] &&
        !updatedOtpServers[otpServerKey].hostToken &&
        data.hostToken
      ) {
        updatedOtpServers[otpServerKey].hostToken = data.hostToken;
        console.log('🧩 hostToken mis à jour via fallback');
      }
    }

    //
    // === Cas AUTH ===
    //
    if (isAuth) {
      if (!otpServerKey) {
        showToast('📵 Notification auth invalide : url ou uid manquant');
        return;
      }

      const gcmId = storage.getString('gcm_id') || '';

      if (!updatedOtpServers[otpServerKey] && data.trustGcm_id === 'true') {
        updatedOtpServers[otpServerKey] = {
          host: data.url.endsWith('/') ? data.url : `${data.url}/`,
          hostToken: data.hostToken || '',
          uid: data.uid,
          tokenSecret: gcmId,
          hostName: data.hostName || 'Serveur inconnu',
        };
        console.log('🔐 Nouveau serveur initialisé');
      }

      const server = updatedOtpServers[otpServerKey];
      if (server) {
        if (!server.hostToken && data.hostToken) {
          server.hostToken = data.hostToken;
        }
        if (
          server.hostName !== data.hostName &&
          data.hostToken === server.hostToken
        ) {
          server.hostName = data.hostName;
        }

        setOtpServersObjects(updatedOtpServers);
        //storage.set('otpServers', JSON.stringify(updatedOtpServers));
        zustandStore.setOtpServers(updatedOtpServers);
        console.log('🗂️ otpServers mis à jour');

        setAdditionalData({
          ...data,
          url: server.host,
          otpServer: otpServerKey,
          text: data.text
            ? data.text.replace(
                'compte',
                `compte ${getName(otpServerKey, updatedOtpServers)} `
              )
            : 'Veuillez valider votre connexion.',
        });
        setNotified(true);
      } else {
        console.warn('⚠️ Serveur introuvable après init OTP');
      }
    }

    //
    // === Cas DESYNC ===
    //
    else if (isDesync) {
      let matchingKey = findMatchingOtpServer({
        otpServers: updatedOtpServers,
        otpServerKey,
        hostToken: data.hostToken,
      });

      if (matchingKey) {
        desync(matchingKey, updatedOtpServers, setOtpServersObjects);
      } else {
        console.warn('❌ Aucun serveur OTP correspondant à la désactivation');
        showToast('Notification de désactivation reçue, mais aucun serveur trouvé.');
      }
    }
  } catch (error) {
    console.error('❌ Erreur dans notification:', error.message);
    showToast(`Erreur dans notification : ${error.message}`);
  }
};


// ===============================
// Accept
// ===============================

export const accept = async (
  additionalData,
  otpServersObjects,
  setOtpServersObjects,
  setNotified,
  setAdditionalData
) => {
  try {
    const otpServer = additionalData.otpServer;
    const server = otpServersObjects[otpServer];

    if (!server || !server.host || !server.uid || !server.tokenSecret || !additionalData.lt) {
      showToast('Données manquantes pour accept');
      return;
    }

    if (
      additionalData.hostToken &&
      server.hostToken !== additionalData.hostToken
    ) {
      showToast('hostToken non correspondant');
      return;
    }

    const url = `${server.host}users/${server.uid}/methods/push/${additionalData.lt}/${server.tokenSecret}`;
    console.log('Requête accept URL:', url);

    const response = await axios.post(url, {}, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000,
    });

    if (response.data.code === 'Ok') {
      let updated = { ...otpServersObjects };
      if (response.data.tokenSecret) {
        updated[otpServer] = { ...server, tokenSecret: response.data.tokenSecret };
        updateOtpServers(updated, setOtpServersObjects);
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

// ===============================
// Reject
// ===============================

export const reject = async (additionalData, otpServersObjects,setNotified, setAdditionalData) => {
  try {
    const otpServer = additionalData.otpServer;
    const server = otpServersObjects[otpServer];
    if (!server || !server.host || !server.uid || !server.tokenSecret || !additionalData.lt) {
      showToast('Données manquantes pour refuser');
      return;
    }

    const url = `${server.host}users/${server.uid}/methods/push/${additionalData.lt}/${server.tokenSecret}/reject`;
    console.log('[reject] Requête reject URL:', url);

    const response = await axios.post(url, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000,
    });

    if (response.data.code === 'Ok') {
      setNotified(false);
      setAdditionalData(null);
      showToast('Authentification refusée');
    } else {
      throw new Error('Réponse serveur invalide');
    }
    
  } catch (error) {
    console.error('[REJECT] Erreur dans reject:', error.message);
    showToast(`Erreur lors du refus: ${error.message}`);
  }
};

// ===============================
// Sync
// ===============================
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
      zustandStore.setOtpServers(updatedOtpServers);
      console.log('otpServers mis à jour:', updatedOtpServers);
      showToast('Synchronisation effectuée');

      if (response.data.autoActivateTotp){
        const serverName = getName(otpServerKey, updatedOtpServers);
        await autoActivateTotp(otpServerKey, response.data.totpKey, updatedOtpServers);
      }

      const result = await autoActivateNfc(cleanedHost);
      if (result?.success) {
        console.log('[sync] Auto activation NFC effectuée');
        showToast('Activation NFC effectuée');
      }

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

// ===============================
// Desync
// ===============================

export const desync = async (otpServer, otpServersObjects, setOtpServersObjects) => {
  try {
    const server = otpServersObjects[otpServer];
    if (!server) {
      showToast('Serveur introuvable');
      return;
    }

    const url = `${server.host}users/${server.uid}/methods/push/${server.tokenSecret}`;
    console.log('Requête desync URL:', url);

    await axios.delete(url, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000,
    });

    const updated = { ...otpServersObjects };
    delete updated[otpServer];
    console.log('🔁 updatedOtpServers DESYNC', updated);
    updateOtpServersZustand(updated);
    showToast('Désactivation effectuée');
  } catch (error) {
    console.error('Erreur dans desync:', error.message, error.response?.data);
    showToast(`${error.message}${error.response ? `: ${error.response.data?.message || ''}` : ''}`);
  }
};

export const refresh = async (url, uid, tokenSecret, gcmId, registrationId) => {
  try {
    const cleanedUrl = url.endsWith('/') ? url : `${url}/`;
    const cleanedTokenSecret = tokenSecret.replace(/^"|"$/g, '');
    const cleanedGcmId = gcmId.replace(/^"|"$/g, '');
    const requestUrl = `${cleanedUrl}users/${uid}/methods/push/refresh/${cleanedTokenSecret}/${cleanedGcmId}/${registrationId}`;
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

export const getName = (otpServer, otpServersObjects) => {
  try {
    const serverData = otpServersObjects[otpServer];
    if (!serverData) {
      throw new Error(`Serveur ${otpServer} non trouvé dans otpServersObjects`);
    }

    if (
      serverData.hostName == null ||
      serverData.hostName === 'Serveur inconnu' ||
      serverData.hostName === 'Esup Auth'
    ) {
      // Extraction manuelle du hostname (compatible React Native)
      const host = serverData.host.replace(/\/+$/, ''); // Supprime les / finaux
      const hostnameMatch = host.match(/^(?:https?:\/\/)?([^\/]+)/i);
      const hostname = hostnameMatch ? hostnameMatch[1] : host;
      const domainParts = hostname.split('.');
      const shortDomain = domainParts.length >= 2 ? domainParts.slice(-2).join('.') : hostname;
      return `${shortDomain} (${serverData.uid})`;
    } else {
      return `${serverData.hostName} (${serverData.uid})`;
    }
  } catch (error) {
    console.error('Erreur dans getName:', error.message);
    return otpServer; // Retourne la clé brute en cas d’erreur
  }
};

// Gestion du pending
export const otpServerStatus = async (
  otpServer,
  otpServersObjects,
  setOtpServersObjects,
  setNotified,
  setAdditionalData,
  otpServersStack
) => {
  console.log('📱 otpServerStatus appelé pour:', otpServer);
  if (!otpServer || !otpServersObjects[otpServer]) {
    console.warn('📱 otpServerStatus: otpServer manquant ou invalide');
    if (otpServersStack.length > 0) {
      return otpServerStatus(
        otpServersStack.pop(),
        otpServersObjects,
        setOtpServersObjects,
        setNotified,
        setAdditionalData,
        otpServersStack
      );
    }
    return;
  }

  const { host, uid, tokenSecret } = otpServersObjects[otpServer];
  if (!host || !uid || !tokenSecret) {
    console.warn('📱 otpServerStatus: host, uid ou tokenSecret manquant');
    if (otpServersStack.length > 0) {
      return otpServerStatus(
        otpServersStack.pop(),
        otpServersObjects,
        setOtpServersObjects,
        setNotified,
        setAdditionalData,
        otpServersStack
      );
    }
    return;
  }

  try {
    const response = await axios.get(
      `${host}users/${uid}/methods/push/${tokenSecret}`,
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000,
      }
    );
    console.log('📱 Réponse otpServerStatus:', response.data);

    if (response.data.code === 'Ok') {
      const data = { ...response.data, otpServer, url: host, uid };
      notification(data, otpServersObjects, setOtpServersObjects, setNotified, setAdditionalData);
    } else {
      if (otpServersStack.length > 0) {
        return otpServerStatus(
          otpServersStack.pop(),
          otpServersObjects,
          setOtpServersObjects,
          setNotified,
          setAdditionalData,
          otpServersStack
        );
      }
    }
  } catch (error) {
    console.error('📱 Erreur dans otpServerStatus:', error.message);
    if (otpServersStack.length > 0) {
      return otpServerStatus(
        otpServersStack.pop(),
        otpServersObjects,
        setOtpServersObjects,
        setNotified,
        setAdditionalData,
        otpServersStack
      );
    }
  }
};

// ===============================
// Find matching OTP server
// ===============================
export function findMatchingOtpServer({ otpServers, otpServerKey, hostToken }) {
  // 1. Correspondance directe via la clé
  if (otpServerKey && otpServers[otpServerKey]) {
    console.log('✅ Match direct via otpServerKey:', otpServerKey);
    return otpServerKey;
  }

  // 2. Fallback : recherche par hostToken
  if (hostToken) {
    const fallbackKey = Object.keys(otpServers).find(key => {
      const serverToken = otpServers[key]?.hostToken || '';
      const match = serverToken === hostToken;
      console.log(`🔍 Match hostToken ? ${serverToken} === ${hostToken} → ${match}`);
      return match;
    });

    if (fallbackKey) {
      console.log('✅ Match via hostToken:', fallbackKey);
      return fallbackKey;
    }
  }

  // 3. Dernier recours : un seul serveur connu
  const allKeys = Object.keys(otpServers);
  if (allKeys.length === 1) {
    console.warn('⚠️ Fallback : 1 seul serveur connu, on le prend par défaut');
    return allKeys[0];
  }

  // Aucun match trouvé
  return null;
}
// ===============================
// Activate TOTP
// ===============================
export const autoActivateTotp = async (otpServerKey, totpKey, otpServersObjects) => {
  try {
    const server = otpServersObjects[otpServerKey];
    if (!server) {
      showToast('Serveur introuvable');
      console.warn('📡 Serveur introuvable pour autoActivateTotp:', otpServerKey);
      return { success: false, message: 'Serveur introuvable' };
    }

    const url = `${server.host}users/${server.uid}/methods/totp/autoActivateTotp/${server.tokenSecret}`;
    console.log('📡 Appel autoActivateTotp URL:', url);

    const response = await axios.post(url, {}, { timeout: 10000 });
    console.log('📡 autoActivateTotp response:', response.data);

    if (response.data.code === 'Ok') {
      console.log('✅ autoActivateTotp OK');

      // Stocker le TOTP dans storage
      const serverName = getName(otpServerKey, otpServersObjects);
      console.log('[autoActivateTotp] 📡 serverName:', serverName);
      // Ajout du nouveau TOTP
      const currentTotpObjects = zustandTotpStore.totpObjects;
      const updated = {...currentTotpObjects, [totpKey]: serverName};
      zustandTotpStore.setTotpObjects(updated);

      showToast('Activation TOTP effectuée');
      return { success: true };
    } else {
      throw new Error('Réponse invalide');
    }
  } catch (error) {
    console.error('❌ Erreur autoActivateTotp:', error.message);
    showToast('Erreur lors de l’activation TOTP');
    return { success: false, message: error.message };
  }
};
//==========================
// Auto Activate NFC
//==========================
export const autoActivateNfc = async (url) => {
  try {
    const nfcInfos = await fetchEtablissement(url+'esupnfc/infos');
    if (!nfcInfos){
      showToast('[autoActivateNFC] Authentification NFC non disponible pour ce serveur.');
      return;
    };
    const exists = zustandNfcStore.establishments.some((est) => est.url === nfcInfos.url);
    if (exists) {
      showToast('NFC déjà configuré pour cet établissement');
      console.log('[autoActivateNFC] Cet établissement est déjà ajouté.');
      return;
    }
    const newEstablishment = {
      url: nfcInfos.url,
      numeroId: nfcInfos.numeroId,
      etablissement: nfcInfos.etablissement,
    };
    zustandNfcStore.setEstablishments([...zustandNfcStore.establishments, newEstablishment]);
    console.log('[autoActivateNFC] Établissement ajouté:', newEstablishment);
    return { success: true };
  } catch (error) {
    console.error('[autoActivateNFC] Erreur:', error.message);
  }
}

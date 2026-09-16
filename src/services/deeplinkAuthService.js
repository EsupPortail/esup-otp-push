import { Alert, Platform } from "react-native";
import { storage } from "../utils/storage";
import { getManufacturer, getModel } from "react-native-device-info";
import { showToast, sync } from "./auth";
import Totp from "../utils/totp";
import { useTotpStore } from "../stores/useTotpStore";
import { useNfcStore } from "../stores/useNfcStore";
import { Toast } from "toastify-react-native";
import { canNfcStart } from "../utils/nfcUtils";
import { scanTagForEstablishment } from "./nfcService";

const sameEstablishmentUrl = (a, b) =>
    a?.replace(/\/+$/, '') === b?.replace(/\/+$/, '');

export const activationPush = async (params) => {
    const { host, uid, code } = params;
    if (!host || !uid || !code) {
        showToast('Paramètres d\'activation PUSH incomplets');
        return;
    };
    
    const gcmId = storage.getString('gcm_id') || '';
    const manufacturer = await getManufacturer();
    const model = getModel();
    const platform = Platform.OS;

    const result = await sync(host, uid, code, gcmId, platform, manufacturer, model);
    if (!result.success) {
        showToast('Échec de la synchronisation PUSH');
    } else {
        showToast('Synchronisation PUSH réussie');
    }
}
export const activationTotp = async (params) => {
    console.log("[activationTotp] Paramètres :", params);
    const { issuer, name, secret } = params;
    if (!issuer || !name || !secret) {
        showToast('Paramètre d\'activation TOTP manquant');
        return;
    }

    useTotpStore.getState().updateTotp(secret, Totp.buildEntry({
        name: issuer + ' : ' + name,
        issuer,
        algorithm: params.algorithm,
        digits: params.digits,
        period: params.period,
    }));
}

export const activationNfc = async (params) => {
    console.log("[activationNfc] Paramètres :", params);
    const { url, numeroId, etablissement } = params;
    if (!url || !numeroId || !etablissement) {
        showToast('Paramètres d\'activation NFC manquant');
        return;
    }

    const { establishments, addEstablishment } = useNfcStore.getState();
    const exists = establishments.some(est =>
        sameEstablishmentUrl(est.url, url),
    );

    if (!exists) {
        addEstablishment({ url, numeroId, etablissement });
        Toast.show({
            type: 'success',
            text1: 'Méthode NFC configurée',
            text2: 'Lancement du scan NFC.',
            position: 'top',
            visibilityTime: 4000,
        });
    } else {
        Toast.show({
            type: 'info',
            text1: 'NFC déjà configuré pour cet établissement',
            text2: 'Lancement du scan NFC.',
            position: 'top',
            visibilityTime: 4000,
        });
    }

    const canStart = await canNfcStart();
    await scanTagForEstablishment(url, numeroId, canStart);
}

const confirmAction = (method) => {
    return new Promise((resolve) => {
        Alert.alert(
            `Action ${method}`,
            'Voulez-vous activer cette méthode ?',
            [
                { text: 'Annuler', style: 'cancel', onPress: () => resolve(false) },
                { text: 'Activer', onPress: () => resolve(true) },
            ]
        );
    });
};

export async function DeepAuthHandler(params){
    console.log("[DeepAuthHandler] params :", params);

    const method = params?.method;
    if (!method) return;

    console.log("[DeepAuthHandler] method :", method);

    const confirmed = await confirmAction(method);

    if (!confirmed) {
        console.log("[DeepAuthHandler] Activation annulée");
        return;
    }

    switch (method) {
        case 'push':
            await activationPush(params);
            break;
        case 'totp':
            await activationTotp(params);
            break;
        case 'esupnfc':
            await activationNfc(params);
            break;
        default:
            console.log("[DeepAuthHandler] method inconnue :", method);
            break;
    }
}

export function handleOtpAuthLink(url) {
  try {
    const parsed = Totp.parseTotpUrl(url);

    if (!parsed?.secret || !parsed?.name) {
      Alert.alert('Erreur', 'Données manquantes');
      return;
    }

    Alert.alert(
      'Activation TOTP',
      `${parsed.issuer || parsed.name}`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Activer',
          onPress: () => {
            useTotpStore.getState().updateTotp(parsed.secret, Totp.buildEntry(parsed));
          },
        },
      ],
    );
  } catch (e) {
    console.error('[otpauth] URL invalide', e);
  }
}

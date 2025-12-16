import { Alert, Platform } from "react-native";
import { storage } from "../utils/storage";
import { getManufacturer, getModel } from "react-native-device-info";
import { showToast, sync } from "./auth";
import { handleTotpQrCode } from "../utils/qrCodeHandler";
import Totp from "../utils/totp";
import { useTotpStore } from "../stores/useTotpStore";
import { useNfcStore } from "../stores/useNfcStore";

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

    useTotpStore.getState().updateTotp(secret, issuer + ' : ' + name);
}

export const activationNfc = (params) => {
    console.log("[activationNfc] Paramètres :", params);
    const { url, numeroId, etablissement } = params;
    if (!url || !numeroId || !etablissement) {
        showToast('Paramètres d\'activation NFC manquant');
        return;
    }

    useNfcStore.getState().addEstablishment({ url, numeroId, etablissement });
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
            activationNfc(params);
            break;
        default:
            console.log("[DeepAuthHandler] method inconnue :", method);
            break;
    }
}

export function handleOtpAuthLink(url) {
  try {
    console.log('[otpauth] URL:', url);
    const parsed = new URL(url);
    console.log('[otpauth] Parsed:', parsed);

    if (parsed.protocol !== 'otpauth:') return;

    const issuer = parsed.searchParams.get('issuer');
    const secret = parsed.searchParams.get('secret');

    if (!secret || !issuer) {
      Alert.alert('Erreur', 'Données manquantes');
      return;
    }

    Alert.alert(
      'Activation TOTP',
      `${issuer}`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Activer',
          onPress: () => {
            useTotpStore.getState().updateTotp(secret, issuer);
          },
        },
      ],
    );
  } catch (e) {
    console.error('[otpauth] URL invalide', e);
  }
}

import { Alert, Platform } from "react-native";
import { storage } from "../utils/storage";
import { getManufacturer, getModel } from "react-native-device-info";
import { showToast, sync } from "./auth";

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
export const activationTotp = async (params) => {console.log("activationTotp params :", params);}

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
        default:
            console.log("[DeepAuthHandler] method inconnue :", method);
            break;
    }
}
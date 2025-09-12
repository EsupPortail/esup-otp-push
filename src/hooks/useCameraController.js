import { useState, useEffect } from "react";
import { Alert, Platform } from "react-native";
import { check, openSettings, PERMISSIONS, request, RESULTS } from "react-native-permissions";

const permissionType = Platform.select({
      ios: PERMISSIONS.IOS.CAMERA,
      android: PERMISSIONS.ANDROID.CAMERA,
});

export const useCameraController = () => {
    const [isScanning, setIsScanning] = useState(true);
    const [permissionStatus, setPermissionStatus] = useState(null);
    const [startReloadCamera, setStartReloadCamera] = useState(false);
    
    const checkPermission = async () => {
        try {
            if (!permissionType) {
                return;
            }
            console.log("Vérification de la permission :", permissionType);
    
            const status = await check(permissionType);
            setPermissionStatus(status);
            handlePermissionStatus(status);
        } catch (error) {
            console.error("Erreur lors de la vérification de la permission :", error);
        }
    }
    
    const requestPermission = async () => {
        try {
            if (!permissionType) {
                return;
            }
            console.log("Demande de permission :", permissionType);
    
            const status = await request(permissionType);
            setPermissionStatus(status);
            handlePermissionStatus(status);
        } catch (error) {
            console.error("Erreur lors de la demande de permission :", error);
        }
    }
    
    const handlePermissionStatus = async (status) => {
        console.log("handlePermissionStatus", status);
        switch (status) {
            case RESULTS.UNAVAILABLE:
                Alert.alert("Cet appareil ne possède pas cette fonctionnalité");
                break;
            case RESULTS.DENIED:
                Alert.alert(
                    "Permission refusée",
                    "Vous devez autoriser l'accès à la caméra pour scanner les QR codes.",
                    [
                        { text: "Annuler", style: "cancel" },
                        { text: "Autoriser", onPress: () => requestPermission() },
                    ],
                );
                break;
            case RESULTS.BLOCKED:
                Alert.alert(
                    "Permission bloquée",
                    "Vous devez autoriser l'accès à la caméra dans les paramètres de l'application.",
                    [
                        { text: "Annuler", style: "cancel" },
                        { text: "Ouvrir les paramètres", onPress: () => openSettings('application') },
                    ],
                );
                break;
            case RESULTS.GRANTED:
                // Reload the camera
                setStartReloadCamera(true);
                break;
            default:
                Alert.alert("Erreur", "Une erreur est survenue lors de la vérification de la permission.");
                break;
        }
    }

    useEffect(() => {
        checkPermission();
    }, []);

    return { isScanning, setIsScanning, permissionStatus, setPermissionStatus, checkPermission, requestPermission, startReloadCamera };
};
import React, {useRef, useState, useEffect, useCallback} from 'react';
import {StyleSheet, View, Text, TouchableOpacity, Alert} from 'react-native';
import {useTheme} from '@react-navigation/native';
import {Camera, CameraType} from 'react-native-camera-kit';
import {useNavigation} from '@react-navigation/native';
import { handleUniversalQrCodeScan } from '../utils/qrCodeHandler';

const QRCodeScannerScreen = () => {
  const {colors} = useTheme();
  const navigation = useNavigation();
  const [isScanning, setIsScanning] = useState(true);
  const cameraRef = useRef(null);
  const hasScanned = useRef(false); // Ajout pour bloquer les scans multiples

  // Gérer le scan
  const onReadCode = useCallback(
    async (event) => {
      if (!isScanning || hasScanned.current) return; // Ignorer si le scan est arrêté

      hasScanned.current = true; // Marquer comme scanné
      setIsScanning(false); // Désactiver le scan

      const qrValue = event.nativeEvent.codeStringValue;
      if (qrValue) {
        try {
          const result = await handleUniversalQrCodeScan(qrValue);
          if (result.success) {
            setIsScanning(false);
            if(navigation.canGoBack()) navigation.goBack();
          } else {
            throw new Error(result.message || 'Échec du traitement du QR code');
          }
        } catch (error) {
          setIsScanning(false);
          Alert.alert(
            'Erreur',
            error.message || 'QR code invalide pour TOTP.',
            [{text: 'Annuler', onPress: () => {
              if(navigation.canGoBack()) navigation.goBack();
            }}],
          );
        } finally {
          hasScanned.current = false; // Réinitialiser après traitement
        }
      } else {
        hasScanned.current = false; // Réinitialiser après traitement
      }
    },
    [isScanning, navigation],
  );

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <Camera
        ref={cameraRef}
        cameraType={CameraType.Back}
        style={styles.camera}
        scanBarcode={isScanning}
        onReadCode={onReadCode}
        showFrame={true}
        laserColor="#FF3B30"
        frameColor={colors.primary}
      />
      <TouchableOpacity
        style={[styles.backButton, {backgroundColor: colors.card}]}
        onPress={() => {
          if(navigation.canGoBack()) navigation.goBack();
        }}>
        <Text style={[styles.backText, {color: colors.primary}]}>Retour</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  backButton: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    padding: 10,
    borderRadius: 8,
  },
  backText: {
    fontSize: 16,
    fontWeight: '500',
  },
  errorText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    marginTop: 20,
  },
});

export default QRCodeScannerScreen;

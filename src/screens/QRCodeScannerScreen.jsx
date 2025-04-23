import React, {useRef, useState, useEffect, useCallback} from 'react';
import {StyleSheet, View, Text, TouchableOpacity, Alert} from 'react-native';
import {useTheme} from '@react-navigation/native';
import {Camera} from 'react-native-camera-kit';
import {useNavigation} from '@react-navigation/native';
import {Totp} from '../utils/totp';

const QRCodeScannerScreen = ({route}) => {
  const {colors} = useTheme();
  const navigation = useNavigation();
  const {onScan} = route.params || {};
  const [isScanning, setIsScanning] = useState(true);
  const cameraRef = useRef(null);

  // Gérer le scan
  const onReadCode = useCallback(
    (event) => {
      if (!isScanning) return; // Ignorer si le scan est arrêté

      const qrValue = event.nativeEvent.codeStringValue;
      if (qrValue && onScan) {
        try {
          onScan(qrValue);
          setIsScanning(false);
          Alert.alert('Succès', 'QR code scanné avec succès.', [
            {text: 'OK', onPress: () => navigation.goBack()},
          ]);
          console.log(isScanning);
        } catch (error) {
          setIsScanning(false);
          Alert.alert(
            'Erreur',
            error.message || 'QR code invalide pour TOTP.',
            [{text: 'Annuler', onPress: () => navigation.goBack()}],
          );
        }
      }
    },
    [isScanning, onScan, navigation],
  );

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <Camera
        ref={cameraRef}
        style={styles.camera}
        scanBarcode={isScanning}
        onReadCode={onReadCode}
        showFrame={true}
        laserColor="#FF3B30"
        frameColor={colors.primary}
      />
      <TouchableOpacity
        style={[styles.backButton, {backgroundColor: colors.card}]}
        onPress={() => navigation.goBack()}>
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

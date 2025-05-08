import React, {useEffect, useRef} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Animated,
  Platform,
  Dimensions,
} from 'react-native';
import {accept, reject} from '../services/auth';
import { useTheme } from '@react-navigation/native';

const {height} = Dimensions.get('window');
const MireActionSheet = ({
  visible,
  additionalData,
  otpServersObjects,
  setOtpServersObjects,
  setNotified,
  setAdditionalData,
}) => {
  const translateY = useRef(new Animated.Value(height)).current; // Départ en bas
  const {colors} = useTheme();

  useEffect(() => {
    // Animation d’entrée
    Animated.timing(translateY, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [visible, translateY]);

  const onClose = () => {
    reject(setNotified, setAdditionalData);
  };

  if (!visible || !additionalData) return null;

  const handleAccept = () => {
    accept(
      additionalData,
      otpServersObjects,
      setOtpServersObjects,
      setNotified,
      setAdditionalData,
    );
  };

  const handleReject = () => {
    reject(setNotified, setAdditionalData);
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}>
      <TouchableOpacity
        style={[styles.overlay, {backgroundColor: 'rgba(0, 0, 0, 0.5)'}]}
        activeOpacity={1}
        onPress={() => {}}>
        <Animated.View
          style={[
            styles.container,
            {
              transform: [{translateY}],
              zIndex: 2000,
            },
          ]}>
          {/* Boîte pour le texte */}
          <View style={[styles.textBox, {backgroundColor: '#fff'}]}>
            <Text style={styles.title}>
              {additionalData.text || 'Veuillez valider votre connexion.'}
            </Text>
          </View>
          {/* Espace transparent */}
          <View style={styles.spacer} />
          {/* Boîte pour les actions */}
          <View style={[styles.actionBox, {backgroundColor: 'transparent'}]}>
            <TouchableOpacity
              style={[styles.button, {backgroundColor: colors.primary}]}
              onPress={handleAccept}>
              <Text style={styles.buttonText}>Accepter</Text>
            </TouchableOpacity>
            <View style={styles.spacerBetween} />
            <TouchableOpacity
              style={[styles.button, {backgroundColor: colors.notification}]}
              onPress={handleReject}>
              <Text style={styles.buttonText}>Rejeter</Text>
            </TouchableOpacity>
          </View>
          {/* Espace transparent */}
          <View style={styles.spacer} />
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  container: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  textBox: {
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    color: '#000',
  },
  actionBox: {
    flexDirection: 'row',
    borderRadius: 12,
    overflow: 'hidden',
  },
  button: {
    paddingVertical: 15,
    alignItems: 'center',
    flex: 1 / 2,
  },
  buttonBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '400',
    color: '#fff',
  },
  spacer: {
    height: 8,
    backgroundColor: 'transparent',
  },
  spacerBetween: {
    width: 8,
    backgroundColor: 'transparent',
  },
});

export default MireActionSheet;

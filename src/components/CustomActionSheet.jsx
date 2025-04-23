import React, { useEffect } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
  Modal,
  Animated,
  Dimensions,
} from 'react-native';
import { useTheme } from '@react-navigation/native';

const { height } = Dimensions.get('window');

const CustomActionSheet = ({ visible, onClose, actions }) => {
  const { colors } = useTheme();
  const translateY = React.useRef(new Animated.Value(height)).current;

  // Animation d'ouverture/fermeture
  useEffect(() => {
    Animated.timing(translateY, {
      toValue: visible ? 0 : height,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [visible, translateY]);

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={[styles.overlay, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}
        activeOpacity={1}
      >
        <Animated.View
          style={[
            styles.container,
            {
              transform: [{ translateY }],
            },
          ]}
        >
          {/* Boîte pour les actions */}
          <View style={[styles.actionBox, { backgroundColor: colors.actionSheet }]}>
            {actions.map((action, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.button,
                  index < actions.length - 1 && styles.buttonBorder,
                ]}
                onPress={() => {
                  action.onPress();
                  onClose();
                }}
              >
                <Text style={[styles.buttonText, { color: colors.primary }]}>
                  {action.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {/* Espace transparent */}
          <View style={styles.spacer} />
          {/* Bouton Annuler */}
          <View style={[styles.cancelBox, { backgroundColor: colors.actionSheet }]}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={[styles.cancelText, { color: '#FF3B30' }]}>
                Annuler
              </Text>
            </TouchableOpacity>
          </View>
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
    paddingHorizontal: 15, // Margin global pour éloigner des bords
    paddingBottom: 20, // Espace en bas
  },
  actionBox: {
    borderRadius: 12,
    overflow: 'hidden', // Pour que les bordures arrondies s'appliquent
  },
  button: {
    paddingVertical: 15,
    alignItems: 'center',
  },
  buttonBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '400',
  },
  spacer: {
    height: 8, // Espace transparent entre actions et Annuler
    backgroundColor: 'transparent',
  },
  cancelBox: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  cancelButton: {
    paddingVertical: 15,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 18,
    fontWeight: '600', // Plus gras pour Annuler, comme iOS
  },
});

export default CustomActionSheet;
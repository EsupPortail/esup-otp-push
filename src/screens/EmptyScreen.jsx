import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React, { useState } from 'react'
import { useTheme } from '@react-navigation/native';
import CustomActionSheet from '../components/CustomActionSheet';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const EmptyScreen = ({isActionSheetOpen, setIsActionSheetOpen, handleScanQrCode, handleManualInput}) => {
  const {colors} = useTheme();
  return (
    <View style={styles.container}>
      <View>
        <View style={styles.methods}>
            <Text style={[styles.methodsTitle, styles.method, {color: colors.text}]}>TOTP</Text>
            <Text style={[styles.methodsTitle, styles.method, {color: colors.text}]}>NFC</Text>
            <Text style={[styles.methodsTitle, styles.method, {color: colors.text}]}>PUSH</Text>
            
        </View>
        <Text style={[styles.textInfo, {color: colors.text}]}>
            Aucune méthode d'authentification n'a été configurée. Cliquez ci-dessous pour commencer la configuration.
        </Text>
      </View>
      <TouchableOpacity
        style={styles.floattingButton}
        onPress={() => setIsActionSheetOpen(true)}>
        <Icon name="plus-circle" color={colors.primary} size={56} />
      </TouchableOpacity>
    </View>
  )
}

export default EmptyScreen

const styles = StyleSheet.create({
    container: {
    flex: 1,
    padding: 40,
  },
  methods: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  methodsTitle: {
    fontSize: 18,
  },
  textInfo: {
    fontSize: 16,
    marginTop: 90,
    textAlign: 'center',
  },
  method: {
    borderRadius: 8,
    padding: 12,
    borderColor: 'grey',
    borderWidth: 1,
  },
  floattingButton: {
    alignSelf: 'center',
    marginTop: 30,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
})
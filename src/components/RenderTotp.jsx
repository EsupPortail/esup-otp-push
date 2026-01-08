import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import React, {useCallback} from 'react';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import {Swipeable} from 'react-native-gesture-handler';
import {useTheme} from '@react-navigation/native';
import {Totp} from '../utils/totp';
import { Clipboard } from 'react-native';
import { Toast } from 'toastify-react-native';

const RenderTotp = ({item, code, onDelete}) => {
  const {colors} = useTheme();
  const [secret, name] = item;

  const renderRightActions =  () => (
      <TouchableOpacity
        style={[styles.deleteButton, {backgroundColor: 'red'}]}
        onPress={onDelete}>
        <Icon name="delete" size={24} color="#fff" />
      </TouchableOpacity>
    );
  const copyToClipboard = () => {
    Clipboard.setString(code);
    Toast.show({
      type: 'success',
      text1: 'Code copié dans le presse-papier',
      position: 'top',
      visibilityTime: 6000,
    });
  }

  return (
    <Swipeable renderRightActions={renderRightActions}>
      <TouchableOpacity style={styles.container} onPress={copyToClipboard}>
        <View>
          <Text style={[styles.code, {color: colors.text}]}>
            {Totp.formatCode(code)}
          </Text>
        </View>
        <View style={styles.nameRow}>
          <Text style={{color: colors.text}}>{name}</Text>
        </View>
      </TouchableOpacity>
    </Swipeable>
  );
};

export default RenderTotp;

const styles = StyleSheet.create({
  container: {
    marginVertical: 2,
    marginHorizontal: 5,
    padding: 8,
    borderRadius: 10,
  },
  code: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 3,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  deleteButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 60,
    borderRadius: 8,
    marginVertical: 5,
  },
  icon: {},
});

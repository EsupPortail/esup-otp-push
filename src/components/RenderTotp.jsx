import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import React from 'react';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import {useTheme} from '@react-navigation/native';
import { Totp } from '../utils/totp';

const RenderTotp = ({item, code, onDelete}) => {
  const {colors} = useTheme();
  const [secret,name] = item;

  return (
    <View style={styles.container}>
      <View>
        <Text style={[styles.code, {color: colors.text}]}>{Totp.formatCode(code)}</Text>
      </View>
      <View style={styles.nameRow}>
        <Text style={{color: colors.text}}>{name}</Text>
        <TouchableOpacity onPress={onDelete}>
          <MaterialIcon
            name="delete"
            color={colors.primary}
            size={20}
            style={styles.icon}
          />
        </TouchableOpacity>
      </View>
    </View>
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
  icon: {},
});

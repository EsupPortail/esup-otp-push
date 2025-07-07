import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import React from 'react';
import { useTheme } from '@react-navigation/native';

const RadioButton = ({options, checked, onChange}) => {
    const {colors} = useTheme();
  return (
    <View style={styles.container}>
      {options.map(option => {
        let active = checked === option.value;
        return (
          <TouchableOpacity
            key={option.value}
            onPress={() => onChange(option.value)}
            style={[styles.radio, {backgroundColor: colors.secondary}]}
            >
            <Icon
              name={active ? 'radiobox-marked' : 'radiobox-blank'}
              color='white'
              size={30}
            />
            <Text style={{color: 'white'}}>{option.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default RadioButton;

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'space-around',
    },
    radio: {
        height: 60,
        width: '100%',
        gap: 10,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        borderRadius: 10,
        marginBottom: 10,
    }
});

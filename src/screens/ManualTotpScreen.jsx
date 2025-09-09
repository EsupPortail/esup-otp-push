import React from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { useNavigation, useTheme } from '@react-navigation/native';
import { useTotpStore } from '../stores/useTotpStore';

const ManualTotpScreen = ({ onPressFn }) => {
  const { control, handleSubmit, reset, formState: { errors } } = useForm();
  const { onPress } = onPressFn;
  const { colors } = useTheme();
  const navigation = useNavigation();
  // Retirer les espaces
  const cleanInput = (text) => text.trim();
  console.log(onPress);

  const onSubmit = ({ name, secret }) => {
    const cleanedSecret = cleanInput(secret);
    const cleanedName = cleanInput(name);
    if (cleanedSecret.length < 16 || cleanedSecret.length % 2 !== 0) {
      Alert.alert(
        'Erreur',
        'Clé invalide'
      );
      return;
    }

    const totpObjects = useTotpStore.getState().totpObjects;;
    const updated = { ...totpObjects, [cleanedSecret]: cleanedName };

    
    if (onPress) onPress(updated);
    reset();

    navigation.goBack();
  };

  return (
    <View>

      <Text style={{ marginTop: 20, color: colors.text }}>Nom du compte</Text>
      <Controller
        control={control}
        name="name"
        defaultValue=""
        rules={{ required: 'Champ obligatoire' }}
        render={({ field: { onChange, value }, fieldState: { error } }) => (
          <>
            <TextInput
            placeholder="ex. login"
            placeholderTextColor={colors.text}
            value={value}
            onChangeText={onChange}
            style={[
              styles.input,
              { borderColor: colors.text, color: colors.text },
            ]}
            autoCapitalize="none"
          />
          {error &&  <Text style={{color: 'red'}}>{error.message}</Text>}
          </>
        )}
      />
      <Text style={{ marginTop: 20, color: colors.text }}>Clé secrète</Text>
      <Controller
        control={control}
        name="secret"
        defaultValue=""
        rules={{ required: 'champ obligatoire', minLength: {
          value: 16,
          message: 'La clé doit faire au moins 16 caractères'
        }}}
        render={({ field: { onChange, value }, fieldState: { error } }) => (
          <>
            <TextInput
            placeholder="ex: ABCDEFGH12345678"
            placeholderTextColor={colors.text}
            value={value}
            onChangeText={onChange}
            autoCapitalize="none"
            style={[
                styles.input,
                { borderColor: colors.text, color: colors.text },
              ]}
          />
          {error &&  <Text style={{color: 'red'}}>{error.message}</Text>}
          </>
        )}
      />

      <View style={styles.button}>
        <Button title="Ajouter" onPress={handleSubmit(onSubmit)} />
      </View>
    </View>
  );
};

export default ManualTotpScreen;

const styles = StyleSheet.create({
    input: {
        borderWidth: 1,
        borderRadius: 6,
        padding: 10,
        marginTop: 5,
    },
    button: {
        marginTop: 20,
    }
});

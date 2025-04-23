import React from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { useNavigation, useTheme } from '@react-navigation/native';
import { Totp } from '../utils/totp'; // Ton gestionnaire MMKV

const ManualTotpScreen = ({ route }) => {
  const { control, handleSubmit, reset, formState: { errors } } = useForm();
  const { onPress } = route.params || {};
  const { colors } = useTheme();
  const navigation = useNavigation();
  console.log(onPress);

  const onSubmit = ({ name, secret }) => {
    if (secret.length < 16 || secret.length % 2 !== 0) {
      Alert.alert(
        'Erreur',
        'La clé doit faire au moins 16 caractères et être un multiple de 2'
      );
      return;
    }

    const totpObjects = Totp.getTotpObjects();
    const updated = { ...totpObjects, [secret]: name };

    //Totp.setTotpObjects(updated);
    Alert.alert('✅ Succès', 'Compte TOTP ajouté !');
    if (onPress) onPress(updated);
    reset(); // Réinitialiser le formulaire

    // Tu peux naviguer vers la liste ou rafraîchir si besoin
    navigation.goBack();
  };

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold' }}>
        Ajouter un compte TOTP
      </Text>

      <Text style={{ marginTop: 20, color: colors.text }}>Nom du compte</Text>
      <Controller
        control={control}
        name="name"
        defaultValue=""
        rules={{ required: true }}
        render={({ field: { onChange, value } }) => (
          <TextInput
            placeholder="ex: MonCompte"
            value={value}
            onChangeText={onChange}
            style={[
              styles.input,
              { borderColor: colors.text, color: colors.text },
            ]}
          />
        )}
      />

      <Text style={{ marginTop: 20, color: colors.text }}>Clé secrète</Text>
      <Controller
        control={control}
        name="secret"
        defaultValue=""
        rules={{ required: true }}
        render={({ field: { onChange, value } }) => (
          <TextInput
            placeholder="ex: ABCDEFGH12345678"
            value={value}
            onChangeText={onChange}
            autoCapitalize="characters"
            style={[
                styles.input,
                { borderColor: colors.text, color: colors.text },
              ]}
          />
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

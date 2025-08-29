import {Button, StyleSheet, Text, TextInput, View} from 'react-native';
import React from 'react';
import {Controller, useForm} from 'react-hook-form';
import {useNavigation, useTheme} from '@react-navigation/native';

const ManualPushScreen = ({onPressFn}) => {
  const {
    control,
    handleSubmit,
    reset,
    formState: {errors},
  } = useForm();
  const {colors} = useTheme();
  const navigation = useNavigation();
  const {onPress} = onPressFn;

  // Retirer les espaces
  const cleanInput = (text) => text.trim();

  const onSubmit = ({uid, code, host}) => {
    try {
      const cleanedUid = cleanInput(uid);
    const cleanedCode = cleanInput(code);
    const cleanedHost = cleanInput(host);

    console.log('cleanedUid:', cleanedUid);
    console.log('cleanedCode:', cleanedCode);
    console.log('cleanedHost:', cleanedHost);

    if (cleanedUid && cleanedCode && cleanedHost) {
      onPress({uid: cleanedUid, code: cleanedCode, host: cleanedHost});
      reset();
      navigation.goBack();
    }
    } catch (error) {
        console.error('Erreur:', error);
    }
  };

  return (
    <View>
      <Text style={{marginTop: 20, color: colors.text}}>Nom de compte</Text>
      <Controller
        control={control}
        name="uid"
        defaultValue=""
        rules={{required: 'Champ obligatoire'}}
        render={({field: {onChange, value}, fieldState: {error}}) => (
          <>
            <TextInput
              placeholder="ex. login"
              value={value}
              onChangeText={onChange}
              style={[
                styles.input,
                {borderColor: colors.text, color: colors.text},
              ]}
            />
            {error && <Text style={{color: 'red'}}>{error.message}</Text>}
          </>
        )}
      />
      <Text style={{marginTop: 20, color: colors.text}}>Code d'activation</Text>
      <Controller
        control={control}
        name="code"
        defaultValue=""
        rules={{required: 'Champ obligatoire'}}
        render={({field: {onChange, value}, fieldState: {error}}) => (
          <>
            <TextInput
              placeholder="ex. 123456"
              value={value}
              onChangeText={onChange}
              style={[
                styles.input,
                {borderColor: colors.text, color: colors.text},
              ]}
            />
            {error && <Text style={{color: 'red'}}>{error.message}</Text>}
          </>
        )}
      />
      <Text style={{marginTop: 20, color: colors.text}}>Adresse</Text>
      <Controller
        control={control}
        name="host"
        defaultValue=""
        rules={{required: 'Champ obligatoire'}}
        render={({field: {onChange, value}, fieldState: {error}}) => (
          <>
            <TextInput
              placeholder="ex. https://esup-otp-api.univ.fr"
              value={value}
              onChangeText={onChange}
              style={[
                styles.input,
                {borderColor: colors.text, color: colors.text},
              ]}
            />
            {error && <Text style={{color: 'red'}}>{error.message}</Text>}
          </>
        )}
      />

      <View style={styles.button}>
        <Button title="Activer" onPress={handleSubmit(onSubmit)} />
      </View>
    </View>
  );
};

export default ManualPushScreen;

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

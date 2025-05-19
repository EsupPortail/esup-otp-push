import {Button, StyleSheet, Text, TextInput, View} from 'react-native';
import React from 'react';
import {Controller, useForm} from 'react-hook-form';
import {useNavigation, useTheme} from '@react-navigation/native';

const ManualPushScreen = ({route}) => {
  const {
    control,
    handleSubmit,
    reset,
    formState: {errors},
  } = useForm();
  const {onPress} = route.params || {};
  const {colors} = useTheme();
  const navigation = useNavigation();

  const onSubmit = ({uid, code, host}) => {
    if (uid && code && host) {
      onPress({uid, code, host});
      reset();
      navigation.goBack();
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text style={{marginTop: 20, color: colors.text}}>Nom de compte</Text>
      <Controller
        control={control}
        name="uid"
        defaultValue=""
        rules={{required: 'Champ obligatoire'}}
        render={({field: {onChange, value}, fieldState: {error}}) => (
          <>
            <TextInput
              placeholder="ex: Ajouter le nom du compte"
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
      <Text style={{marginTop: 20, color: colors.text}}>Code</Text>
      <Controller
        control={control}
        name="code"
        defaultValue=""
        rules={{required: 'Champ obligatoire'}}
        render={({field: {onChange, value}, fieldState: {error}}) => (
          <>
            <TextInput
              placeholder="Ajouter le code"
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
      <Text style={{marginTop: 20, color: colors.text}}>Clé secrète</Text>
      <Controller
        control={control}
        name="host"
        defaultValue=""
        rules={{required: 'Champ obligatoire'}}
        render={({field: {onChange, value}, fieldState: {error}}) => (
          <>
            <TextInput
              placeholder="Ajouter l'adresse"
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

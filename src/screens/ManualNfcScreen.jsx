import { Button, StyleSheet, Text, View, TextInput } from 'react-native';
import React from 'react'
import { Controller, useForm } from 'react-hook-form';
import { useNavigation, useTheme } from '@react-navigation/native';

const ManualNfcScreen = ({onPressFn}) => {
  const { control, handleSubmit, reset, formState: { errors } } = useForm();
  const { onPress } = onPressFn;
  const { colors } = useTheme();
  const navigation = useNavigation();


  const onSubmit = ({url}) => {
    if (url) {
      onPress(url);
      reset();
      navigation.goBack();
    }
  }

  return (
    <View>
      <Text style={{ marginTop: 20, color: colors.text }}>Adresse</Text>
      <Controller 
        control={control}
        name="url"
        defaultValue=""
        rules={{required: 'Champ obligatoire'}}
        render={({ field: { onChange, value }, fieldState: { error } }) => (
          <>
            <TextInput
              placeholder="Saisissez l'url"
              value={value}
              onChangeText={onChange}
              style={[
                styles.input,
                { borderColor: colors.text, color: colors.text },
              ]}
            />
            {error && <Text style={{color: 'red'}}>{error.message}</Text>}
          </>
        )}
      />
      <View style={styles.button}>
        <Button title="Ajouter" onPress={handleSubmit(onSubmit)} />
      </View>
    </View>
  )
}

export default ManualNfcScreen

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
})
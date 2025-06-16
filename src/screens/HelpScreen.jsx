import { StyleSheet, Text, View } from 'react-native'
import React from 'react'

const HelpScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={{fontSize: 20, fontWeight: 'bold', color: 'white'}}>
        Aide encore en rédaction
      </Text>
    </View>
  )
}

export default HelpScreen

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
})
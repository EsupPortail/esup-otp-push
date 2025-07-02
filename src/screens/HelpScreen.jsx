import { StyleSheet, ScrollView } from 'react-native'
import React from 'react'
import helpData from '../data/helpData'
import Accordion from '../components/Accordion'

const HelpScreen = () => {
  return (
    <ScrollView style={styles.container}>
      {
        helpData.map(({key, title, content}, index) => {
          return (
            <Accordion key={key} title={title} content={content} index={index} />
          )
        })
      }
    </ScrollView>
  )
}

export default HelpScreen

const styles = StyleSheet.create({
    container: {
        flex: 1,
        marginTop: 20,
    }
})
import {StyleSheet, Text, View, TouchableOpacity} from 'react-native';
import React, {useState} from 'react';
import {useTheme} from '@react-navigation/native';

const Accordion = ({key, title, content, index}) => {
  const {colors} = useTheme();
  const [currentIndex, setCurrentIndex] = useState(null);

  return (
    <TouchableOpacity
      key={key}
      style={[styles.cardContainer]}
      onPress={() => setCurrentIndex(index === currentIndex ? null : index)}>
      <View style={[styles.card, {borderWidth: 1, borderColor: colors.text}]}>
        <Text style={[styles.heading, {color: colors.text}]}>{title}</Text>
        {index === currentIndex && (
          <View>
            <Text style={[styles.content, {color: colors.text}]}>
              {content}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

export default Accordion;

const styles = StyleSheet.create({
  cardContainer: {
    marginTop: 10,
    marginHorizontal: 10
  },
  card: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    borderRadius: 20,
  },
  heading: {
    fontSize: 18,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  content: {
    fontSize: 16,
    marginTop: 10,
    opacity: 0.8,
  },
});

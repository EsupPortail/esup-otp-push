import {ImageBackground, StyleSheet, Text, View, Image} from 'react-native';
import {
  DrawerContentScrollView,
  DrawerItemList,
} from '@react-navigation/drawer';
import React, {useContext} from 'react';
import {AppContext} from '../theme/AppContext';

const CustomDrawerContent = props => {
  const {isDarkTheme} = useContext(AppContext);
  return (
    <ImageBackground
      source={require('../assets/images/wallpaper.jpg')}
      style={styles.backgroundImage}>
      <Image
        source={require('../assets/images/logo.png')}
        style={styles.logo}
      />
      <View
        style={[
          styles.container,
          {backgroundColor: isDarkTheme ? '#333' : '#fff'},
        ]}>
        <DrawerContentScrollView
          {...props}
          contentContainerStyle={styles.menuContainer}>
          <DrawerItemList {...props} />
        </DrawerContentScrollView>
      </View>
    </ImageBackground>
  );
};

export default CustomDrawerContent;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: '4%',
  },
  menuContainer: {
    margin: 0,
  },
  backgroundImage: {
    flex: 1,
  },
  logo: {
    width: 90,
    height: 80,
    marginTop: 10,
    marginLeft: 20,
  },
});

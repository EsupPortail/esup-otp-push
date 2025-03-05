import {StyleSheet, View, Text, useWindowDimensions} from 'react-native';
import {React, useContext} from 'react';
import {createDrawerNavigator} from '@react-navigation/drawer';
import NfcScreen from '../screens/NfcScreen';
import HomeScreen from '../screens/HomeScreen';
import CustomDrawerContent from '../components/CustomDrawerContent';
import DarkModeToggle from '../components/DarkModeToggle';
import {useTheme} from '@react-navigation/native';

const Drawer = createDrawerNavigator();

const AppStack = () => {
  const {colors} = useTheme();
  const screenWidth = useWindowDimensions().width;

  return (
    <Drawer.Navigator
      drawerContent={props => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerRight: () => <DarkModeToggle />,
        headerTitle: () => (
          <Text style={[styles.headerTitle, {color: colors.text}]}>
            Esup Auth
          </Text>
        ),
        drawerStyle: {
            width: screenWidth * 0.8,
        }
      }}>
      <Drawer.Screen name="Accueil" component={HomeScreen} />
      <Drawer.Screen name="Nfc" component={NfcScreen} />
      <Drawer.Screen name="PUSH" component={NfcScreen} />
    </Drawer.Navigator>
  );
};

export default AppStack;

const styles = StyleSheet.create({
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 10,
  },
});

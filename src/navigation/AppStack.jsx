import {StyleSheet, View, Text, useWindowDimensions} from 'react-native';
import {React, useContext} from 'react';
import {createDrawerNavigator} from '@react-navigation/drawer';
import NfcScreen from '../screens/NfcScreen';
import HomeScreen from '../screens/HomeScreen';
import ManualTotpScreen from '../screens/ManualTotpScreen';
import PushScreen from '../screens/PushScreen';
import CustomDrawerContent from '../components/CustomDrawerContent';
import DarkModeToggle from '../components/DarkModeToggle';
import {useTheme, NavigationContainer} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import TotpScreen from '../screens/TotpScreen';
import {createStackNavigator} from '@react-navigation/stack';
import QRCodeScannerScreen from '../screens/QRCodeScannerScreen';

const Drawer = createDrawerNavigator();
const Stack = createStackNavigator();

const DrawerNavigator = () => {
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
        },
      }}>
      <Drawer.Screen
        name="Accueil"
        component={HomeScreen}
        options={{
          drawerIcon: ({color, size}) => (
            <View>
              <Text style={{color, fontSize: size}}>🏠</Text>
            </View>
          ),
        }}
      />
      <Drawer.Screen
        name="NFC"
        component={NfcScreen}
        options={{
          drawerIcon: ({color, size}) => (
            <Icon name="cellphone-nfc" color={color} size={size} />
          ),
        }}
      />
      <Drawer.Screen
        name="PUSH"
        component={PushScreen}
        options={{
          drawerIcon: ({color, size}) => (
            <Icon name="notification-clear-all" color={color} size={size} />
          ),
        }}
      />
      <Drawer.Screen
        name="TOTP"
        component={TotpScreen}
        options={{
          drawerIcon: ({color, size}) => (
            <MaterialIcon name="pin" color={color} size={size} />
          ),
        }}
      />
      <Drawer.Screen
        name="AIDE"
        component={NfcScreen}
        options={{
          drawerIcon: ({color, size}) => (
            <MaterialIcon name="question-mark" color={color} size={size} />
          ),
        }}
      />
    </Drawer.Navigator>
  );
};

const AppStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Drawer"
        component={DrawerNavigator}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="QRCodeScanner"
        component={QRCodeScannerScreen}
        options={{
          headerTitle: 'Scanner QR Code',
          headerStyle: {backgroundColor: useTheme().colors.card},
          headerTintColor: useTheme().colors.text,
        }}
      />
      <Stack.Screen
        name="ManualTotp"
        component={ManualTotpScreen}
        options={{
          headerTitle: 'Ajouter un compte TOTP',
          headerStyle: {backgroundColor: useTheme().colors.card},
          headerTintColor: useTheme().colors.text,
        }} 
      />
    </Stack.Navigator>
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

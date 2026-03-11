import {StyleSheet, View, Text, useWindowDimensions, Image, TouchableOpacity, Alert} from 'react-native';
import {React} from 'react';
import {createDrawerNavigator} from '@react-navigation/drawer';
import HomeScreen from '../screens/HomeScreen';
import ManualTotpScreen from '../screens/ManualTotpScreen';
import CustomDrawerContent from '../components/CustomDrawerContent';
import DarkModeToggle from '../components/DarkModeToggle';
import {useTheme} from '@react-navigation/native';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import {createStackNavigator} from '@react-navigation/stack';
import QRCodeScannerScreen from '../screens/QRCodeScannerScreen';
import ManualPushScreen from '../screens/ManualPushScreen';
import HelpScreen from '../screens/HelpScreen';
import ManualNfcScreen from '../screens/ManualNfcScreen';
import ManualInputScreen from '../screens/ManualInputScreen';
import DeviceInfo from 'react-native-device-info';

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
          width: screenWidth * 0.7,
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
      {/*
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
        name="PUSH"
        component={PushScreen}
        options={{
          drawerIcon: ({color, size}) => (
            <Icon name="notification-clear-all" color={color} size={size} />
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
      */}
      <Drawer.Screen
        name="AIDE"
        component={HelpScreen}
        options={{
          drawerIcon: ({color, size}) => (
            <MaterialIcon name="question-mark" color={color} size={size} />
          ),
        }}
      />
    </Drawer.Navigator>
  );
};

const showAppInfos = () => {
  const version = DeviceInfo.getVersion();

  Alert.alert(
    'Infos',
    `Esup Auth ${version}\n\n` +
    'by ESUP-Portail'
  );
};

const AppStack = () => {
  return (
    <Stack.Navigator>
      {/*<Stack.Screen
        name="Drawer"
        component={DrawerNavigator}
        options={{headerShown: false}}
      />*/}
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{
          headerTitle: 'Esup Auth',
          headerStyle: {backgroundColor: useTheme().colors.card},
          headerTintColor: useTheme().colors.text,
          headerLeft: () => <TouchableOpacity onPress={showAppInfos}>
            <Image source={require('../assets/images/logo.png')} style={styles.iconLeft} />
          </TouchableOpacity>,
          headerRight: () => <DarkModeToggle />,
        }}
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
        name="ManualInput" 
        component={ManualInputScreen} 
        options={{
          headerTitle: 'Saisie manuelle',
          headerStyle: {backgroundColor: useTheme().colors.card},
          headerTintColor: useTheme().colors.text,
        }}
      />
      {/*<Stack.Screen
        name="ManualTotp"
        component={ManualTotpScreen}
        options={{
          headerTitle: 'Ajouter un compte TOTP',
          headerStyle: {backgroundColor: useTheme().colors.card},
          headerTintColor: useTheme().colors.text,
        }} 
      />
      <Stack.Screen
        name="ManualPush"
        component={ManualPushScreen}
        options={{
          headerTitle: 'Push Notification',
          headerStyle: {backgroundColor: useTheme().colors.card},
          headerTintColor: useTheme().colors.text,
        }} 
      />
      <Stack.Screen
        name="ManualNfc"
        component={ManualNfcScreen}
        options={{
          headerTitle: 'Ajouter un établissement',
          headerStyle: {backgroundColor: useTheme().colors.card},
          headerTintColor: useTheme().colors.text,
        }} 
      /> */}
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
  iconLeft: {
    marginLeft: 10,
    marginRight: 20,
    width: 32,
    height: 30,
  }
});

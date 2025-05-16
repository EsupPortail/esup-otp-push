/**
 * @format
 */
import "react-native-gesture-handler";
import 'react-native-get-random-values';
import messaging from '@react-native-firebase/messaging';
import {AppRegistry} from 'react-native';
import App from './src/App';
import {name as appName} from './app.json';

messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('📱 *****Réception de notification:', remoteMessage);
});

AppRegistry.registerComponent(appName, () => App);

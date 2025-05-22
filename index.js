/**
 * @format
 */
import "react-native-gesture-handler";
import 'react-native-get-random-values';
import messaging from '@react-native-firebase/messaging';
import {storage} from './src/utils/storage';
import {notification} from './src/services/auth';
import {AppRegistry} from 'react-native';
import App from './src/App';
import {name as appName} from './app.json';

messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('📩 (BG) Push reçu:', remoteMessage?.data);

  try {
    const otpServers = storage.getString('otpServers')
      ? JSON.parse(storage.getString('otpServers'))
      : {};

    if (
      remoteMessage?.data?.action === 'auth' ||
      remoteMessage?.data?.action === 'desync'
    ) {
      notification(remoteMessage.data, otpServers, () => {}, () => {}, () => {});
    }
  } catch (error) {
    console.error('Erreur dans background handler:', error);
  }
});

AppRegistry.registerComponent(appName, () => App);

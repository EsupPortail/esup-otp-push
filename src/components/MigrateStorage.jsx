import {View} from 'react-native';
import {WebView} from 'react-native-webview';

const INJECTED_JAVASCRIPT = `(function() {
    window.localStorage.setItem('test', 'toto');
    window.ReactNativeWebView.postMessage(JSON.stringify(window?.localStorage || null));
  })();`;

const customHTML = `
      <body style="background: #FCAD97">
           <div style="display: flex;flex-direction: row;align-items: center;justify-content: center;height: 100%;">
            <h1 style="text-align: center; margin-top: 20px;font-size: 3rem;font-family: Arial, sans-serif;display: table;color:white;">Syncing user data, please wait...</h1>
          </div>
       </body>`;

function handleOnMessage(event) {
  // This will get the local storage in format {"localStorageKey": "localStorageValue"}
  const message = JSON.parse(event.nativeEvent.data);
  console.log('Données récupérées depuis localStorage Cordova:', message);

  // Do something with the old local storage
}

const MigrateStorage = () => {
  return (
    <View style={{width: '100%', height: 300}}>
      <WebView
        originWhitelist={['*']}
        source={{html: customHTML, baseUrl: 'https://localhost'}}
        onMessage={handleOnMessage}
        injectedJavaScript={INJECTED_JAVASCRIPT}
        javaScriptEnabled={true}
        style={{flex: 1}}
      />
    </View>
  );
};

export default MigrateStorage;

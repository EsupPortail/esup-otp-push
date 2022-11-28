# esup_auth

##Cordova project
Esup Auth is a mobile application used as an additional authentication factor using push notifications

For the moment, only the Android apk is released. You can find it here : https://play.google.com/store/apps/details?id=org.esupportail.esupAuth

### Installation

- git clone https://github.com/EsupPortail/esup-otp-push.git
- sudo apt install nodejs
- sudo apt install npm
- npm install -g cordova


### Platform generation
  browser: 
   - cd  esup-otp-push
   - cordova platform add browser
 
##### you can launch the browser in localhost with the following command :
   - cordova serve
 
  android:
   - cd esup-otp-push
   - cordova platform add android
    
  ios:
   - cd esup-otp-push
   - cordova platform add ios

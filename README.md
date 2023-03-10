
<p align="left">
  <a href="https://github.com/EsupPortail/esup-otp-push">
    <img src="https://github.com/EsupPortail/esup-otp-push/blob/master/www/img/logo.png" width="100">
  </a>
</p>

## Esup Auth
Esup Auth is a mobile application used as an additional authentication factor using push notifications

- <a href="https://play.google.com/store/apps/details?id=org.esupportail.esupAuth">Esup Auth for Android</a>
- <a href="https://apps.apple.com/fr/app/esup-auth/id1563904941">Esup Auth for iOS</a>

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

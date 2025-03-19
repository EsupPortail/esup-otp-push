# Esup Auth

[<img src="./www/img/logo.png" width="100" alt="">](https://github.com/EsupPortail/esup-otp-push)

Esup Auth is a mobile application used as an additional authentication factor using push notifications

- [Esup Auth for Android](https://play.google.com/store/apps/details?id=org.esupportail.esupAuth)
- [Esup Auth for iOS](https://apps.apple.com/fr/app/esup-auth/id1563904941)

## Installation

```sh
git clone https://github.com/EsupPortail/esup-otp-push.git
sudo apt install nodejs
sudo apt install npm
npm install -g cordova
```

## Platform generation

Browser:

```sh
cd  esup-otp-push
cordova platform add browser
```

Android:

```sh
cd esup-otp-push
cordova platform add android
````

iOS:

```sh
cd esup-otp-push
cordova platform add ios
```

## Tests

You can launch the browser in localhost with the following command
`cordova serve`

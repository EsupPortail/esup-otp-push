import React, {
  useRef,
  forwardRef,
  useImperativeHandle,
} from 'react';
import {
  Text,
  StyleSheet,
  View,
  Image,
} from 'react-native';
import {useTheme} from '@react-navigation/native';
import BottomSheet, {BottomSheetView} from '@gorhom/bottom-sheet';
import LottieView from 'lottie-react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const NfcBottomSheet = forwardRef((props, ref) => {
  const {colors} = useTheme();
  const bottomSheetRef = useRef(null);
  const [state, setState] = React.useState('closed'); // closed, waiting, success, error, start
  const [message, setMessage] = React.useState('');
  const snapPoints = ['50%'];

  useImperativeHandle(ref, () => ({
    open: () => {
      setState('start');
      bottomSheetRef.current?.expand();
    },
    setWaiting: () => {
      setState('waiting');
    },
    setSuccess: (msg) => {
      setState('success');
      setMessage(msg);
      setTimeout(() => bottomSheetRef.current?.close(), 3000);
    },
    setError: () => {
      setState('error');
      setTimeout(() => bottomSheetRef.current?.close(), 3500);
    },
    close: () => {
      setState('closed');
      bottomSheetRef.current?.close();
    },
  }));

  const renderContent = () => {
    const animationStyle = {};

    return (
      <View style={[styles.bottomSheetContent, {}]}>
        <View style={styles.sheetHeader}>
          <Text style={[styles.sheetTitle, {color: '#fff'}]}>
            Scannez votre carte NFC
          </Text>
          {state === 'success' && (
            <View style={styles.statusContainer}>
              <LottieView
                source={require('../assets/images/Animation-nfc-success.json')}
                style={styles.image}
                autoPlay
                loop
              />
              <Text style={[styles.statusText, {color: '#fff'}]}>
                {message}
              </Text>
            </View>
          )}
          {state === 'start' && (
            <View style={styles.statusContainer}>
              <LottieView
                source={require('../assets/images/Animation.json')}
                style={styles.image}
                autoPlay
                loop
              />
            </View>
          )}
          {state === 'waiting' && (
            <View style={styles.statusContainer}>
              <LottieView
                source={require('../assets/images/Animation-nfc-wait.json')}
                style={styles.image}
                autoPlay
                loop
              />
              <Text style={[styles.statusText, {color: '#fff'}]}>
                Traitement en cours… Gardez la carte posée sur le lecteur
              </Text>
            </View>
          )}
          {state === 'error' && (
            <View style={styles.statusContainer}>
              <LottieView
                source={require('../assets/images/Animation-nfc-error.json')}
                style={styles.image}
                autoPlay
                loop
              />
              <Text style={[styles.statusText, {color: '#fff'}]}>
              Carte invalide ou Méthode d'authentification non activée
              </Text>
            </View>
          )}
        </View>
        {state === 'start' && (
          <View style={styles.sheetBody}>
            <Text style={[styles.instructionText, {color: '#fff'}]}>
              Placez votre carte sous l'appareil.
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={state === 'closed' ? -1 : 0}
      snapPoints={snapPoints}
      backgroundStyle={{backgroundColor: colors.bottomSheet}}
      handleIndicatorStyle={{backgroundColor: '#fff'}}
      enablePanDownToClose={true}
      >
      <BottomSheetView style={styles.contentContainer}>
        {renderContent()}
      </BottomSheetView>
    </BottomSheet>
  );
});

const styles = StyleSheet.create({
  text: {
    fontSize: 20,
    textAlign: 'center',
    margin: 20,
  },
  contentContainer: {
    flex: 1,
    padding: 36,
    alignItems: 'center',
  },
  bottomSheetContent: {
    flex: 1,
    padding: 20,
  },
  sheetHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  statusContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  statusText: {
    fontSize: 16,
    marginTop: 5,
    textAlign: 'center',
  },
  sheetBody: {
    alignItems: 'center',
  },
  scanAnimation: {
    marginBottom: 20,
  },
  instructionText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  cancelButton: {
    padding: 10,
    borderRadius: 8,
    alignSelf: 'center',
  },
  cancelText: {
    color: '#fff',
    fontSize: 16,
  },
  image: {
    width: 230,
    height: 130,
  },
});

export default React.memo(NfcBottomSheet);

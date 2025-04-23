import {StyleSheet, Text, View, FlatList, TouchableOpacity, Alert} from 'react-native';
import React, {useState, useEffect} from 'react';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useTheme, useNavigation} from '@react-navigation/native';
import {CountdownCircleTimer} from 'react-native-countdown-circle-timer';
import {storage} from '../utils/storage';
import {Totp} from '../utils/totp';
import RenderTotp from '../components/RenderTotp';
import CustomActionSheet from '../components/CustomActionSheet';

// Methods
const getTotpObjects = () => {
  var totpObjects = storage.getString('totpObjects');
  return totpObjects ? JSON.parse(totpObjects) : null;
};
// Calculer le temps restant jusqu'à la prochaine tranche de 30 secondes
const getTimeToNextPeriod = () => {
  const now = Math.floor(Date.now() / 1000); // Temps UNIX en secondes
  const period = 30; // Durée d'une période TOTP (correspond à totp.options.step)
  const secondsElapsed = now % period;
  return period - secondsElapsed;
};

// Component
const TotpScreen = () => {
  const {colors} = useTheme();
  const [totpObjects, setTotpObjects] = useState(getTotpObjects());
  const [codes, setCodes] = useState({});
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);
  const navigation = useNavigation();

  // Générer et MAJ les codes TOTP pour toutes les clés secrètes
  useEffect(() => {
    const updateCodes = () => {
      const newCodes = {};
      Object.keys(totpObjects).forEach(secret => {
        newCodes[secret] = Totp.token(secret);
      });
      setCodes(newCodes);
    };
    updateCodes();

    const timeToNext = getTimeToNextPeriod() * 1000;
    const timeout = setTimeout(() => {
      updateCodes(); // Mise à jour à la prochaine tranche
    }, timeToNext);

    return () => clearTimeout(timeout);
  }, [totpObjects]);

  const handleScan = () => {
    navigation.navigate('QRCodeScanner', {
      onScan: (qrValue) => {
        try {
          const parsed = Totp.parseTotpUrl(qrValue);
          if (!parsed || !parsed.secret || !parsed.name) {
            throw new Error('QR code invalide pour TOTP');
          }
          console.log('📸 QR Code scanné:', parsed);
          const newTotpObjects = { ...totpObjects, [parsed.secret]: parsed.name };
          setTotpObjects(newTotpObjects);
          //Totp.setTotpObjects(newTotpObjects);
        } catch (error) {
          throw new Error(error.message || 'QR code invalide pour TOTP');
        }
      },
    });
  };
  const handleManualInput = () => {
    navigation.navigate('ManualTotp',{
      onPress: (newTotpObjects) => {
        setTotpObjects(newTotpObjects);
        console.log(newTotpObjects);
      },
    });
  };

  const onDelete = (secret) => {
    Alert.alert('Supprimer le code ?', 'Voulez-vous vraiment supprimer ce code ?', [
      {
        text: 'Annuler',
        style: 'cancel',
      },
      {
        text: 'Supprimer',
        onPress: () => {
          const newTotpObjects = { ...totpObjects };
          delete newTotpObjects[secret];
          setTotpObjects(newTotpObjects);
        },
      },
    ]);
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setIsActionSheetOpen(true)}>
          <Icon name="plus-circle" color={colors.primary} size={50} />
        </TouchableOpacity>
        <CountdownCircleTimer
          isPlaying={Object.keys(totpObjects).length > 0}
          duration={30}
          initialRemainingTime={getTimeToNextPeriod()}
          colors={[colors.primary]}
          trailColor="transparent"
          size={50}
          strokeWidth={5}
          onComplete={() => {
            // Met à jour les codes quand le timer atteint 0
            const newCodes = {};
            Object.keys(totpObjects).forEach(secret => {
              newCodes[secret] = Totp.token(secret);
            });
            setCodes(newCodes);
            return {shouldRepeat: true};
          }}>
          {({remainingTime}) => (
            <Text style={{color: colors.text, fontWeight: 'bold'}}>
              {remainingTime}
            </Text>
          )}
        </CountdownCircleTimer>
      </View>
      <View style={styles.content}>
        <FlatList 
          data={Object.entries(totpObjects)}
          renderItem={({item}) => (
            <RenderTotp 
            item={item} 
            code={codes[item[0]]} 
            onDelete={ () => onDelete(item[0]) }
            />
          )}
          keyExtractor={(item) => item[0]}
          ListEmptyComponent={<Text style={{color: colors.text}}>Aucun Totp configuré</Text>}
        />
        <CustomActionSheet 
          visible={isActionSheetOpen}
          onClose={() => setIsActionSheetOpen(false)}
          actions={[
            { label: 'Scanner QR code', onPress: handleScan },
            { label: 'Saisie manuelle', onPress: handleManualInput },
          ]}
        />
      </View>
    </View>
  );
};

export default TotpScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    rowGap: 50,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 8,
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
  },
});

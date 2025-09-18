import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import {useTheme} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {Swipeable, GestureHandlerRootView} from 'react-native-gesture-handler';
import {storage} from '../utils/storage';
import {desync, getName} from '../services/auth';
import {useOtpServersStore} from '../stores/useOtpServersStore';
import { getHelpByKey } from '../data/helpData';

const PushScreen = ({withoutAddButton}) => {
  const {colors} = useTheme();
  const otpServers = useOtpServersStore(state => state.otpServers);
  const setOtpServers = useOtpServersStore(state => state.setOtpServers);
  const removeOtpServer = useOtpServersStore(state => state.removeOtpServer);

  useEffect(() => {
    try {
      //storage.set('otpServers', JSON.stringify(otpServers));
      console.log('📱 otpServers persistés dans storage:', otpServers);
    } catch (e) {
      console.error('Erreur de sauvegarde dans storage:', e.message);
    }
  }, [otpServers]);

  const refreshScreen = () => {
    const updatedRaw = storage.getString('otpServers');
    const updated = updatedRaw ? JSON.parse(updatedRaw) : {};
    setOtpServers(updated);
  };

  const howToEnable = () => {
    const status = storage.getString('pushPermissionStatus');
    if (status === 'denied' || status === 'never_ask_again') {
      Alert.alert(
        'Autoriser les notifications PUSH',
        'Pour utiliser cette méthode, activez la fonctionnalité PUSH dans les réglages de votre appareil.',
        [,
          {text: 'Plus tard'},
          {
            text: 'Ouvrir les réglages',
            onPress: () => {
              if (Platform.OS === 'ios') {
                Linking.openURL('app-settings:');
              } else {
                Linking.openSettings();
              }
            },
          }
        ]
      );
      return;
    }
    const data = getHelpByKey('push');
    if (data) {
      Alert.alert(data.title, data.content)
    }
  }

  const handleDelete = async serverKey => {
    const confirm = await new Promise(resolve => {
      Alert.alert(
        'Supprimer serveur',
        'Êtes-vous sûr de vouloir supprimer ce serveur ?',
        [
          {text: 'Annuler', style: 'cancel', onPress: () => resolve(false)},
          {
            text: 'Supprimer',
            style: 'destructive',
            onPress: () => resolve(true),
          },
        ],
      );
    });
    if (!confirm) return;

    try {
      await desync(serverKey, otpServers, setOtpServers);
      console.log('📱 Serveur supprimé:', serverKey);
    } catch (e) {
      console.error('❌ Erreur suppression serveur:', e);
    }
  };

  const renderRightActions = serverKey => (
    <TouchableOpacity
      style={[styles.deleteButton, {backgroundColor: 'red'}]}
      onPress={() => handleDelete(serverKey)}>
      <Icon name="delete" size={24} color="#fff" />
    </TouchableOpacity>
  );

  const renderServerItem = ({item}) => {
    const server = otpServers[item.key];
    if (!server) return null;

    return (
      <Swipeable renderRightActions={() => renderRightActions(item.key)}>
        <View style={[styles.serverButton]}>
          <Text style={[styles.serverText, {color: colors.text}]}>
            {getName(item.key, otpServers) || 'Serveur sans nom'}
          </Text>
        </View>
      </Swipeable>
    );
  };

  const serverList = Object.keys(otpServers)
    .filter(key => {
      const s = otpServers[key];
      return s && s.host && s.uid;
    })
    .map(key => ({key}));

  return (
    <GestureHandlerRootView
      style={[styles.container, {backgroundColor: colors.background}]}>
      {!withoutAddButton && (
        <TouchableOpacity style={styles.header} onPress={howToEnable}>
          <Icon name="bell-badge-outline" color={colors.text} size={30} />
          <Text style={[styles.cardTitle, {color: colors.text}]}>PUSH</Text>
        </TouchableOpacity>
      )}
      <View style={styles.content}>
        <FlatList
          data={serverList}
          renderItem={renderServerItem}
          keyExtractor={item => item.key}
          ListEmptyComponent={
            <Text style={{color: colors.text, fontSize:14, marginTop: 15}}>
              Aucun serveur PUSH configuré
            </Text>
          }
          ItemSeparatorComponent={() => (
            <View style={[styles.separator, {borderColor: 'grey'}]} />
          )}
        />
      </View>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, padding: 20},
  card: {borderRadius: 8, padding: 10, marginTop: 20},
  cardTitle: {fontSize: 18, fontWeight: 'bold'},
  serverButton: {padding: 8, marginVertical: 2, marginHorizontal: 5},
  serverText: {fontSize: 16},
  deleteButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 60,
    borderRadius: 8,
  },
  emptyText: {fontSize: 16, textAlign: 'center', marginTop: 20},
  header: {flexDirection: 'row', alignItems: 'center', gap: 10},
  content: {display: 'flex', flexDirection: 'column'},
  separator: {
    borderWidth: 1,
    borderRadius: 1,
    marginLeft: 12,
    marginRight: 70,
    borderStyle: 'dotted',
  },
});

export default PushScreen;

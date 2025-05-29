import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {useTheme, useNavigation} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {Swipeable, GestureHandlerRootView} from 'react-native-gesture-handler';
import {storage} from '../utils/storage';
import {desync, getName, showToast, sync} from '../services/auth';
import {getManufacturer, getModel} from 'react-native-device-info';
import CustomActionSheet from '../components/CustomActionSheet';
import {useOtpServersStore} from '../stores/useOtpServersStore';

const PushScreen = ({withoutAddButton}) => {
  const {colors} = useTheme();
  const navigation = useNavigation();
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);

  const otpServers = useOtpServersStore(state => state.otpServers);
  const setOtpServers = useOtpServersStore(state => state.setOtpServers);
  const removeOtpServer = useOtpServersStore(state => state.removeOtpServer);

  useEffect(() => {
    try {
      storage.set('otpServers', JSON.stringify(otpServers));
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

  const handleScan = () => {
    navigation.navigate('QRCodeScanner', {
      onScan: async url => {
        try {
          console.log('📱 Scan QR code **** PUSH', url);
          const urlParts = url.split('/');
          const host = url.split('users')[0];
          const uid = urlParts[4];
          const code = urlParts[7];
          const manufacturer = await getManufacturer();
          const model = getModel();
          const gcmId = storage.getString('gcm_id') || '';

          const result = await sync(
            host,
            uid,
            code,
            gcmId,
            manufacturer,
            model,
          );
          if (result.success) {
            console.log('📱 Sync réussi ✅', result.data);
            showToast('QR code synchronisé');
            refreshScreen();
          } else {
            console.warn('📱 Échec sync ❌', result.message);
            showToast('Erreur de synchronisation');
          }
        } catch (e) {
          console.error('📱 Erreur traitement QR:', e.message);
          showToast('Erreur QR code');
        }
      },
    });
  };

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

  const handleManualInput = () => {
    navigation.navigate('ManualPush', {
      onPress: async ({host, uid, code}) => {
        const manufacturer = await getManufacturer();
        const model = getModel();
        const gcmId = storage.getString('gcm_id') || '';
        const result = await sync(host, uid, code, gcmId, manufacturer, model);

        if (result.success) {
          console.log('📱 Sync réussi ✅', result.data);
          showToast('Synchronisation effectuée');
          refreshScreen();
        }
      },
    });
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
          <Text style={styles.serverText}>
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
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setIsActionSheetOpen(true)}>
            <Icon name="plus-circle" size={50} color={colors.primary} />
          </TouchableOpacity>
          <Text style={[styles.cardTitle, {color: colors.text}]}>PUSH</Text>
        </View>
      )}
      <View style={styles.content}>
        <FlatList
          data={serverList}
          renderItem={renderServerItem}
          keyExtractor={item => item.key}
          ListEmptyComponent={
            <Text style={{color: colors.text}}>
              Aucun serveur push configuré
            </Text>
          }
          ItemSeparatorComponent={() => (
            <View style={[styles.separator, {borderColor: 'grey'}]} />
          )}
        />
      </View>
      <CustomActionSheet
        visible={isActionSheetOpen}
        onClose={() => setIsActionSheetOpen(false)}
        actions={[
          {label: 'Scanner QR code', onPress: handleScan},
          {label: 'Saisie manuelle', onPress: handleManualInput},
        ]}
      />
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, padding: 20},
  card: {borderRadius: 8, padding: 10, marginTop: 20},
  cardTitle: {fontSize: 18, fontWeight: 'bold'},
  serverButton: {padding: 8, marginVertical: 2, marginHorizontal: 5},
  serverText: {fontSize: 16, color: '#fff'},
  deleteButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 60,
    borderRadius: 8,
  },
  emptyText: {fontSize: 16, textAlign: 'center', marginTop: 20},
  header: {flexDirection: 'row', alignItems: 'center', gap: 10},
  content: {display: 'flex', flexDirection: 'column'},
});

export default PushScreen;

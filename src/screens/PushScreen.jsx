import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {useNavigation, useTheme} from '@react-navigation/native';
import {Swipeable, GestureHandlerRootView} from 'react-native-gesture-handler';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'; // Ajustez selon votre bibliothèque
import {storage} from '../utils/storage';
import {desync, getName, showToast, sync} from '../services/auth';
import CustomActionSheet from '../components/CustomActionSheet';
import {getManufacturer, getModel} from 'react-native-device-info';
import useNotifications from '../hooks/useNotifications';

const PushScreen = ({withoutAddButton}) => {
  const {colors} = useTheme();
  const navigation = useNavigation();
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);
  const {otpServersObjects, setOtpServersObjects} = useNotifications();

  useEffect(() => {
    try {
      storage.set('otpServers', JSON.stringify(otpServersObjects));
      console.log(
        '📱 otpServersObjects mis à jour dans storage:',
        JSON.stringify(otpServersObjects),
      );
    } catch (error) {
      console.error(
        '📱 Erreur lors de la mise à jour de storage:',
        error.message,
      );
    }
  }, [otpServersObjects]);

  const refreshScreen = async () => {
    const updatedRaw = storage.getString('otpServers');
    const updated = updatedRaw ? JSON.parse(updatedRaw) : {};
    setOtpServersObjects(updated);
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

          // Récupérer infos device (plateforme, fabricant, modèle)
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

            // 🔄 Rafraîchir otpServersObjects depuis storage
            refreshScreen();
          } else {
            console.warn('📱 Échec sync ❌', result.message);
            showToast('Erreur de synchronisation');
          }
        } catch (error) {
          console.error('📱 Erreur pendant le scan + sync', error.message);
          showToast('Échec du traitement du QR code');
        }
      },
    });
  };

  const handleDelete = async serverKey => {
    try {
      await desync(serverKey, otpServersObjects, setOtpServersObjects);
      const updatedServers = {...otpServersObjects};
      delete updatedServers[serverKey];
      setOtpServersObjects(updatedServers);
      console.log('📱 Serveur supprimé:', serverKey);
    } catch (error) {
      console.error('❌ Erreur suppression serveur', error);
    }
  };

  const handleManualInput = () => {
    navigation.navigate('ManualPush', {
      onPress: async ({host, uid, code}) => {
        const manufacturer = await getManufacturer();
        const model = getModel();
        const gcmId = storage.getString('gcm_id') || '';
        const result = sync(host, uid, code, gcmId, manufacturer, model);

        if (result.success) {
          console.log('📱 Sync réussi ✅', result.data);
          showToast('Synchronisation effectuée');

          // 🔄 Rafraîchir otpServersObjects depuis storage
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
    const server = otpServersObjects[item.key];
    if (!server || typeof server !== 'object') {
      console.warn('📱 Serveur introuvable ou invalide pour la clé:', item.key);
      return null;
    }
    return (
      <Swipeable renderRightActions={() => renderRightActions(item.key)}>
        <TouchableOpacity
          style={[styles.serverButton, {backgroundColor: colors.secondary}]}
          onPress={() => console.log('📱 Clic sur serveur:', item.key)} // Placeholder, ajoutez une action si besoin
        >
          <Text style={styles.serverText}>
            {getName(item.key, otpServersObjects) || 'Serveur sans nom'}
          </Text>
        </TouchableOpacity>
      </Swipeable>
    );
  };

  const serverList = Object.keys(otpServersObjects)
    .filter(key => {
      const isValid =
        otpServersObjects[key] &&
        typeof otpServersObjects[key] === 'object' &&
        otpServersObjects[key].host &&
        otpServersObjects[key].uid;
      if (!isValid) {
        console.warn(
          '📱 Clé ignorée, serveur invalide:',
          key,
          JSON.stringify(otpServersObjects[key]),
        );
      }
      return isValid;
    })
    .map(key => ({
      key,
      name: getName(key, otpServersObjects) || 'Serveur sans nom',
    }));

  return (
    <GestureHandlerRootView
      style={[styles.container, {backgroundColor: colors.background}]}>
      {!withoutAddButton && (
        <TouchableOpacity onPress={() => setIsActionSheetOpen(true)}>
          <Icon name="plus-circle" color={colors.primary} size={50} />
        </TouchableOpacity>
      )}
      <View style={styles.card}>
        <Text style={[styles.cardTitle, {color: colors.text}]}>
          Push mobile
        </Text>
        {serverList.length === 0 ? (
          <Text style={[styles.emptyText, {color: colors.text}]}>
            Aucun serveur push configuré. Ajoutez un serveur pour recevoir des
            notifications.
          </Text>
        ) : (
          <FlatList
            data={serverList}
            renderItem={renderServerItem}
            keyExtractor={item => item.key}
            extraData={otpServersObjects}
          />
        )}
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
  container: {
    flex: 1,
    padding: 20,
  },
  card: {
    borderRadius: 8,
    padding: 10,
    marginTop: 20,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  serverButton: {
    padding: 15,
    borderRadius: 8,
    marginVertical: 5,
  },
  serverText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#fff',
  },
  deleteButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 60,
    borderRadius: 8,
    marginVertical: 5,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
});

export default PushScreen;

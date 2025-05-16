import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { Swipeable, GestureHandlerRootView } from 'react-native-gesture-handler';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'; // Ajustez selon votre bibliothèque
import { storage } from '../utils/storage';
import { getName } from '../services/auth';

const PushScreen = () => {
  const { colors } = useTheme();
  const [otpServersObjects, setOtpServersObjects] = useState(() => {
    try {
      const servers = storage.getString('otpServers') ? JSON.parse(storage.getString('otpServers')) : {};
      console.log('📱 otpServersObjects chargé:', JSON.stringify(servers));
      return servers;
    } catch (error) {
      console.error('📱 Erreur lors du chargement de otpServers:', error.message);
      return {};
    }
  });

  useEffect(() => {
    try {
      storage.set('otpServers', JSON.stringify(otpServersObjects));
      console.log('📱 otpServersObjects mis à jour dans storage:', JSON.stringify(otpServersObjects));
    } catch (error) {
      console.error('📱 Erreur lors de la mise à jour de storage:', error.message);
    }
  }, [otpServersObjects]);

  const handleDelete = (serverKey) => {
    const server = otpServersObjects[serverKey];
    Alert.alert(
      'Supprimer le serveur',
      `Voulez-vous vraiment supprimer ${server ? getName(serverKey, otpServersObjects) : 'ce serveur'} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            const updatedServers = { ...otpServersObjects };
            delete updatedServers[serverKey];
            setOtpServersObjects(updatedServers);
            console.log('📱 Serveur supprimé:', serverKey);
          },
        },
      ]
    );
  };

  const renderRightActions = (serverKey) => (
    <TouchableOpacity
      style={[styles.deleteButton, { backgroundColor: 'red' }]}
      onPress={() => handleDelete(serverKey)}
    >
      <Icon name="delete" size={24} color="#fff" />
    </TouchableOpacity>
  );

  const renderServerItem = ({ item }) => {
    const server = otpServersObjects[item.key];
    if (!server || typeof server !== 'object') {
      console.warn('📱 Serveur introuvable ou invalide pour la clé:', item.key);
      return null;
    }
    return (
      <Swipeable renderRightActions={() => renderRightActions(item.key)}>
        <TouchableOpacity
          style={[styles.serverButton, { backgroundColor: colors.secondary }]}
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
    .filter((key) => {
      const isValid = otpServersObjects[key] && typeof otpServersObjects[key] === 'object' && otpServersObjects[key].host && otpServersObjects[key].uid;
      if (!isValid) {
        console.warn('📱 Clé ignorée, serveur invalide:', key, JSON.stringify(otpServersObjects[key]));
      }
      return isValid;
    })
    .map((key) => ({
      key,
      name: getName(key, otpServersObjects) || 'Serveur sans nom',
    }));

  return (
    <GestureHandlerRootView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.card}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>
          Serveurs Push Configurés
        </Text>
        {serverList.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.text }]}>
            Aucun serveur push configuré. Ajoutez un serveur pour recevoir des notifications.
          </Text>
        ) : (
          <FlatList
            data={serverList}
            renderItem={renderServerItem}
            keyExtractor={(item) => item.key}
            extraData={otpServersObjects}
          />
        )}
      </View>
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
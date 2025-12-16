import React, {use, useEffect, useMemo, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import { getSyncStatus } from '../utils/getSyncStatus';
import { getDomainFromBaseUrl, syncHandlers } from '../services/browserService';
import { ScrollView } from 'react-native-gesture-handler';
import { allManagers } from '../data/managerData';
import { browserManager } from '../stores/useBrowserStore';

// Exemple de données (remplace par ta réponse API)
const SAMPLE = {
  code: 'Ok',
  user: {
    methods: {
      codeRequired: true,
      waitingFor: true,
      totp: {active: true, message: '', qrCode: '', transports: []},
      webauthn: {active: false, transports: []},
      random_code: {active: false, transports: ['sms']},
      random_code_mail: {active: false, transports: ['mail']},
      bypass: {
        active: false,
        codes: [],
        available_code: 0,
        used_code: 0,
        transports: [],
      },
      passcode_grid: {active: false, transports: []},
      push: {
        device: {
          platform: 'Android',
          manufacturer: 'Samsung',
          model: 'Galaxy A40',
          canReceiveNotifications: true,
        },
        activationCode: '',
        api_url: '',
        qrCode: '',
        active: true,
        transports: ['push'],
      },
      esupnfc: {active: true, transports: []},
    },
    transports: {push: 'Samsung Galaxy A40'},
    last_send_message: {
      method: 'push',
      time: 1759845073506,
      auto: true,
      verified: true,
    },
    last_validated: {method: 'esupnfc', time: 1760610018842},
    has_enabled_method: true,
  },
};

// helpers: label, icon, color by method key
const METHOD_META = {
  totp: {label: 'TOTP', icon: 'pin', color: '#1AAA55'},
  esupnfc: {label: 'Carte NFC', icon: 'cellphone-nfc', color: '#00BCD4'},
  push: {label: 'Notification Push', icon: 'bell-badge-outline', color: '#2B86FF'},
  webauthn: {label: 'WebAuthn', icon: 'usb', color: '#8E5CF8'},
  random_code: {
    label: 'Code par SMS',
    icon: 'message-text-outline',
    color: '#FF9800',
  },
  random_code_mail: {
    label: 'Code par e-mail',
    icon: 'email-outline',
    color: '#FF9800',
  },
  bypass: {label: 'Codes de secours', icon: 'key-variant', color: '#9E9E9E'},
  passcode_grid: {label: 'Passcode grid', icon: 'grid', color: '#9E9E9E'},
};

function formatDate(ts) {
  if (!ts) return null;
  const d = new Date(Number(ts));
  return d.toLocaleString(); // simple localized format
}

function getMetaFor(key) {
  return (
    METHOD_META[key] || {
      label: key,
      icon: 'shield-outline',
      color: '#777',
    }
  );
}

function MethodCard({id, data, lastValidated, transports, syncStatus}) {
  console.log('[MethodCard] data:', data);
  const meta = getMetaFor(id);
  const active = !!data?.active;
  const deviceLabel =
    (transports?.[id] ||
    (data?.device && `${data.device.manufacturer } ${data.device.model}`)) == 'null null' && null;

  // Statut de synchronisation
  const status = syncStatus?.[id];
  const statusType = typeof status === 'object' ? status.status : status;
  const remoteLabel = typeof status === 'object' && status.label ? status.label : null;

  // Couleurs des pills
  let pillBg = '#FDEDEE';
  let pillColor = '#D32F2F';
  let pillText = 'Désactivée';
  let pillAction = null;

  // === GESTION DES ÉTATS ===
  if (active) {
    switch (statusType) {
      case 'local':
        pillBg = '#E8F7EE';
        pillColor = '#117A3A';
        pillText = 'Activée';
        pillAction = () => {
          Alert.alert(
            'Information',
            'Cette méthode est déjà activée sur cet appareil.',
            [{text: 'OK', style: 'cancel'}],
          )
        };
        break;

      case 'remote':
        pillBg = '#FFF3E0';
        pillColor = '#E65100';
        pillText = 'Transférer';
        pillAction = () => {
          Alert.alert(
            'Synchronisation',
            `${id != 'esupnfc' ? 'Cette opération désactivera la méthode sur tous les autres appareils. Voulez-vous continuer ?' : 'Êtes-vous sûr de vouloir transférer cette méthode sur cet appareil ?'}`,
            [
              {text: 'Annuler', style: 'cancel'},
              {
                text: 'Transférer',
                onPress: () => {
                  syncHandlers[id]?.();
                  console.log(`🔁 Sync requested for ${id}`);
                },
              },
            ],
          )
        };
        break;

      default:
        pillBg = '#FDEDEE';
        pillColor = '#D32F2F';
        pillText = 'Désactivée';
    }
  } else {
    // === CAS MÉTHODE DÉSACTIVÉE (AUCUNE INSTANCE ACTIVE) ===
    pillBg = '#FDEDEE';
    pillColor = '#D32F2F';
    pillText = 'Désactivée';
    pillAction = () => {
      Alert.alert(
        'Activation',
        'Souhaitez-vous activer cette méthode sur cet appareil ?',
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Activer',
            onPress: () => {
              syncHandlers[id]?.();
              console.log(`⚙️ Activation demandée pour ${id}`);
            },
          },
        ],
      );
    };
  }

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      style={styles.card}
      onPress={pillAction}
      disabled={!pillAction}
    >
      <View style={[styles.cardIconWrap, {backgroundColor: meta.color}]}>
        {meta.label == 'TOTP' ? (
          <MaterialIcon name={meta.icon} size={22} color="white" />
        ) : (
          <Icon name={meta.icon} size={22} color="white" />
        )}
      </View>

      <View style={styles.cardBody}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{meta.label}</Text>

          <View style={[styles.pill, {backgroundColor: pillBg}]}>
            <Text style={[styles.pillText, {color: pillColor}]}>{pillText}</Text>
          </View>
        </View>

        {/* Sous-texte : appareil / autre appareil */}
        {statusType === 'remote' && remoteLabel ? (
          <Text style={[styles.cardSub, { color: '#E65100' }]}>
            Activée sur un autre appareil {remoteLabel === 'other' ? '' : ': ' + remoteLabel}
          </Text>
        ) : deviceLabel ? (
          <Text style={styles.cardSub}>{deviceLabel}</Text>
        ) : null}

        {lastValidated?.method === id ? (
          <Text style={styles.cardLast}>
            Dernière validation : {formatDate(lastValidated.time)}
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

export const ManagerChooser = () => {
  const [search, setSearch] = useState('');

  const filteredManagers = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (!q) return allManagers;

    return allManagers.filter(manager =>
      manager.name.toLowerCase().includes(q)
    );
  }, [search]);

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Choisissez votre établissement</Text>
      <Text style={[styles.subtitle, {marginBottom: 20, fontSize: 16}]}>
        Si votre établissement n’apparaît pas, cela signifie qu’il ne propose pas la fonction d’activation rapide. Veuillez utiliser une autre méthode : Scanner QR code ou Saisie manuelle
      </Text>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{flex: 1}} 
        keyboardVerticalOffset={60}>
        {/* 🔍 Champ de recherche */}
      <View style={styles.searchContainer}>
        <Icon name="magnify" size={22} color="#284758" />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Rechercher un établissement"
          placeholderTextColor="#284758"
          style={styles.searchInput}
          autoCorrect={false}
          autoCapitalize="none"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Icon name="close-circle" size={18} color="#888" />
          </TouchableOpacity>
        )}
      </View>
            {/* 📋 Résultats */}
      {filteredManagers.length === 0 ? (
        <Text style={styles.emptyText}>
          Aucun établissement trouvé
        </Text>
      ) : (
        filteredManagers.map((manager, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.card, {backgroundColor: '#284758'}]}
            onPress={() => {
              browserManager.setUrl(manager.url);
              browserManager.show();
            }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                flex: 1,
              }}>
              <Text style={{fontSize: 18, color: '#FFF'}}>
                {manager.name}
              </Text>
              <Icon name="arrow-right-thin" size={24} color="#FFF" />
            </View>
          </TouchableOpacity>
        ))
      )}
      </KeyboardAvoidingView>
    </ScrollView>
  )
};

export default function MethodsScreen({user, bottomSheetRef}) {
  console.log('[MethodsScreen] user:', user);
  const methods = user?.methods || {};
  const lastValidated = user?.last_validated;
  const transports = user?.transports || {};
  const syncStatus = getSyncStatus(methods);
  const isPushNotEnabled = syncStatus['push'] === 'none';
  const [showPushActivation, setShowPushActivation] = useState(isPushNotEnabled);
  console.log('[MethodsScreen] syncStatus:', syncStatus);
  console.log('[MethodsScreen] isPushNotEnabled:', isPushNotEnabled);

  // Tableau de données pour la liste des méthodes. retourne {active: [], inactive: []}
  const flatList = useMemo(() => {
  const allowedMethods = ['push', 'totp', 'esupnfc'];

  const items = Object.entries(methods)
    .filter(([key]) => allowedMethods.includes(key))
    .map(([key, data]) => ({ key, data }));

  // On sépare les actives et inactives
  const active = items.filter(i => i.data?.active);
  const inactive = items.filter(i => !i.data?.active);

  // Fusionner dans l’ordre voulu
  const allMethods = allowedMethods
    .map(methodKey =>
      [...active, ...inactive].find(item => item.key === methodKey)
    )
    .filter(Boolean); // enlève les "undefined"

  return { active, inactive, allMethods };
}, [methods]);

  const activeCount = flatList.active.length;

  useEffect(() => {
    setShowPushActivation(isPushNotEnabled);
  }, [isPushNotEnabled]);

  return (
    <ScrollView style={styles.screen}>
      <View style={styles.screen}>
        { showPushActivation ?
            <View style={styles.pushContainer}>
              <Text style={styles.title}>Activation Push</Text>
              <Text style={styles.subtitle}>
                {getDomainFromBaseUrl()}
              </Text>
              <Text style={{marginTop: 20, fontSize: 22}}>Voulez-vous activer l'authentification mobile sur ce téléphone ?</Text>
              <View style={{flexDirection: 'row', marginTop: 20, gap: 10}}>
                <TouchableOpacity 
                  onPress={() => {syncHandlers['push'](); bottomSheetRef.current?.close();}}
                  style={[styles.actionButton, {backgroundColor: '#1AAA55'}]}
                >
                  <Text style={{fontSize: 22, color: '#FFF'}}>Oui</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => setShowPushActivation(false)}
                  style={[styles.actionButton, {backgroundColor: '#E65100'}]}
                >
                  <Text style={{fontSize: 22, color: '#FFF'}}>Non</Text>
                </TouchableOpacity>
              </View>
            </View>
            : 
            <View style={styles.container}>
              <Text style={styles.title}>Méthodes d’authentification</Text>
              <Text style={styles.subtitle}>
                {getDomainFromBaseUrl()}
              </Text>

              {/* <Text style={styles.sectionTitle}>Vos méthodes disponibles</Text> */}
              {
                flatList.allMethods.length > 0 ? (
                  flatList.allMethods.map(item => {
                  return (
                    <MethodCard
                      key={item.key}
                      id={item.key}
                      data={item.data}
                      lastValidated={lastValidated}
                      transports={transports}
                      syncStatus={syncStatus}
                    />
                  )
                })
                ) : <Text style={styles.empty}>Aucune méthode disponible</Text>
              }

              <View style={styles.summary}>
                <View style={styles.summaryRow}>
                  <Icon name="check-circle" size={18} color="#1AAA55" />
                  <Text style={styles.summaryText}>
                    {activeCount} méthodes activées
                  </Text>
                </View>
                {lastValidated?.method ? (
                  <View style={[styles.summaryRow, {marginTop: 8}]}>
                    <Icon name="clock-outline" size={16} color="#666" />
                    <Text style={styles.summaryTextSmall}>
                      Dernière validation :{' '}
                      {lastValidated.method.toUpperCase()} (
                      {formatDate(lastValidated.time)})
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>
        }
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: '#F6F8FA'},
  container: {paddingHorizontal: 18, paddingTop: 14, flex: 1},
  title: {fontSize: 26, fontWeight: '700', color: '#0E1116'},
  subtitle: {color: '#6B7280', marginTop: 6, marginBottom: 12},

  summary: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    marginTop: 20,
    borderWidth: 0.3,
    borderColor: '#ddd',
  },
  summaryRow: {flexDirection: 'row', alignItems: 'center', gap: 8},
  summaryText: {fontSize: 15, color: '#111'},
  summaryTextSmall: {fontSize: 13, color: '#666'},

  sectionTitle: {
    marginTop: 6,
    marginBottom: 8,
    color: '#374151',
    fontWeight: '600',
  },

  card: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
    marginVertical: 8,
    alignItems: 'center',
    borderWidth: 0.3,
    borderColor: '#ddd',
  },
  cardIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardBody: {flex: 1},
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {fontSize: 16, fontWeight: '700', color: '#111'},
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillText: {fontSize: 13, fontWeight: '700'},
  cardSub: {color: '#6B7280', marginTop: 6},
  cardLast: {color: '#9CA3AF', marginTop: 6, fontSize: 12},
  empty: {textAlign: 'center', color: '#9CA3AF', marginTop: 16, marginBottom: 10},
  pushContainer: {flex: 1, justifyContent: 'center', paddingHorizontal: 18, paddingVertical: 14},
  actionButton: {flex: 1, paddingHorizontal: 5, paddingVertical: 7, borderRadius: 10, justifyContent: 'center', alignItems: 'center'},
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dde7edff',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 20,
    gap: 8,
},

searchInput: {
  flex: 1,
  color: '#284758',
  fontSize: 16,
},

emptyText: {
  color: '#AAA',
  textAlign: 'center',
  marginTop: 20,
  fontSize: 16,
},
});

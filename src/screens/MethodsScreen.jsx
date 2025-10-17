import React, {useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

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
  totp: {label: 'TOTP', icon: 'shield-key-outline', color: '#1AAA55'},
  esupnfc: {label: 'Carte NFC (EsupNFC)', icon: 'nfc', color: '#00BCD4'},
  push: {label: 'Notification Push', icon: 'cellphone', color: '#2B86FF'},
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

function MethodCard({id, data, lastValidated, transports}) {
  const meta = getMetaFor(id);
  const active = !!data?.active;
  const statusColor = active ? '#117A3A' : '#D32F2F';
  const deviceLabel =
    transports?.[id] ||
    (data?.device && `${data.device.manufacturer} ${data.device.model}`);

  return (
    <TouchableOpacity activeOpacity={0.85} style={styles.card}>
      <View style={[styles.cardIconWrap, {backgroundColor: meta.color}]}>
        <Icon name={meta.icon} size={22} color="white" />
      </View>

      <View style={styles.cardBody}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{meta.label}</Text>
          <View
            style={[
              styles.pill,
              {backgroundColor: active ? '#E8F7EE' : '#FDEDEE'},
            ]}>
            <Text
              style={[
                styles.pillText,
                {color: active ? '#117A3A' : '#D32F2F'},
              ]}>
              {active ? 'Activée' : 'Désactivée'}
            </Text>
          </View>
        </View>

        {deviceLabel ? <Text style={styles.cardSub}>{deviceLabel}</Text> : null}

        {lastValidated?.method === id ? (
          <Text style={styles.cardLast}>
            Dernière validation : {formatDate(lastValidated.time)}
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

export default function MethodsScreen({user}) {
  console.log('[MethodsScreen] user:', user);
  const methods = user?.methods || {};
  const lastValidated = user?.last_validated;
  const transports = user?.transports || {};

  // create arrays for active and inactive (so we can show “Vos méthodes actives” / “Autres”)
  const flatList = useMemo(() => {
    const keys = Object.keys(methods).filter(
      k => !['codeRequired', 'waitingFor'].includes(k),
    );
    const items = keys.map(k => ({key: k, data: methods[k]}));
    const active = items.filter(i => i.data?.active);
    const inactive = items.filter(i => !i.data?.active);
    return {active, inactive};
  }, [methods]);

  const activeCount = flatList.active.length;

  return (
    <FlatList
      ListHeaderComponent={
        <View style={styles.screen}>
          <View style={styles.container}>
            <Text style={styles.title}>Méthodes d’authentification</Text>
            <Text style={styles.subtitle}>
              Gérez vos moyens d’accès sécurisés
            </Text>

            <View style={styles.summary}>
              <View style={styles.summaryRow}>
                <Icon name="check-circle" size={18} color="#1AAA55" />
                <Text style={styles.summaryText}>
                  {' '}
                  {activeCount} méthodes activées
                </Text>
              </View>
              {lastValidated?.method ? (
                <View style={[styles.summaryRow, {marginTop: 8}]}>
                  <Icon name="clock-outline" size={16} color="#666" />
                  <Text style={styles.summaryTextSmall}>
                    {'  '}Dernière validation :{' '}
                    {lastValidated.method.toUpperCase()} (
                    {formatDate(lastValidated.time)})
                  </Text>
                </View>
              ) : null}
            </View>

            <Text style={styles.sectionTitle}>Vos méthodes actives</Text>
            <FlatList
              data={flatList.active}
              keyExtractor={i => i.key}
              renderItem={({item}) => (
                <MethodCard
                  id={item.key}
                  data={item.data}
                  lastValidated={lastValidated}
                  transports={transports}
                />
              )}
              ListEmptyComponent={
                <Text style={styles.empty}>Aucune méthode active</Text>
              }
              contentContainerStyle={{paddingBottom: 10}}
            />

            <Text style={[styles.sectionTitle, {marginTop: 10}]}>
              Autres méthodes disponibles
            </Text>
            <FlatList
              data={flatList.inactive}
              keyExtractor={i => i.key}
              renderItem={({item}) => (
                <MethodCard
                  id={item.key}
                  data={item.data}
                  lastValidated={lastValidated}
                  transports={transports}
                />
              )}
              ListEmptyComponent={
                <Text style={styles.empty}>
                  Toutes les méthodes sont activées
                </Text>
              }
              contentContainerStyle={{paddingBottom: 40}}
            />
          </View>
        </View>
      }
    />
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
    borderWidth: 0.3,
    borderColor: '#ddd',
  },
  summaryRow: {flexDirection: 'row', alignItems: 'center'},
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
  empty: {textAlign: 'center', color: '#9CA3AF', marginTop: 16},
});

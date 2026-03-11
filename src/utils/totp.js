import {TOTP} from 'totp-generator';
import Crypto from 'react-native-quick-crypto';
import base64 from 'react-native-base64'

export const Totp = {
  token: secret => {
    try {
      const {otp} = TOTP.generate(secret, {
        digits: 6,
        algorithm: 'SHA-1',
        period: 30,
      });
      console.log(`TOTP généré pour ${secret}: ${otp}`); // Pour déboguer
      return otp;
    } catch (error) {
      console.error('Erreur lors de la génération du TOTP:', error);
      return null;
    }
  },
  isValid: (token, secret) => {
    try {
      const {otp} = TOTP.generate(secret, {
        digits: 6,
        algorithm: 'SHA-1',
        period: 30,
      });
      return token === otp;
    } catch (error) {
      console.error('Erreur lors de la validation du TOTP:', error);
      return false;
    }
  },
  formatCode: code => {
    if (!code) return 'N/A';
    return code.replace(/(\d{3})(\d{3})/, '$1 $2'); // Formater le code TOTP (ex. "123456" → "123 456")
  },
  parseTotpUrl: url => {
    try {
      console.log('URL scannée:', url); // Log pour déboguer

      // Vérifier si c'est une URL TOTP
      if (!url.startsWith('otpauth://totp/')) {
        throw new Error('URL non TOTP');
      }

      // Séparer path et query
      const [path, query] = url.split('?');

      // Parser query params manuellement
      let secret = '';
      if (query) {
        const params = query.split('&').reduce((acc, param) => {
          const [key, value] = param.split('=');
          acc[key] = value;
          return acc;
        }, {});
        secret = params.secret || '';
      }

      if (!secret) {
        throw new Error('Secret manquant');
      }

      // Valider Base32
      if (!/^[A-Z2-7]+=*$/.test(secret)) {
        throw new Error('Secret invalide (pas Base32)');
      }

      // Extraire name
      let name = path.replace('otpauth://totp/', '');
      name = decodeURIComponent(name.replace(/\/+/g, '')); // Supprime les /
      if (!name) {
        throw new Error('Nom manquant');
      }

      // Gérer Issuer:Name
      /*if (name.includes(':')) {
          name = name.split(':').pop().trim();
        }*/

      console.log('Parsed:', {secret, name}); // Log résultat

      return {secret, name};
    } catch (error) {
      console.error('Erreur de parsing:', error);
      Alert.alert('Erreur', 'QR code invalide pour TOTP.');
      return null;
    }
  },
  hashTotpSecret: (base32Secret, uid) => {
    //JE suis entré ici
    console.log('base32Secret:', base32Secret);
    console.log('uid:', uid);
    if (!base32Secret || !uid) return null;
    const subStr = base32Secret.substring(0, 20);
    const toHash = subStr + uid;

    try {
      // SHA-256
      const hashBuffer = Crypto.createHash('sha256')
        .update(toHash)
        .digest(); // retourne Uint8Array ou Buffer

      // Convertir le buffer en chaîne binaire (string) compatible pour base64
      const binaryString = String.fromCharCode(...new Uint8Array(hashBuffer));

      // Encoder en Base64
      const b64 = base64.encode(binaryString);

      // Transformer en Base64URL (remplacer +, / et supprimer = à la fin)
      const base64url = b64
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      return base64url;
    } catch (error) {
      console.error('[hashTotpSecret] Erreur durant le hachage ou l’encodage :', error);
      return null;
    }
  },
  hasMatchingTotp: (totpObjects, uid, serverHash) => {
    if (!serverHash) return false;
    return Object.keys(totpObjects).some(secret => {
      const computed = Totp.hashTotpSecret(secret, uid);
      return computed === serverHash;
    });
  }
};

export default Totp;

import axios from 'axios';

const BASE_URL = 'https://esup-otp-manager-test.univ-paris1.fr';

export async function fetchUserInfo() {
  try {
    const response = await axios.get(`${BASE_URL}/api/user`, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      withCredentials: true, // parfois utile sur iOS
    });

    console.log('✅ Données utilisateur reçues:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Erreur récupération user info:', error.message);
    throw error;
  }
}

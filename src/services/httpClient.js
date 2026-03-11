import axios from "axios";
import DeviceInfo from "react-native-device-info";

const httpClient = axios.create({
  withCredentials: true,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le User-Agent
httpClient.interceptors.request.use(
  (config) => {
    const baseUA = DeviceInfo.getUserAgentSync();
    const appVersion = DeviceInfo.getVersion();
    config.headers['User-Agent'] = `${baseUA} Esup Auth/${appVersion}`;
    console.log('[httpClient] User-Agent ajouté:', config.headers['User-Agent']);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

export default httpClient;
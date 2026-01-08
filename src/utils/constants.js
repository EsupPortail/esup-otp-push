import DeviceInfo from "react-native-device-info";

const APP_VERSION = DeviceInfo.getVersion();
export const ESUP_UA_SUFFIX = `Esup Auth/${APP_VERSION}`;
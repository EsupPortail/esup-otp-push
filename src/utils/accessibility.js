import { AccessibilityInfo } from "react-native";

export const announce = (message) => {
  if (!message) return;

  AccessibilityInfo.announceForAccessibility(message);
};
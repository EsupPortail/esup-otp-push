import React, {useEffect, useMemo, useRef} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Platform,
} from 'react-native';
import BottomSheet, {BottomSheetView} from '@gorhom/bottom-sheet';
import {WebView} from 'react-native-webview';
import {useBrowserStore} from '../stores/useBrowserStore';
import Icon from 'react-native-vector-icons/Ionicons';

export default function BrowserBottomSheet() {
  const bottomSheetRef = useRef(null);
  const {visible, url, hide} = useBrowserStore();
  const snapPoints = useMemo(() => ['40%','70%','90%'], []);

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={visible ? 1 : -1}
      snapPoints={snapPoints}
      enablePanDownToClose
      onClose={hide}
      enableContentPanningGesture={false}
    >
      <BottomSheetView style={styles.sheetContent}>
        <WebView source={{uri: url}} style={styles.webview} />
      </BottomSheetView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  sheetContent: {
    flex: 1,
    height: '100%',
  },
  browserContainer: {
    flex: 1,
  },
  webview: {},
});

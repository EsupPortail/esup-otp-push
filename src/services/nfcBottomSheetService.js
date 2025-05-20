let ref = null;

export const setBottomSheetRef = (instance) => {
  ref = instance;
};

const ensureRef = () => {
  if (!ref) {
    console.warn('[NfcBottomSheet] Le ref n\'est pas encore disponible');
    return false;
  }
  return true;
};

export const openBottomSheet = () => {
  if (ensureRef()) ref.open();
};

export const showWaiting = () => {
  if (ensureRef()) ref.setWaiting();
};

export const showSuccess = (message = 'Succès !') => {
  if (ensureRef()) ref.setSuccess(message);
};

export const showError = () => {
  if (ensureRef()) ref.setError();
};

export const closeBottomSheet = () => {
  if (ensureRef()) ref.close();
};

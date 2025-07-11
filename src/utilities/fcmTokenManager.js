import messaging from '@react-native-firebase/messaging';
import firestore from '@react-native-firebase/firestore';
import { Platform } from 'react-native';

export const requestIOSPermissions = async () => {
  try {
    if (Platform.OS === 'ios') {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;
      
      console.log('FCM Authorization status:', authStatus);
      return enabled;
    }
    return true;
  } catch (error) {
    console.error('Error requesting iOS notifications permission:', error);
    return false;
  }
};

export const saveFCMToken = async (userId) => {
  try {
    // Get the FCM token
    if (userId) {
      // Request iOS permissions if needed
      if (Platform.OS === 'ios') {
        const permissionEnabled = await requestIOSPermissions();
        console.log('FCM iOS permission enabled:', permissionEnabled);
        if (!permissionEnabled) {
          console.warn('FCM permissions not granted for iOS');
          return;
        }
      }

      await messaging().registerDeviceForRemoteMessages();
      const token = await messaging().getToken();
      console.log('FCM token:', token);
      
      if (token) {
        await firestore()
          .collection('userFCMTokens')
          .doc(userId)
          .set({
            userId, // Add user ID to the document
            token,
            platform: Platform.OS,
            updatedAt: firestore.FieldValue.serverTimestamp()
          });
      }
      console.log('FCM token saved successfully with user ID:', userId);
    }
  } catch (error) {
    console.error('Error saving FCM token:', error);
  }
};

export const removeFCMToken = async (userId) => {
  try {
    // Remove token from Firestore
    await firestore()
      .collection('userFCMTokens')
      .doc(userId)
      .delete();

    console.log('FCM token removed successfully');
  } catch (error) {
    console.error('Error removing FCM token:', error);
  }
};

export const getAllFCMTokens = async () => {
  try {
    // Get all documents from userFCMTokens collection
    const snapshot = await firestore()
      .collection('userFCMTokens')
      .get();

    // Map through documents and create array of tokens
    const tokens = snapshot.docs.map(doc => ({
      userId: doc.data().userId, // Get userId from document data
      token: doc.data().token,
      updatedAt: doc.data().updatedAt
    }));

    console.log('FCM tokens retrieved successfully');
    return tokens;
  } catch (error) {
    console.error('Error getting FCM tokens:', error);
    return [];
  }
}; 
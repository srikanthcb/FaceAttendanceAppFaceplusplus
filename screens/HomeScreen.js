import React, { useState } from 'react';
import { View, Text, Button, Alert, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import RNFS from 'react-native-fs';
import axios from 'axios';
import LinearGradient from 'react-native-linear-gradient';
import { markAttendance } from '../attendance';

const HomeScreen = () => {
  const [capturedImage, setCapturedImage] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [capturedFaceToken, setCapturedFaceToken] = useState(null);
  const [loading, setLoading] = useState(false);

  // Options for image picker
  const options = {
    mediaType: 'photo',
    includeBase64: true,
  };

  // Capture image and register face
  const handleCaptureImage = () => {
    launchCamera(options, async (response) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
        Alert.alert('Action Cancelled', 'You cancelled the image capture.');
      } else if (response.errorCode) {
        console.error('ImagePicker Error: ', response.errorMessage);
        Alert.alert('Error', 'Failed to capture image. Please try again.');
      } else {
        const source = { uri: response.assets[0].uri };
        setCapturedImage(source.uri);
        const faceToken = await registerFace(source.uri);
        if (faceToken) {
          setCapturedFaceToken(faceToken);
          Alert.alert('Face Captured', 'Face successfully registered for comparison.');
        } else {
          Alert.alert('Error', 'No face detected. Please try again.');
        }
      }
    });
  };

  // Select image and compare faces
  const handleSelectImage = () => {
    launchImageLibrary(options, async (response) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
        Alert.alert('Action Cancelled', 'You cancelled the image selection.');
      } else if (response.errorCode) {
        console.error('ImagePicker Error: ', response.errorMessage);
        Alert.alert('Error', 'Failed to select image. Please try again.');
      } else {
        const source = { uri: response.assets[0].uri };
        setSelectedImage(source.uri);

        if (capturedFaceToken) {
          const secondFaceToken = await registerFace(source.uri);
          if (secondFaceToken) {
            setLoading(true);
            compareFaces(capturedFaceToken, secondFaceToken);
          } else {
            Alert.alert('Error', 'No face detected in the selected image.');
          }
        } else {
          Alert.alert('Error', 'Capture a face first for comparison.');
        }
      }
    });
  };

  // Register face and retrieve face token
  const registerFace = async (imageUri) => {
    try {
      const base64Image = await RNFS.readFile(imageUri, 'base64');
      const formData = new FormData();
      formData.append('api_key', 'nyOBH0v_lfQZgnm14LOOkXt4Pf72Hshp');
      formData.append('api_secret', 'sTYUHcm0TWN2PX5YaZUZnNx-byWzyC9n');
      formData.append('image_base64', base64Image);

      const response = await axios.post('https://api-us.faceplusplus.com/facepp/v3/detect', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const data = response.data;
      if (data.faces && data.faces.length > 0) {
        return data.faces[0].face_token;
      } else {
        console.error('No face detected in the image.');
        return null;
      }
    } catch (error) {
      console.error('Face registration error:', error.response?.data || error.message);
      Alert.alert('Error', 'Face registration failed. Please try again.');
      return null;
    }
  };

  // Compare two face tokens
  const compareFaces = async (capturedFaceToken, secondFaceToken) => {
    try {
      const formData = new FormData();
      formData.append('api_key', 'nyOBH0v_lfQZgnm14LOOkXt4Pf72Hshp');
      formData.append('api_secret', 'sTYUHcm0TWN2PX5YaZUZnNx-byWzyC9n');
      formData.append('face_token1', capturedFaceToken);
      formData.append('face_token2', secondFaceToken);

      const response = await axios.post('https://api-us.faceplusplus.com/facepp/v3/compare', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const data = response.data;
      setLoading(false);

      if (data.confidence > 80) {
        markAttendance('present');
        Alert.alert('Face Verified', 'Attendance Marked Successfully.');
      } else {
        Alert.alert('Face Mismatch', 'The faces do not match.');
      }
    } catch (error) {
      setLoading(false);
      console.error('Face comparison error:', error.response?.data || error.message);
      Alert.alert('Error', 'Face comparison failed. Please try again.');
    }
  };

  return (
    <LinearGradient colors={['#4c669f', '#6a11cb', '#2575fc']} style={styles.container}>
      <Text style={styles.title}>Face Attendance System</Text>
      <View style={styles.buttonContainer}>
        <Button title="Capture Face" onPress={handleCaptureImage} />
      </View>
      {capturedImage && <Image source={{ uri: capturedImage }} style={styles.faceImage} />}
      <View style={styles.buttonContainer}>
        <Button title="Select Image from Library" onPress={handleSelectImage} />
      </View>
      {selectedImage && <Image source={{ uri: selectedImage }} style={styles.faceImage} />}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={styles.loadingText}>Comparing Images, Please Wait...</Text>
        </View>
      )}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 30,
    textShadowColor: '#000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
  },
  faceImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginTop: 20,
  },
  buttonContainer: {
    marginVertical: 15, // Space between buttons
    width: '70%',
  },
  loadingContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#ffffff',
    fontSize: 16,
  },
});

export default HomeScreen;

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Platform,
  useColorScheme,
} from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft, Info, Sun, Droplet, Wind, Camera as CameraIcon, Upload, Image as ImageIcon } from 'lucide-react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { usePlantIdentification } from '@/hooks/usePlantIdentification';

export default function IdentifyScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraType, setCameraType] = useState<CameraType>('back');
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [identifiedPlant, setIdentifiedPlant] = useState<any>(null);
  const cameraRef = useRef(null);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const { identifying, error, identifyPlant, saveIdentifiedPlant } = usePlantIdentification();

  if (!permission) {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? '#121212' : '#F5F5F5' }]}>
        <View style={styles.permissionContainer}>
          <View style={[styles.permissionIconContainer, { backgroundColor: isDark ? '#2A3A30' : '#E6F2E8' }]}>
            <CameraIcon color="#3A8349" size={40} />
          </View>
          <Text style={[styles.permissionTitle, { color: isDark ? '#E0E0E0' : '#283618' }]}>
            Initializing Camera...
          </Text>
          <ActivityIndicator color="#3A8349" size="large" style={styles.permissionLoader} />
        </View>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? '#121212' : '#F5F5F5' }]}>
        <View style={styles.permissionContainer}>
          <View style={[styles.permissionIconContainer, { backgroundColor: isDark ? '#2A3A30' : '#E6F2E8' }]}>
            <CameraIcon color="#3A8349" size={40} />
          </View>
          <Text style={[styles.permissionTitle, { color: isDark ? '#E0E0E0' : '#283618' }]}>
            Camera Access Required
          </Text>
          <Text style={[styles.permissionText, { color: isDark ? '#BBBBBB' : '#555555' }]}>
            We need camera access to help you identify plants. Your privacy is important to us - photos are only used for plant identification and aren't stored without your permission.
          </Text>
          <TouchableOpacity 
            style={[styles.permissionButton, { backgroundColor: '#3A8349' }]}
            onPress={requestPermission}
          >
            <CameraIcon color="white" size={20} style={styles.permissionButtonIcon} />
            <Text style={styles.permissionButtonText}>Enable Camera Access</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.secondaryButton, { backgroundColor: isDark ? '#2A3A30' : '#E6F2E8' }]}
            onPress={() => router.back()}
          >
            <Text style={[styles.secondaryButtonText, { color: '#3A8349' }]}>Not Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const takePicture = async () => {
    if (cameraRef.current && !isCapturing) {
      setIsCapturing(true);
      try {
        const photo = await cameraRef.current.takePictureAsync();
        setCapturedImage(photo.uri);
        setIsCapturing(false);
      } catch (error) {
        console.error('Error taking picture:', error);
        setIsCapturing(false);
      }
    }
  };

  const startIdentification = async () => {
    if (!capturedImage) return;
    
    try {
      const result = await identifyPlant(capturedImage);
      setIdentifiedPlant(result);
    } catch (error) {
      // Error is handled by the hook and displayed in the UI
      console.error('Identification error:', error);
    }
  };

  const addToCollection = async () => {
    if (!identifiedPlant) return;
    
    try {
      await saveIdentifiedPlant(identifiedPlant);
      router.push('/(tabs)/collection');
    } catch (error) {
      console.error('Error saving plant:', error);
    }
  };

  const resetCamera = () => {
    setCapturedImage(null);
    setIdentifiedPlant(null);
  };

  const flipCamera = () => {
    setCameraType(current => (current === 'back' ? 'front' : 'back'));
  };

  // If we've identified a plant
  if (identifiedPlant) {
    return (
      <ScrollView style={[styles.container, { backgroundColor: isDark ? '#121212' : '#F5F5F5' }]}>
        <View style={styles.identifiedContainer}>
          <View style={styles.imageContainer}>
            <Image source={{ uri: capturedImage }} style={styles.identifiedImage} />
            <View style={styles.confidenceBadge}>
              <Text style={styles.confidenceText}>
                {Math.round(identifiedPlant.confidence * 100)}% Match
              </Text>
            </View>
          </View>
          
          <View style={styles.plantInfoContainer}>
            <Text style={[styles.plantName, { color: isDark ? '#E0E0E0' : '#283618' }]}>
              {identifiedPlant.name}
            </Text>
            <Text style={[styles.scientificName, { color: isDark ? '#BBBBBB' : '#555555' }]}>
              {identifiedPlant.commonNames?.[0]}
            </Text>
            
            <View style={styles.divider} />
            
            <Text style={[styles.description, { color: isDark ? '#BBBBBB' : '#555555' }]}>
              {identifiedPlant.description}
            </Text>
            
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={[styles.primaryButton, { backgroundColor: '#3A8349' }]}
                onPress={addToCollection}
              >
                <Text style={styles.primaryButtonText}>Add to My Collection</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.secondaryButton, { backgroundColor: isDark ? '#2A3A30' : '#E6F2E8' }]}
                onPress={resetCamera}
              >
                <Text style={[styles.secondaryButtonText, { color: '#3A8349' }]}>Identify Another Plant</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    );
  }

  // If we've captured an image but not yet identified
  if (capturedImage) {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? '#121212' : '#F5F5F5' }]}>
        <Image source={{ uri: capturedImage }} style={styles.previewImage} />
        
        <View style={styles.previewOverlay}>
          {error && (
            <View style={[styles.errorContainer, { backgroundColor: isDark ? '#2A2A2A' : '#FFE8E0' }]}>
              <Text style={[styles.errorText, { color: isDark ? '#FFB4A1' : '#D27D4C' }]}>
                {error}
              </Text>
            </View>
          )}
          
          <View style={styles.previewControls}>
            <TouchableOpacity
              style={styles.previewButton}
              onPress={resetCamera}
            >
              <ChevronLeft color="white" size={24} />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.identifyButton,
                identifying && styles.identifyingButton
              ]}
              onPress={startIdentification}
              disabled={identifying}
            >
              {identifying ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text style={styles.identifyButtonText}>Identify Plant</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // Default camera screen
  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={cameraType}
      >
        <View style={styles.cameraControls}>
          <TouchableOpacity
            style={styles.flipButton}
            onPress={flipCamera}
          >
            <CameraIcon color="white" size={20} style={{ transform: [{ scaleX: -1 }] }} />
          </TouchableOpacity>
          
          <View style={styles.bottomControls}>
            <TouchableOpacity 
              style={styles.galleryButton}
              onPress={() => {
                // This would open image picker in a real app
                console.log('Gallery pressed');
              }}
            >
              <ImageIcon color="white" size={24} />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.captureButton}
              onPress={takePicture}
              disabled={isCapturing}
            >
              {isCapturing ? (
                <View style={styles.capturingIndicator} />
              ) : (
                <View style={styles.captureButtonInner} />
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.uploadButton}
              onPress={() => {
                // This would upload from files in a real app
                console.log('Upload pressed');
              }}
            >
              <Upload color="white" size={24} />
            </TouchableOpacity>
          </View>
        </View>
      </CameraView>
      
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.7)']}
        style={styles.cameraOverlay}
        pointerEvents="none"
      />
      
      <View style={styles.helpTextContainer} pointerEvents="none">
        <Text style={styles.helpText}>Point camera at a plant to identify</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permissionIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
  },
  permissionText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  permissionLoader: {
    marginTop: 24,
  },
  permissionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
    width: '100%',
    maxWidth: 300,
  },
  permissionButtonIcon: {
    marginRight: 8,
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    width: '100%',
    maxWidth: 300,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  camera: {
    flex: 1,
  },
  cameraControls: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 150,
  },
  helpTextContainer: {
    position: 'absolute',
    top: '15%',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  helpText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    overflow: 'hidden',
  },
  flipButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-end',
  },
  bottomControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  galleryButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white',
  },
  capturingIndicator: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: 'white',
    borderStyle: 'dashed',
  },
  uploadButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImage: {
    ...StyleSheet.absoluteFillObject,
  },
  previewOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 20,
  },
  errorContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
  },
  previewControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Platform.OS === 'ios' ? 50 : 20,
  },
  previewButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  identifyButton: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#3A8349',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 20,
  },
  identifyingButton: {
    backgroundColor: '#2A5A35',
  },
  identifyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  identifiedContainer: {
    flex: 1,
  },
  imageContainer: {
    position: 'relative',
    height: 300,
  },
  identifiedImage: {
    width: '100%',
    height: '100%',
  },
  confidenceBadge: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(58, 131, 73, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  confidenceText: {
    color: 'white',
    fontWeight: '600',
  },
  plantInfoContainer: {
    padding: 20,
  },
  plantName: {
    fontSize: 24,
    fontWeight: '700',
  },
  scientificName: {
    fontSize: 16,
    fontStyle: 'italic',
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 20,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
  },
  buttonContainer: {
    gap: 12,
  },
  primaryButton: {
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  textButton: {
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  offlineContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  offlineIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  offlineTitle: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
  },
  offlineText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  offlineButton: {
    width: '100%',
    maxWidth: 300,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  offlineButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
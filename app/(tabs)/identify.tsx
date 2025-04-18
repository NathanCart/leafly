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
import { Camera as CameraIcon, X, Image as ImageIcon, Upload, Leaf, Sun, Droplet } from 'lucide-react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';

export default function IdentifyScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraType, setCameraType] = useState<CameraType>('back');
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [identifying, setIdentifying] = useState(false);
  const [identifiedPlant, setIdentifiedPlant] = useState<any>(null);
  const cameraRef = useRef(null);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  if (!permission) {
    // Camera permissions are still loading
    return (
      <View style={[styles.container, { backgroundColor: isDark ? '#121212' : '#F5F5F5' }]}>
        <ActivityIndicator color="#3A8349" size="large" />
      </View>
    );
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet
    return (
      <View style={[styles.container, { backgroundColor: isDark ? '#121212' : '#F5F5F5' }]}>
        <Text style={[styles.permissionText, { color: isDark ? '#E0E0E0' : '#283618' }]}>
          We need your permission to use the camera
        </Text>
        <TouchableOpacity 
          style={[styles.permissionButton, { backgroundColor: '#3A8349' }]}
          onPress={requestPermission}
        >
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
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

  const identifyPlant = async () => {
    if (!capturedImage) return;
    
    setIdentifying(true);
    
    // Simulate API call delay
    setTimeout(() => {
      // Mock identification result
      setIdentifiedPlant({
        name: 'Monstera Deliciosa',
        scientificName: 'Monstera deliciosa',
        confidence: 95,
        careLevel: 'Easy',
        lightNeeds: 'Bright indirect light',
        waterNeeds: 'Allow soil to dry between waterings',
        image: capturedImage,
      });
      setIdentifying(false);
    }, 2000);
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
            <Image source={{ uri: identifiedPlant.image }} style={styles.identifiedImage} />
            <View style={styles.confidenceBadge}>
              <Text style={styles.confidenceText}>{identifiedPlant.confidence}% Match</Text>
            </View>
          </View>
          
          <View style={styles.plantInfoContainer}>
            <Text style={[styles.plantName, { color: isDark ? '#E0E0E0' : '#283618' }]}>
              {identifiedPlant.name}
            </Text>
            <Text style={[styles.scientificName, { color: isDark ? '#BBBBBB' : '#555555' }]}>
              {identifiedPlant.scientificName}
            </Text>
            
            <View style={styles.divider} />
            
            <View style={styles.careInfoContainer}>
              <View style={styles.careInfoItem}>
                <View style={[styles.careInfoIcon, { backgroundColor: isDark ? '#2A3A30' : '#E6F2E8' }]}>
                  <Leaf color="#3A8349" size={20} />
                </View>
                <View>
                  <Text style={[styles.careInfoLabel, { color: isDark ? '#BBBBBB' : '#555555' }]}>Care Level</Text>
                  <Text style={[styles.careInfoValue, { color: isDark ? '#E0E0E0' : '#283618' }]}>{identifiedPlant.careLevel}</Text>
                </View>
              </View>
              
              <View style={styles.careInfoItem}>
                <View style={[styles.careInfoIcon, { backgroundColor: isDark ? '#2A3A30' : '#E6F2E8' }]}>
                  <Sun color="#3A8349" size={20} />
                </View>
                <View>
                  <Text style={[styles.careInfoLabel, { color: isDark ? '#BBBBBB' : '#555555' }]}>Light</Text>
                  <Text style={[styles.careInfoValue, { color: isDark ? '#E0E0E0' : '#283618' }]}>{identifiedPlant.lightNeeds}</Text>
                </View>
              </View>
              
              <View style={styles.careInfoItem}>
                <View style={[styles.careInfoIcon, { backgroundColor: isDark ? '#2A3A30' : '#E6F2E8' }]}>
                  <Droplet color="#3A8349" size={20} />
                </View>
                <View>
                  <Text style={[styles.careInfoLabel, { color: isDark ? '#BBBBBB' : '#555555' }]}>Water</Text>
                  <Text style={[styles.careInfoValue, { color: isDark ? '#E0E0E0' : '#283618' }]}>{identifiedPlant.waterNeeds}</Text>
                </View>
              </View>
            </View>
            
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={[styles.primaryButton, { backgroundColor: '#3A8349' }]}
                onPress={() => {
                  router.push({
                    pathname: '/plantDetail',
                    params: { name: identifiedPlant.name }
                  });
                }}
              >
                <Text style={styles.primaryButtonText}>View Full Details</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.secondaryButton, { backgroundColor: isDark ? '#2A3A30' : '#E6F2E8' }]}
                onPress={() => {
                  // Add to collection logic would go here
                  router.push('/(tabs)/collection');
                }}
              >
                <Text style={[styles.secondaryButtonText, { color: '#3A8349' }]}>Add to Collection</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.textButton, { backgroundColor: 'transparent' }]}
                onPress={resetCamera}
              >
                <Text style={[styles.textButtonText, { color: isDark ? '#8EB69B' : '#3A8349' }]}>Identify Another Plant</Text>
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
          <View style={styles.previewControls}>
            <TouchableOpacity
              style={styles.previewButton}
              onPress={resetCamera}
            >
              <X color="white" size={24} />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.identifyButton, identifying && styles.identifyingButton]}
              onPress={identifyPlant}
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
  permissionText: {
    textAlign: 'center',
    marginBottom: 20,
    fontSize: 16,
  },
  permissionButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  permissionButtonText: {
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
  careInfoContainer: {
    gap: 16,
  },
  careInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  careInfoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  careInfoLabel: {
    fontSize: 14,
  },
  careInfoValue: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 2,
  },
  buttonContainer: {
    marginTop: 30,
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
  secondaryButton: {
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: {
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
});
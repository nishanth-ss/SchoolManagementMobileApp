import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Image,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
} from 'react-native-vision-camera';
import { detectFaces } from 'react-native-vision-camera-face-detector';

export default function FaceCaptureComponent() {
  const device = useCameraDevice('front');
  const { hasPermission, requestPermission } = useCameraPermission();

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const [faceDetected, setFaceDetected] = useState(false);

  const cameraRef = useRef<Camera>(null);
  const attemptCount = useRef(0);
    const router = useRouter();
  

  const startCamera = async () => {
    if (!hasPermission) {
      const granted = await requestPermission();
      if (!granted) {
        Alert.alert('Permission Required', 'Camera access is needed');
        return;
      }
    }

    // Reset everything
    attemptCount.current = 0;
    setCapturedUri(null);
    setFaceDetected(false);
    setIsCameraActive(true);
  };

  // Auto capture logic
  useEffect(() => {
    if (!isCameraActive || !cameraRef.current) return;

    const interval = setInterval(async () => {
      try {
        const photo = await cameraRef.current!.takePhoto({ flash: 'off' });
        const uri = `file://${photo.path}`;

        const faces = await detectFaces({ image: { uri } });

        if (faces.length > 0) {
          setFaceDetected(true);
          setCapturedUri(uri);
          setIsCameraActive(false); // Stop camera
        } else {
          attemptCount.current += 1;
          if (attemptCount.current >= 3) {
            setIsCameraActive(false);
            Alert.alert('No Face Found', 'Please try again');
          }
        }
      } catch (error) {
        console.log('Capture error:', error);
      }
    }, 2200); // Try every ~2.2 seconds

    return () => clearInterval(interval);
  }, [isCameraActive]);

  // Manual capture (optional)
  const manualCapture = async () => {
    if (!cameraRef.current) return;
    const photo = await cameraRef.current.takePhoto({ flash: 'off' });
    const uri = `file://${photo.path}`;
    const faces = await detectFaces({ image: { uri } });
    setFaceDetected(faces.length > 0);
    setCapturedUri(uri);
    setIsCameraActive(false);
  };

  // Permission screen
  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Camera Access Required</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText} onPress={Linking.openSettings}>Allow Camera</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!device) {
    return <Text style={styles.title}>No Front Camera Found</Text>;
  }

  return (
    <View style={styles.container}>

      {/* 1. START SCREEN */}
      {!isCameraActive && !capturedUri && (
        <View style={styles.startScreen}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.replace('/(auth)/login')}
          >
            <Text style={styles.backButtonText}>← Back to Login</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Face Verification</Text>
          <Text style={styles.subtitle}>We need to capture your face</Text>
          <TouchableOpacity style={styles.startButton} onPress={startCamera}>
            <Text style={styles.startButtonText}>Start Camera</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 2. LIVE CAMERA (Mirror + No Black Screen) */}
      {isCameraActive && (
        <>
          <View style={styles.cameraContainer}>
            <Camera
              ref={cameraRef}
              style={StyleSheet.absoluteFill}
              device={device}
              isActive={true}
              photo={true}
            />
          </View>

          {/* Face Guide */}
          <View style={styles.faceGuide}>
            <View style={styles.faceOval} />
            <Text style={styles.guideText}>Position your face inside the oval</Text>
          </View>

          {/* Optional: Manual button */}
          <TouchableOpacity style={styles.captureBtn} onPress={manualCapture}>
            <Text style={styles.buttonText}>Capture Now</Text>
          </TouchableOpacity>
        </>
      )}

      {/* 3. RESULT SCREEN */}
      {capturedUri && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>
            {faceDetected ? 'Face Captured Successfully' : 'No Face Detected'}
          </Text>
          <Image
            source={{ uri: capturedUri }}
            style={styles.resultImage}
            resizeMode="contain"
          />
          <TouchableOpacity style={styles.retryButton} onPress={startCamera}>
            <Text style={styles.buttonText}>Retake Photo</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// PERFECT STYLES – NEVER CHANGE THESE
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    opacity: 0.8,
  },
  startScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#aaa',
    textAlign: 'center',
    marginBottom: 40,
  },
  startButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 18,
    paddingHorizontal: 50,
    borderRadius: 30,
  },
  startButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: '600',
  },

  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    padding: 10,
    zIndex: 10,
  },
  backButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },

  // CAMERA WITH MIRROR (NO BLACK SCREEN)
  cameraContainer: {
    flex: 1,
    width: '100%',
    backgroundColor: 'black',
    overflow: 'hidden',
    transform: [{ scaleX: -1 }],   // This is the magic mirror
  },

  faceGuide: {
    position: 'absolute',
    top: 80,
    left: 0,
    right: 0,
    alignItems: 'center',
    pointerEvents: 'none',
  },
  faceOval: {
    width: 240,
    height: 320,
    borderRadius: 120,
    borderWidth: 4,
    borderColor: 'rgba(0, 200, 255, 0.7)',
    borderStyle: 'dashed',
  },
  guideText: {
    marginTop: 20,
    color: 'white',
    fontSize: 17,
    fontWeight: '600',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
  },
  captureBtn: {
    position: 'absolute',
    bottom: 90,
    alignSelf: 'center',
    backgroundColor: '#FF3B30',
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 50,
  },

  // RESULT SCREEN
  resultContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  resultTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 30,
    textAlign: 'center',
  },
  resultImage: {
    width: '90%',
    height: '65%',
    borderRadius: 20,
    backgroundColor: '#222',
    transform: [{ scaleX: -1 }],   // Mirror the captured photo too
  },
  retryButton: {
    marginTop: 30,
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 50,
    borderRadius: 30,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#40407a',
    padding: 18,
    borderRadius: 12,
    minWidth: 200,
    alignItems: 'center',
  }
});
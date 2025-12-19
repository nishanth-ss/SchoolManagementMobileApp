import axios, { AxiosError } from "axios";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
} from "react-native-vision-camera";
import { detectFaces } from "react-native-vision-camera-face-detector";

/* ========= STRICT FACE RULES ========= */
const TARGET_FACE_RATIO = 0.42;
const FACE_RATIO_TOLERANCE = 0.04;
const CENTER_TOLERANCE = 0.07;
const MAX_YAW = 8;
const MAX_PITCH = 8;
const REQUIRED_STABLE_FRAMES = 3;
/* ==================================== */

export default function FaceCapture() {
  const device = useCameraDevice("front");
  const { hasPermission, requestPermission } = useCameraPermission();
  const { mode = "login" } = useLocalSearchParams();

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [guideMessage, setGuideMessage] = useState(
    "Place your face inside the oval"
  );

  const cameraRef = useRef<Camera>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const stableCountRef = useRef(0);

  const router = useRouter();

  /* ========= START CAMERA ========= */
  const startCamera = async () => {
    if (!hasPermission) {
      const granted = await requestPermission();
      if (!granted) {
        Alert.alert("Permission Required", "Camera access is needed");
        return;
      }
    }
    stableCountRef.current = 0;
    setGuideMessage("Align your face properly");
    setIsCameraActive(true);
  };

  /* ========= FACE VALIDATION LOOP ========= */
  useEffect(() => {
    if (!isCameraActive || !cameraRef.current) return;

    intervalRef.current = setInterval(async () => {
      try {
        const photo = await cameraRef.current!.takePhoto({ flash: "off" });
        const uri = `file://${photo.path}`;

        const faces = await detectFaces({ image: { uri } });

        if (faces.length !== 1) {
          stableCountRef.current = 0;
          setGuideMessage(
            faces.length === 0
              ? "No face detected"
              : "Only one face allowed"
          );
          return;
        }

        const face = faces[0];
        const { width, x } = face.bounds;

        const imageWidth = photo.width;
        const faceRatio = width / imageWidth;

        const faceCenterX = x + width / 2;
        const imageCenterX = imageWidth / 2;
        const centerOffset =
          Math.abs(faceCenterX - imageCenterX) / imageWidth;

        const yaw = Math.abs(face.yawAngle || 0);
        const pitch = Math.abs(face.pitchAngle || 0);

        /* === VALIDATION === */
        if (Math.abs(faceRatio - TARGET_FACE_RATIO) > FACE_RATIO_TOLERANCE) {
          stableCountRef.current = 0;
          setGuideMessage("Move closer or farther to fit the oval");
          return;
        }

        if (centerOffset > CENTER_TOLERANCE) {
          stableCountRef.current = 0;
          setGuideMessage("Center your face inside the oval");
          return;
        }

        if (yaw > MAX_YAW || pitch > MAX_PITCH) {
          stableCountRef.current = 0;
          setGuideMessage("Look straight at the camera");
          return;
        }

        /* === STABLE FRAME === */
        stableCountRef.current += 1;
        setGuideMessage("Perfect! Hold still...");

        if (stableCountRef.current >= REQUIRED_STABLE_FRAMES) {
          clearInterval(intervalRef.current!);
          intervalRef.current = null;
          setIsCameraActive(false);
          uploadFace(uri);
        }
      } catch (e) {
        console.log("FACE ERROR:", e);
      }
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isCameraActive]);

  /* ========= UPLOAD ========= */
  const uploadFace = async (uri: string) => {
    try {
      setLoading(true);

      const studentId = await SecureStore.getItemAsync("studentId");
      const baseUrl = await SecureStore.getItemAsync("baseUrl");

      if (!baseUrl) {
        Alert.alert("Error", "Missing configuration");
        return;
      }

      const endpoint =
        mode === "register"
          ? "/face/register-face"
          : "/face/login-face";

      const formData = new FormData();
      if (studentId) formData.append("userId", studentId);

      formData.append("face", {
        uri,
        name: "face.jpg",
        type: "image/jpeg",
      } as any);

      const res: any = await axios.post(`${baseUrl}${endpoint}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const data = res.data;
      if (data.status) {
        if (mode === "register") {
          Toast.show({
            type: "success",
            text1: "Success",
            text2: data.success || "Face registered successfully.",
            position: "bottom",
          });
          router.replace("/profile");
        } else {
          await SecureStore.setItemAsync("register_no", data.user.username);
          await SecureStore.setItemAsync("studentId", data.user.id);
          await SecureStore.setItemAsync("authToken", data.token);
          await SecureStore.setItemAsync(
            "subscription",
            data.user.subscription ? "true" : "false"
          );


          Toast.show({
            type: "success",
            text1: "Login Successful",
            position: "bottom"
          });

          if (!data.user.subscription) {
            router.replace("/subscription");
          } else {
            router.replace("/(tabs)/profile");
          }
        }
      } else {
        Toast.show({
          type: "error",
          text1: data.message || "Face look like not in right position try again",
          position: "bottom"
        })
        startCamera();
      }
    } catch (error) {
       const err = error as AxiosError<any>;
      const message =
        err?.response?.data?.message || "Server error, try again";

      Toast.show({
        type: "error",
        text1: "Error",
        text2: message,
        position: "bottom",
      });
      startCamera();
    } finally {
      setLoading(false);
    }
  };

  if (!device || !hasPermission) return null;

  return (
    <View style={styles.container}>
      {!isCameraActive && !loading && (
        <View style={styles.center}>
          <Text style={styles.title}>
            {mode === "register" ? "Register Face ID" : "Face Login"}
          </Text>
          <TouchableOpacity onPress={startCamera} style={styles.button}>
            <Text style={styles.buttonText}>Start Camera</Text>
          </TouchableOpacity>
        </View>
      )}

      {isCameraActive && (
        <>
          <Camera
            ref={cameraRef}
            style={StyleSheet.absoluteFill}
            device={device}
            isActive
            photo
          />
          <View style={styles.overlay}>
            <View style={styles.oval} />
            <Text style={styles.guide}>{guideMessage}</Text>
          </View>
        </>
      )}

      {loading && (
        <View style={styles.center}>
          <Text style={styles.title}>Uploading...</Text>
        </View>
      )}
    </View>
  );
}

/* ========= STYLES ========= */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { color: "#fff", fontSize: 24, marginBottom: 20 },
  button: {
    backgroundColor: "#007AFF",
    padding: 16,
    borderRadius: 30,
  },
  buttonText: { color: "#fff", fontSize: 18 },
  overlay: { position: "absolute", top: 80, alignItems: "center", width: "100%" },
  oval: {
    width: 240,
    height: 320,
    borderRadius: 120,
    borderWidth: 4,
    borderColor: "rgba(0,200,255,0.8)",
    borderStyle: "dashed",
  },
  guide: {
    marginTop: 20,
    color: "#fff",
    backgroundColor: "rgba(0,0,0,0.6)",
    padding: 10,
    borderRadius: 20,
  },
});

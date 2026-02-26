import axios, { AxiosError } from "axios";
import { useI18n } from "@/i18n/I18nProvider";
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
  const { t } = useI18n();
  const device = useCameraDevice("front");
  const { hasPermission, requestPermission } = useCameraPermission();
  const { mode = "login" } = useLocalSearchParams();

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [guideMessage, setGuideMessage] = useState(
    t("place_face_inside_oval")
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
        Alert.alert(t("permission_required"), t("camera_access_needed"));
        return;
      }
    }
    stableCountRef.current = 0;
    setGuideMessage(t("align_face_properly"));
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
              ? t("no_face_detected")
              : t("only_one_face_allowed")
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
          setGuideMessage(t("move_closer_or_farther"));
          return;
        }

        if (centerOffset > CENTER_TOLERANCE) {
          stableCountRef.current = 0;
          setGuideMessage(t("center_face_inside_oval"));
          return;
        }

        if (yaw > MAX_YAW || pitch > MAX_PITCH) {
          stableCountRef.current = 0;
          setGuideMessage(t("look_straight_camera"));
          return;
        }

        /* === STABLE FRAME === */
        stableCountRef.current += 1;
        setGuideMessage(t("perfect_hold_still"));

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
        Alert.alert(t("error"), t("missing_configuration"));
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
            text1: t("success"),
            text2: data.success || t("face_registered_successfully"),
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
            text1: t("login_successful"),
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
          text1: data.message || t("face_position_retry"),
          position: "bottom"
        })
        startCamera();
      }
    } catch (error) {
       const err = error as AxiosError<any>;
      const message =
        err?.response?.data?.message || t("server_error_try_again");

      Toast.show({
        type: "error",
        text1: t("error"),
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
            {mode === "register" ? t("register_face_id") : t("face_login")}
          </Text>
          <TouchableOpacity onPress={startCamera} style={styles.button}>
            <Text style={styles.buttonText}>{t("start_camera")}</Text>
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
          <Text style={styles.title}>{t("uploading")}</Text>
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

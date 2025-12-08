import 'expo-router';

declare module 'expo-router' {
  interface Router {
    push: (path: PathName) => void;
    replace: (path: PathName) => void;
  }
}

type PathName =
  | '/' 
  | '/login' 
  | '/otp' 
  | '/subscription' 
  | '/(tabs)' 
  | '/(tabs)/profile' 
  | '/(tabs)/transaction' 
  | '/(tabs)/explore' 
  | '/modal' 
  | '/_sitemap';

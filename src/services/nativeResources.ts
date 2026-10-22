import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const NOTIFICATION_CHANNEL_ID = 'financial-reminders';
let notificationHandlerConfigured = false;

type NativeResource = 'camera' | 'location' | 'notifications' | 'native';
type NativeErrorCode = 'unsupported' | 'permission-denied' | 'permission-blocked' | 'unavailable' | 'unknown';

export class NativeResourceError extends Error {
  constructor(
    message: string,
    public readonly code: NativeErrorCode,
    public readonly resource: NativeResource,
    public readonly canOpenSettings = false,
  ) {
    super(message);
    this.name = 'NativeResourceError';
  }
}

export type CapturedReceipt = {
  uri: string;
  width: number;
  height: number;
  fileName: string | null;
  mimeType: string | null;
};

export type CurrentLocation = {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  timestamp: number;
};

export type NativePermissionStatus = 'granted' | 'denied' | 'undetermined' | 'unavailable';

export type NativePermissionsSnapshot = {
  camera: NativePermissionStatus;
  location: NativePermissionStatus;
  notifications: NativePermissionStatus;
};

function assertNative(resource: NativeResource) {
  if (Platform.OS === 'web') {
    throw new NativeResourceError(
      'Este recurso está disponível somente no aplicativo instalado em Android ou iOS.',
      'unsupported',
      resource,
    );
  }
}

function permissionError(
  resource: Exclude<NativeResource, 'native'>,
  permission: { canAskAgain: boolean },
  deniedMessage: string,
) {
  if (!permission.canAskAgain) {
    return new NativeResourceError(
      `${deniedMessage} A permissão está bloqueada e pode ser habilitada nas configurações do dispositivo.`,
      'permission-blocked',
      resource,
      true,
    );
  }

  return new NativeResourceError(deniedMessage, 'permission-denied', resource);
}

export function configureLocalNotifications() {
  if (notificationHandlerConfigured) return;

  notificationHandlerConfigured = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

export async function captureReceipt(): Promise<CapturedReceipt | null> {
  assertNative('camera');

  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) {
    throw permissionError(
      'camera',
      permission,
      'A câmera não foi autorizada. Você pode continuar registrando o lançamento sem comprovante.',
    );
  }

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ['images'],
    allowsEditing: false,
    quality: 0.7,
  });

  if (result.canceled || !result.assets?.[0]) return null;

  const asset = result.assets[0];
  return {
    uri: asset.uri,
    width: asset.width,
    height: asset.height,
    fileName: asset.fileName ?? null,
    mimeType: asset.mimeType ?? null,
  };
}

export async function getCurrentLocation(): Promise<CurrentLocation> {
  assertNative('location');

  const permission = await Location.requestForegroundPermissionsAsync();
  if (!permission.granted) {
    throw permissionError(
      'location',
      permission,
      'A localização não foi autorizada. O lançamento pode ser registrado normalmente sem coordenadas.',
    );
  }

  const servicesEnabled = await Location.hasServicesEnabledAsync();
  if (!servicesEnabled) {
    throw new NativeResourceError(
      'Os serviços de localização do dispositivo estão desativados. Ative o GPS e tente novamente.',
      'unavailable',
      'location',
      true,
    );
  }

  try {
    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      timestamp: position.timestamp,
    };
  } catch {
    throw new NativeResourceError(
      'Não foi possível obter a localização atual. Verifique o sinal de localização e tente novamente.',
      'unavailable',
      'location',
    );
  }
}

async function ensureNotificationPermission(): Promise<void> {
  assertNative('notifications');
  configureLocalNotifications();

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNEL_ID, {
      name: 'Lembretes financeiros',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return;

  const requested = await Notifications.requestPermissionsAsync();
  if (!requested.granted) {
    throw permissionError(
      'notifications',
      requested,
      'As notificações não foram autorizadas. Você pode continuar usando o Financely sem lembretes locais.',
    );
  }
}

export async function scheduleFinancialReminder({
  title = 'Financely • Lembrete financeiro',
  body = 'Não esqueça de registrar suas despesas de hoje.',
  seconds = 10,
}: {
  title?: string;
  body?: string;
  seconds?: number;
} = {}): Promise<string> {
  await ensureNotificationPermission();

  const trigger: Notifications.TimeIntervalTriggerInput = {
    type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
    seconds,
    ...(Platform.OS === 'android' ? { channelId: NOTIFICATION_CHANNEL_ID } : {}),
  };

  return Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: { source: 'financial-reminder' },
    },
    trigger,
  });
}

export async function getNativePermissionsStatus(): Promise<NativePermissionsSnapshot> {
  if (Platform.OS === 'web') {
    return {
      camera: 'unavailable',
      location: 'unavailable',
      notifications: 'unavailable',
    };
  }

  const [camera, location, notifications] = await Promise.all([
    ImagePicker.getCameraPermissionsAsync(),
    Location.getForegroundPermissionsAsync(),
    Notifications.getPermissionsAsync(),
  ]);

  return {
    camera: camera.status,
    location: location.status,
    notifications: notifications.status,
  };
}

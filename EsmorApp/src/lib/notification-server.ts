const serverUrl = process.env.EXPO_PUBLIC_NOTIFICATION_SERVER_URL?.trim();

/**
 * The optional notification server that collects device push tokens so a
 * backend can push to this device later. It is configured with the
 * EXPO_PUBLIC_NOTIFICATION_SERVER_URL environment variable.
 */
export function getNotificationServerUrl(): string | null {
  if (!serverUrl) {
    return null;
  }

  return serverUrl.replace(/\/+$/, '');
}

export type DeviceRegistrationPayload = {
  token: string;
  platform: string;
  projectId: string | null;
  registeredAt: string;
};

export type DeviceRegistrationResult = 'registered' | 'not-configured' | 'failed';

export async function registerDeviceWithServer(
  payload: DeviceRegistrationPayload
): Promise<DeviceRegistrationResult> {
  const baseUrl = getNotificationServerUrl();

  if (!baseUrl) {
    return 'not-configured';
  }

  try {
    const response = await fetch(`${baseUrl}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    return response.ok ? 'registered' : 'failed';
  } catch (error) {
    console.warn('Could not register the device with the notification server.', error);
    return 'failed';
  }
}

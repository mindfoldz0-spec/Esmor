# Push notifications

The app ships with a working push notification foundation: permissions, device
registration, a local test push, an activity log, deep links, and a small
server that can push any payload to every registered device.

```
src/lib/notification-service.ts        native implementation (expo-notifications)
src/lib/notification-service.web.ts    web shim, every call is a safe no-op
src/lib/notification-store.ts           SQLite persistence (native)
src/lib/notification-store.web.ts      localStorage persistence (web)
src/lib/notification-server.ts         optional token registration with a server
src/providers/notification-provider.tsx  shared state, listeners, actions
src/app/notifications.tsx               the notification centre screen
scripts/push-server.mjs                 token collector + send endpoint
scripts/send-push.mjs                   one-off CLI sender
```

## 1. Try it on a device (no backend needed)

1. Open the app and go to **Profile → Notifications**.
2. Tap **Enable notifications** and allow the prompt.
3. Write a title and a message, pick a delay, and tap **Send test notification**.

The notification is scheduled locally through `expo-notifications`, so it works
in Expo Go and shows up like a real push. Every scheduled, received, and opened
notification is listed under **Recent activity**.

## 2. Remote push (a real device on a development build)

Remote push needs three things:

| Requirement | Where it comes from |
| --- | --- |
| A development build | `npx expo run:ios` / `npx expo run:android`, or `eas build --profile development` |
| Push credentials | `eas credentials`, or the FCM v1 key in the EAS dashboard |
| An EAS project id | `eas init` adds `extra.eas.projectId` to `app.json` |

Without a project id the app still works, but it cannot mint an Expo push
token, so the **Push token** row stays empty. `EXPO_PUBLIC_EAS_PROJECT_ID` can
be used as a fallback instead of changing `app.json`.

> Push notifications do not work in Expo Go on Android from SDK 53 onwards. A
> development build is required. Local test pushes still work in Expo Go.

## 3. The notification server

`scripts/push-server.mjs` collects device tokens and sends notifications.

```bash
node scripts/push-server.mjs
```

It listens on port `8787` (change it with `PUSH_SERVER_PORT`) and prints the
network address to use from a physical device. Point the app at it:

```bash
EXPO_PUBLIC_NOTIFICATION_SERVER_URL=http://192.168.1.10:8787
```

| Endpoint | Purpose |
| --- | --- |
| `POST /register` | The app posts its push token here |
| `GET /tokens` | Lists every registered device |
| `POST /send` | Sends a notification to every registered device |

Push any payload with `curl`:

```bash
curl -X POST http://localhost:8787/send \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Your weekly summary",
    "body": "Three new classes near you.",
    "data": { "url": "/profile" },
    "channelId": "esmor-default",
    "badge": 1,
    "priority": "high"
  }'
```

The same thing from the command line:

```bash
node scripts/send-push.mjs --title "Hello" --body "World"
node scripts/send-push.mjs --title "Hello" --body "World" --data '{"url":"/profile"}'
node scripts/send-push.mjs --title "Hello" --body "World" --dry-run
```

> On Windows PowerShell 5.1 the inner quotes of `--data` are stripped by the
> shell. Escape them (`--data '{\"url\":\"/profile\"}'`) or keep the payload in
> a file and pass `--data-file payload.json`.

The payload follows the Expo Push Service message format. A `data.url` entry
opens that screen when the notification is tapped.

Tokens are stored in `push-tokens.json` in the project root, which is ignored
by git.

## 4. What the app exposes for future work

| Piece | Entry point |
| --- | --- |
| Request the permission | `enableNotifications()` |
| Schedule a local notification | `sendLocalNotification(payload, delaySeconds)` |
| Register the device for remote push | `enableNotifications()` posts to the server |
| React to a received notification | `addReceivedListener` inside the provider |
| React to a tapped notification | `addResponseListener`, plus `data.url` routing |
| Read the delivery status | `useNotifications()` |

Notifications created by the app are stored locally:

- SQLite `esmor-notifications.db` on iOS and Android
- `localStorage` key `esmor.notifications.v1` on the web

The **Reset profile** action in the profile screen clears this data together
with the profile.

## 5. Platform notes

- The web build has no `expo-notifications`, so the screen explains that a
  device build is required and every call becomes a no-op.
- Android notifications are delivered through the `esmor-default` channel. The
  channel is created at runtime before the permission prompt is shown, as
  Android 13 requires.
- Remote pushes need an access token once push security is enabled in the EAS
  dashboard. Pass it to the scripts with `EXPO_ACCESS_TOKEN`.

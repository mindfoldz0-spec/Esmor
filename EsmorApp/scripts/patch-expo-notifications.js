const fs = require('fs');
const path = require('path');

const target = path.join(
  __dirname,
  '..',
  'node_modules',
  'expo-notifications',
  'build',
  'TopicSubscriptionModule.android.js'
);

if (fs.existsSync(target)) {
  const content = fs.readFileSync(target, 'utf8');
  if (content.includes("export default requireNativeModule('ExpoTopicSubscriptionModule');")) {
    const patched = content.replace(
      "export default requireNativeModule('ExpoTopicSubscriptionModule');",
      `let mod;
try {
  mod = requireNativeModule('ExpoTopicSubscriptionModule');
} catch {
  mod = {
    addListener: () => {},
    removeListeners: () => {},
    subscribeToTopicAsync: () => Promise.resolve(null),
    unsubscribeFromTopicAsync: () => Promise.resolve(null),
  };
}
export default mod;`
    );
    fs.writeFileSync(target, patched, 'utf8');
    console.log('[patch-expo-notifications] Successfully patched TopicSubscriptionModule.android.js for Expo Go');
  }
}

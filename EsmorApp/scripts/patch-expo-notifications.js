const fs = require('fs');
const path = require('path');

const targets = [
  path.join(__dirname, '..', 'node_modules', 'expo-notifications', 'build', 'TopicSubscriptionModule.android.js'),
  path.join(__dirname, '..', 'node_modules', 'expo-notifications', 'src', 'TopicSubscriptionModule.android.ts'),
];

const fallback = `let mod;
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
export default mod;`;

targets.forEach((target) => {
  if (fs.existsSync(target)) {
    let content = fs.readFileSync(target, 'utf8');
    if (content.includes("export default requireNativeModule('ExpoTopicSubscriptionModule');")) {
      content = content.replace("export default requireNativeModule('ExpoTopicSubscriptionModule');", fallback);
      fs.writeFileSync(target, content, 'utf8');
      console.log(`[patch-expo-notifications] Patched ${path.basename(target)}`);
    } else if (content.includes("export default requireNativeModule<TopicSubscriptionModule>('ExpoTopicSubscriptionModule');")) {
      content = content.replace("export default requireNativeModule<TopicSubscriptionModule>('ExpoTopicSubscriptionModule');", fallback);
      fs.writeFileSync(target, content, 'utf8');
      console.log(`[patch-expo-notifications] Patched ${path.basename(target)}`);
    }
  }
});

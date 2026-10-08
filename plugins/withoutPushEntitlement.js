// expo-widgets (57.0.23) always adds the push entitlement (aps-environment),
// even with enablePushNotifications off. The app sends no push, and a free
// Apple account can't sign an app that asks for it, so this takes it back out.
// List it before expo-widgets in app.json: Expo runs the later plugin's
// entitlement edit first, so this one gets the last word.
const { withEntitlementsPlist } = require('expo/config-plugins');

module.exports = function withoutPushEntitlement(config) {
  return withEntitlementsPlist(config, (mod) => {
    delete mod.modResults['aps-environment'];
    return mod;
  });
};

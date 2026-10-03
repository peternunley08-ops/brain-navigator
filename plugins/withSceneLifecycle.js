// iOS 27 refuses to launch an app built with its SDK unless the app uses
// the UIScene life cycle. Expo 57 ships the scene delegate
// (ExpoAppSceneDelegate) but its template doesn't use it yet, so this
// plugin wires it in at prebuild, the same way Expo's next template does:
// the AppDelegate hands its React Native factory to a SceneDelegate, which
// makes the window, and Info.plist names that SceneDelegate.
// Once a template adopts scenes itself, this plugin changes nothing.
const { withAppDelegate, withInfoPlist } = require('expo/config-plugins');

const START_IN_APP_DELEGATE =
  /\n#if os\(iOS\) \|\| os\(tvOS\)\n\s*window = UIWindow\(frame: UIScreen\.main\.bounds\)\n\s*factory\.startReactNative\([\s\S]*?\n#endif\n/;

const SCENE_DELEGATE = `
// The window is made and React Native started here, under the UIScene life
// cycle the iOS 27 SDK requires (added by plugins/withSceneLifecycle.js).
@objc(SceneDelegate)
class SceneDelegate: ExpoAppSceneDelegate {
}
`;

function withSceneAppDelegate(config) {
  return withAppDelegate(config, (config) => {
    const app = config.modResults;
    if (app.language !== 'swift') {
      throw new Error('withSceneLifecycle: expected a Swift AppDelegate');
    }
    let src = app.contents;
    if (src.includes('ExpoReactNativeFactoryProvider')) return config;

    const header = 'class AppDelegate: ExpoAppDelegate {';
    if (!src.includes(header) || !START_IN_APP_DELEGATE.test(src)) {
      throw new Error(
        'withSceneLifecycle: the AppDelegate template changed; check whether Expo adopts UIScene itself now',
      );
    }
    src = src.replace(header, 'class AppDelegate: ExpoAppDelegate, ExpoReactNativeFactoryProvider {');
    src = src.replace(
      START_IN_APP_DELEGATE,
      '\n    // SceneDelegate makes the window and starts React Native.\n',
    );
    app.contents = src.trimEnd() + '\n' + SCENE_DELEGATE;
    return config;
  });
}

function withSceneManifest(config) {
  return withInfoPlist(config, (config) => {
    if (config.modResults.UIApplicationSceneManifest) return config;
    config.modResults.UIApplicationSceneManifest = {
      UIApplicationSupportsMultipleScenes: false,
      UISceneConfigurations: {
        UIWindowSceneSessionRoleApplication: [
          {
            UISceneConfigurationName: 'Default Configuration',
            UISceneDelegateClassName: 'SceneDelegate',
          },
        ],
      },
    };
    return config;
  });
}

module.exports = function withSceneLifecycle(config) {
  return withSceneManifest(withSceneAppDelegate(config));
};

// Preloaded by tools/hub/test.mjs: Node can't load Expo or React Native, so
// any import of them gets an inert stand-in. Tests only call pure helpers;
// a store module may import these at the top without ever using them.
const Module = require('node:module');

// Stores that talk to Supabase build a client on import; give them a
// placeholder project (tests never make a network call).
process.env.EXPO_PUBLIC_SUPABASE_URL ||= 'https://example.supabase.co';
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||= 'test-anon-key';
const NATIVE = /^(expo($|-)|@expo\/|react-native|@react-native|@kingstinct\/|@react-native-google-signin\/|react$|react\/)/;

function inert() {
  const fn = function () {
    return inert();
  };
  return new Proxy(fn, {
    get: (_t, key) => (key === '__esModule' ? true : key === Symbol.toPrimitive ? () => '' : key === 'then' ? undefined : inert()),
    construct: () => inert(),
  });
}

const resolve = Module._resolveFilename;
Module._resolveFilename = function (request, ...rest) {
  if (NATIVE.test(request)) return `stub:${request}`;
  return resolve.call(this, request, ...rest);
};
const load = Module._load;
Module._load = function (request, ...rest) {
  if (NATIVE.test(request)) return inert();
  return load.call(this, request, ...rest);
};

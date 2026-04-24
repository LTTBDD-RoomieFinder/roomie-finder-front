/**
 * Shim for Metro/Babel output that still requests `react-native-css-interop/jsx-runtime`
 * after removing NativeWind. The real automatic JSX runtime is React’s.
 */
module.exports = require("react/jsx-runtime");

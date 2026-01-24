/**
 * Mock for @lodev09/react-native-true-sheet
 * Required to prevent Jest from trying to parse TypeScript declaration files
 */
const React = require('react');
const { View } = require('react-native');

const TrueSheet = React.forwardRef((props, ref) => {
  return React.createElement(View, { ...props, ref });
});

TrueSheet.displayName = 'TrueSheet';

module.exports = {
  TrueSheet,
  default: TrueSheet,
};

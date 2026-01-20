# Expo SDK 55 Native Tabs Reference

Reference documentation for Expo Router Native Tabs in SDK 55 canary.

## NativeTabsBottomAccessory

`NativeTabsBottomAccessory` is a component available for iOS 26+ that enables adding a bottom accessory to the `NativeTabs` component.

### Type Definition

```typescript
React.Element<React.FC<NativeTabsBottomAccessoryProps>>
```

### Props

| Prop | Platform | Type | Description |
|------|----------|------|-------------|
| `children` | iOS 26+ | `ReactNode` (Optional) | The content to render as the bottom accessory |

### Usage Example

```tsx
import { NativeTabs } from 'expo-router/unstable-native-tabs';

export default function Layout() {
  return (
    <NativeTabs>
      <NativeTabs.BottomAccessory>
        <YourAccessoryComponent />
      </NativeTabs.BottomAccessory>
      <NativeTabs.Trigger name="index" />
    </NativeTabs>
  );
}
```

### Key Details

- References Apple's official "bottom accessory" concept for tab bar controllers
- Must be placed within a `NativeTabs` wrapper
- Accessory content is customizable through the `children` prop
- Availability is limited to iOS version 26 and later

## Documentation Source

- Full docs: https://docs.expo.dev/versions/unversioned/sdk/router-native-tabs/#nativetabsbottomaccessory

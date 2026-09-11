# Native App Instructions

<!-- styling-ai-start -->

## React Native Styling Paradigm: Tailwind CSS vs. StyleSheet

We blend Tailwind CSS (via NativeWind) and React Native's native `StyleSheet` API. Follow this strict architectural boundary for all UI components.

### 1. Tailwind CSS (NativeWind) — The Default Choice

Use Tailwind CSS utility classes (`className="..."`) for **80-90% of all UI code**, focusing entirely on presentation, layouts, and typography.

- **Layouts & Spacing:** Always use Tailwind for Flexbox (`flex-1`, `items-center`), grid systems, margins, paddings, and alignment.
- **Design Tokens:** Always use Tailwind for background colors, typography sizes/weights, borders, border-radius, and absolute positioning constraints.
- **Component States:** Use Tailwind for conditional rendering strings (e.g., `className={\`p-4 ${isActive ? 'bg-blue-600' : 'bg-gray-200'}\`}`).

### 2. StyleSheet.create() — The Functional Exception

Reserve `StyleSheet.create` exclusively for edge cases where Tailwind cannot operate due to compilation limits, deep prop trees, or heavy runtime logic.

- **Dynamic Calculations:** Use StyleSheet when a value depends on explicit runtime math, device measurements, or state interpolation (e.g., `width: (windowWidth - 32) / 3`).
- **Platform-Specific Logic:** Use StyleSheet when branching styling deeply based on `Platform.select({ ios: ..., android: ... })` (e.g., native shadows, elevations).
- **Deep Component Props:** Use StyleSheet for sub-container props that strictly demand an Object instead of a string (e.g., `contentContainerStyle`, `columnWrapperStyle` in FlatLists/ScrollViews).
- **Animations:** Use StyleSheet or inline styles when binding styles directly to Reanimated shared values or layout animation nodes.

### 3. Implementation Example

When writing components, combine them gracefully. Apply layout utilities inline and pass functional overrides as an array to `style`:

```tsx
// Example of the expected combination pattern
import { Dimensions, Platform, StyleSheet, View, Text } from 'react-native';

const { width } = Dimensions.get('window');

export function ProductCard({ isFeatured }) {
  return (
    <View
      className="p-4 rounded-xl bg-white border border-gray-200"
      style={[styles.dynamicCard, isFeatured && styles.platformShadow]}
    >
      <Text className="text-lg font-bold text-gray-900">Product Title</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  dynamicCard: {
    width: (width - 48) / 2, // Runtime layout math
  },
  platformShadow: {
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1 },
      android: { elevation: 3 }
    })
  }
});
```

### 4. Refactoring Instructions

If you see existing code using inline object styles or massive `StyleSheet` blocks for simple flex containers, margins, or text styles, automatically refactor them to Tailwind CSS `className` utilities.

<!-- styling-ai-end -->
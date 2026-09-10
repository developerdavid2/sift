import type { SharedValue } from "react-native-reanimated";

export type TabPagerHeaderProps = {
  title: string;
  position: SharedValue<number>;
  scrollY: SharedValue<number>;
};

export type TabPagerPageProps = {
  scrollY: SharedValue<number>;
};

import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Dimensions, Pressable, StyleSheet, View } from "react-native";
import type { SharedValue } from "react-native-reanimated";
import Animated, {
  Extrapolation,
  interpolate,
  interpolateColor,
  useAnimatedReaction,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ChatScreen } from "@/features/chat/chat-screen";
import { ChatHeader } from "@/features/chat/chat-screen";
import { DigestHeader, DigestScreen } from "@/features/digest/digest-screen";
import { InboxHeader, InboxScreen } from "@/features/inbox/inbox-screen";
import {
  SettingsHeader,
  SettingsScreen,
} from "@/features/settings/settings-screen";
import type {
  TabPagerHeaderProps,
  TabPagerPageProps,
} from "@/components/tab-pager-types";
import { useThemeColors } from "@/lib/theme";

type IconName = keyof typeof Ionicons.glyphMap;

type PagerPage = {
  key: string;
  title: string;
  icon: IconName;
  iconFilled: IconName;
  Component: React.ComponentType<TabPagerPageProps>;
  Header: React.ComponentType<TabPagerHeaderProps>;
};

const PAGES: PagerPage[] = [
  {
    key: "inbox",
    title: "Inbox",
    icon: "mail-outline",
    iconFilled: "mail",
    Component: InboxScreen,
    Header: InboxHeader,
  },
  {
    key: "digest",
    title: "Digest",
    icon: "reader-outline",
    iconFilled: "reader",
    Component: DigestScreen,
    Header: DigestHeader,
  },
  {
    key: "chat",
    title: "Chat",
    icon: "chatbubble-ellipses-outline",
    iconFilled: "chatbubble-ellipses",
    Component: ChatScreen,
    Header: ChatHeader,
  },
  {
    key: "settings",
    title: "Settings",
    icon: "settings-outline",
    iconFilled: "settings",
    Component: SettingsScreen,
    Header: SettingsHeader,
  },
];

const AnimatedFlatList = Animated.FlatList;
const AnimatedIonicons = Animated.createAnimatedComponent(Ionicons);

function usePagerPosition(pageWidth: number, scrollX: SharedValue<number>) {
  const position = useDerivedValue(() =>
    pageWidth > 0 ? scrollX.value / pageWidth : 0,
  );
  return { position };
}

function PagerHeader({
  position,
  scrollY,
}: Omit<TabPagerHeaderProps, "title">) {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();

  return (
    <View
      style={[
        styles.header,
        { paddingTop: insets.top + 12, backgroundColor: colors.background },
      ]}
    >
      {PAGES.map((page, index) => {
        const titleStyle = useAnimatedStyle(() => {
          const opacity = interpolate(
            position.value,
            [index - 1, index, index + 1],
            [0, 1, 0],
            Extrapolation.CLAMP,
          );
          const translateY = interpolate(
            position.value,
            [index - 1, index, index + 1],
            [8, 0, -8],
            Extrapolation.CLAMP,
          );
          return { opacity, transform: [{ translateY }] };
        });

        const Header = page.Header;
        return (
          <Animated.View
            key={page.key}
            style={[StyleSheet.absoluteFill, titleStyle]}
          >
            <Header title={page.title} position={position} scrollY={scrollY} />
          </Animated.View>
        );
      })}
    </View>
  );
}

function PagerTabBar({
  position,
  activeIndex,
  onSelect,
}: {
  position: SharedValue<number>;
  activeIndex: number;
  onSelect: (index: number) => void;
}) {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();

  return (
    <View
      style={[
        styles.tabBar,
        {
          backgroundColor: colors.background,
          borderTopColor: colors.separator,
        },
      ]}
    >
      {PAGES.map((page, index) => {
        const iconStyle = useAnimatedStyle(() => ({
          color: interpolateColor(
            position.value,
            [index - 1, index, index + 1],
            [colors.muted, colors.brandPrimary, colors.muted],
          ),
        }));

        return (
          <Pressable
            key={page.key}
            onPress={() => onSelect(index)}
            android_ripple={null}
            style={[
              styles.tabButton,
              {
                paddingBottom: insets.bottom - 24,
                paddingTop: insets.top - 16,
              },
            ]}
          >
            <TabIndicator
              index={index}
              position={position}
              color={colors.brandPrimary}
            />
            <TabIcon
              page={page}
              index={index}
              position={position}
              activeIndex={activeIndex}
              color={colors}
            />
            <Animated.Text style={[styles.tabLabel, iconStyle]}>
              {page.title}
            </Animated.Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function TabIndicator({
  index,
  position,
  color,
}: {
  index: number;
  position: SharedValue<number>;
  color: string;
}) {
  const indicatorStyle = useAnimatedStyle(() => {
    const distance = Math.abs(position.value - index);
    const width = interpolate(distance, [0, 1], [60, 2], Extrapolation.CLAMP);
    return {
      width,
      opacity: interpolate(distance, [0, 1], [1, 0], Extrapolation.CLAMP),
      marginLeft: -width / 2,
    };
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.tabIndicator, { backgroundColor: color }, indicatorStyle]}
    />
  );
}

function TabIcon({
  page,
  index,
  position,
  activeIndex,
  color,
}: {
  page: PagerPage;
  index: number;
  position: SharedValue<number>;
  activeIndex: number;
  color: ReturnType<typeof useThemeColors>;
}) {
  const prevDistance = useSharedValue(1);

  const bounceStyle = useAnimatedStyle(() => {
    const distance = Math.abs(position.value - index);
    const approaching = distance < prevDistance.value;
    prevDistance.value = distance;

    const scale = approaching
      ? interpolate(distance, [0, 0.5, 1], [1, 1.14, 1], Extrapolation.CLAMP)
      : 1;

    return { transform: [{ scale }] };
  });

  const colorStyle = useAnimatedStyle(() => ({
    color: interpolateColor(
      position.value,
      [index - 1, index, index + 1],
      [color.muted, color.brandPrimary, color.muted],
    ),
  }));

  return (
    <Animated.View style={bounceStyle}>
      <AnimatedIonicons
        name={activeIndex === index ? page.iconFilled : page.icon}
        size={22}
        style={colorStyle}
        color={color.muted}
      />
    </Animated.View>
  );
}

export function TabPagerScreen() {
  const colors = useThemeColors();
  const listRef = useAnimatedRef<Animated.FlatList>();
  const isProgrammaticScroll = useSharedValue(false);
  const scrollX = useSharedValue(0);
  const scrollY = useSharedValue(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [pageWidth, setPageWidth] = useState(Dimensions.get("window").width);
  const { position } = usePagerPosition(pageWidth, scrollX);

  const handler = useAnimatedScrollHandler({
    onScroll: (event) => {
      if (!isProgrammaticScroll.value) {
        scrollX.value = event.contentOffset.x;
      }
    },
  });

  function goToPage(index: number) {
    const targetOffset = index * pageWidth;

    isProgrammaticScroll.value = true;

    listRef.current?.scrollToOffset({ offset: targetOffset, animated: false });

    scrollX.value = withTiming(targetOffset, { duration: 220 }, (finished) => {
      if (finished) {
        isProgrammaticScroll.value = false;
      }
    });

    setActiveIndex(index);
  }

  return (
    <View
      style={[styles.screen, { backgroundColor: colors.background }]}
      onLayout={(e) => setPageWidth(e.nativeEvent.layout.width)}
    >
      <PagerHeader position={position} scrollY={scrollY} />

      <AnimatedFlatList
        ref={listRef}
        data={PAGES}
        keyExtractor={(page) => page.key}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        onScroll={handler}
        scrollEventThrottle={16}
        getItemLayout={(_, index) => ({
          length: pageWidth,
          offset: pageWidth * index,
          index,
        })}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / pageWidth);
          setActiveIndex(index);
        }}
        initialNumToRender={PAGES.length}
        maxToRenderPerBatch={PAGES.length}
        windowSize={PAGES.length + 2}
        removeClippedSubviews={false}
        renderItem={({ item: page }) => (
          <View style={[styles.page, { width: pageWidth }]}>
            <page.Component scrollY={scrollY} />
          </View>
        )}
        style={styles.pager}
      />

      <PagerTabBar
        position={position}
        activeIndex={activeIndex}
        onSelect={goToPage}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    height: 56,
    justifyContent: "flex-end",
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  pager: {
    flex: 1,
  },
  page: {
    flex: 1,
  },
  tabBar: {
    flexDirection: "row",
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  tabButton: {
    position: "relative",
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  tabIndicator: {
    position: "absolute",
    top: 0,
    left: "50%",
    height: 3,
    borderRadius: 2,
  },
  tabLabel: {
    fontSize: 13,
  },
});

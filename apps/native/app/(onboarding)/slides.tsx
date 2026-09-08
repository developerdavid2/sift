import { Ionicons } from "@expo/vector-icons";
import { Button } from "heroui-native";
import { useEffect, useMemo, useRef, useState } from "react";
import { Dimensions, StyleSheet, View, type ViewToken } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  interpolateColor,
  type SharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";

import { Slide, SLIDES } from "@/constants/onboarding";
import { useThemeColors } from "@/lib/theme";
import { useAppReady } from "@/contexts/app-ready-context";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const STAGGER_DELAY = 110;
const ENTRANCE_DURATION = 420;
const ENTRANCE_TRAVEL = 16;

function Dot({
  index,
  scrollOffset,
  colors,
}: {
  index: number;
  scrollOffset: SharedValue<number>;
  colors: ReturnType<typeof useThemeColors>;
}) {
  const style = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * SCREEN_WIDTH,
      index * SCREEN_WIDTH,
      (index + 1) * SCREEN_WIDTH,
    ];
    const opacity = interpolate(
      scrollOffset.value,
      inputRange,
      [0.3, 1, 0.3],
      Extrapolation.CLAMP,
    );
    const width = interpolate(
      scrollOffset.value,
      inputRange,
      [8, 24, 8],
      Extrapolation.CLAMP,
    );
    const bg = interpolateColor(scrollOffset.value, inputRange, [
      colors.muted,
      colors.accent,
      colors.muted,
    ]);
    return { opacity, width, backgroundColor: bg };
  });

  return <Animated.View style={[styles.dot, style]} />;
}

function useEntranceStyle(isActive: boolean, delay: number) {
  const progress = useSharedValue(0);
  const hasPlayed = useRef(false);

  useEffect(() => {
    if (isActive && !hasPlayed.current) {
      hasPlayed.current = true;
      progress.value = withDelay(
        delay,
        withTiming(1, { duration: ENTRANCE_DURATION }),
      );
    }
  }, [isActive, delay, progress]);

  return useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      {
        translateY: interpolate(
          progress.value,
          [0, 1],
          [ENTRANCE_TRAVEL, 0],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));
}

function SlideContent({
  item,
  isActive,
  colors,
  themed,
}: {
  item: Slide;
  isActive: boolean;
  colors: ReturnType<typeof useThemeColors>;
  themed: { headline: object; body: object };
}) {
  const iconStyle = useEntranceStyle(isActive, 0);
  const headlineStyle = useEntranceStyle(isActive, STAGGER_DELAY);
  const bodyStyle = useEntranceStyle(isActive, STAGGER_DELAY * 2);

  return (
    <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
      <Animated.View
        style={[
          styles.iconWrap,
          { backgroundColor: colors.accentSoft },
          iconStyle,
        ]}
      >
        <Ionicons name={item.icon} size={56} color={colors.accent} />
      </Animated.View>
      <Animated.Text style={[styles.headline, themed.headline, headlineStyle]}>
        {item.headline}
      </Animated.Text>
      <Animated.Text style={[styles.body, themed.body, bodyStyle]}>
        {item.body}
      </Animated.Text>
    </View>
  );
}

export default function OnboardingSlidesScreen() {
  const { completeOnboarding } = useAppReady();
  const colors = useThemeColors();
  const scrollOffset = useSharedValue(0);
  const flatListRef = useRef<Animated.FlatList<Slide>>(null);
  const currentIndex = useRef(0);
  const [activeIndex, setActiveIndex] = useState(0);

  const onScroll = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollOffset.value = e.contentOffset.x;
    },
  });

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken<Slide>[] }) => {
      if (viewableItems[0]?.index != null) {
        currentIndex.current = viewableItems[0].index;
        setActiveIndex(viewableItems[0].index);
      }
    },
  );

  const themed = useMemo(
    () => ({
      screen: { backgroundColor: colors.background },
      headline: { color: colors.foreground },
      body: { color: colors.muted },
      skip: { color: colors.muted },
    }),
    [colors],
  );

  const handleNext = () => {
    const next = currentIndex.current + 1;
    if (next < SLIDES.length) {
      flatListRef.current?.scrollToIndex({ index: next, animated: true });
    } else {
      completeOnboarding();
    }
  };

  const renderItem = ({ item, index }: { item: Slide; index: number }) => (
    <SlideContent
      item={item}
      isActive={activeIndex === index}
      colors={colors}
      themed={themed}
    />
  );

  return (
    <View style={[styles.screen, themed.screen]}>
      <View style={styles.header}>
        <Button variant="ghost" onPress={completeOnboarding}>
          <Button.Label className="font-bold">Skip</Button.Label>
        </Button>
      </View>

      <Animated.FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderItem}
        keyExtractor={(_, i) => String(i)}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onViewableItemsChanged={onViewableItemsChanged.current}
        viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
      />

      <View style={styles.footer}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <Dot
              key={i}
              index={i}
              scrollOffset={scrollOffset}
              colors={colors}
            />
          ))}
        </View>

        <Button variant="primary" className="w-full" onPress={handleNext}>
          <Button.Label>
            {activeIndex === SLIDES.length - 1 ? "Get Started" : "Next"}
          </Button.Label>
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  slide: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 28,
  },
  iconWrap: {
    width: 112,
    height: 112,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  headline: {
    fontSize: 28,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: -0.5,
    lineHeight: 36,
  },
  body: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 8,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 56,
    gap: 20,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
});

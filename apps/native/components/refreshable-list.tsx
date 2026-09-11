import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  View,
  type FlatListProps,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle } from "react-native-svg";

import { useThemeColors } from "@/lib/theme";

const THRESHOLD = 72;
const REFRESH_OFFSET = 54;

type RefreshableListProps<T> = Omit<FlatListProps<T>, "onRefresh"> & {
  onRefresh?: () => void | Promise<void>;
  onRefreshStateChange?: (refreshing: boolean) => void;
};

export function RefreshableList<T>({
  onRefresh,
  onRefreshStateChange,
  ...rest
}: RefreshableListProps<T>) {
  const colors = useThemeColors();
  const listRef = useRef<FlatList<T>>(null);
  const scrollY = useSharedValue(0);
  const refreshingSV = useSharedValue(false);
  const rotation = useSharedValue(0);
  const pushedInset = useSharedValue(0);
  const [refreshing, setRefreshing] = useState(false);

  const onRefreshRef = useRef(onRefresh);
  useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  const progress = useDerivedValue(() => {
    if (refreshingSV.value) return 1;
    return Math.min(-scrollY.value / THRESHOLD, 1);
  });

  const trigger = useCallback(() => {
    if (refreshingSV.value) return;

    refreshingSV.value = true;
    setRefreshing(true);
    onRefreshStateChange?.(true);

    if (Platform.OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      pushedInset.value = withSpring(REFRESH_OFFSET, {
        mass: 0.6,
        damping: 14,
        stiffness: 170,
      });
      rotation.value = 0;
      rotation.value = withRepeat(
        withTiming(360, { duration: 850, easing: Easing.linear }),
        -1,
      );
    }

    Promise.resolve(onRefreshRef.current?.())
      .catch(() => {})
      .finally(() => {
        refreshingSV.value = false;
        setRefreshing(false);
        onRefreshStateChange?.(false);

        if (Platform.OS === "ios") {
          rotation.value = 0;
          pushedInset.value = withSpring(0, {
            mass: 0.6,
            damping: 16,
            stiffness: 160,
          });
        }
      });
  }, [onRefreshStateChange, pushedInset, refreshingSV, rotation]);

  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      scrollY.value = event.nativeEvent.contentOffset.y;
    },
    [scrollY],
  );

  const onScrollEndDrag = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (
        Platform.OS === "ios" &&
        event.nativeEvent.contentOffset.y < -THRESHOLD
      ) {
        trigger();
      }
    },
    [trigger],
  );

  const pushStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: pushedInset.value }],
  }));

  return (
    <View style={styles.wrapper}>
      <Animated.View style={[styles.listContainer, pushStyle]}>
        <FlatList
          ref={listRef}
          {...rest}
          onScroll={onScroll}
          scrollEventThrottle={16}
          onScrollEndDrag={onScrollEndDrag}
          alwaysBounceVertical
          refreshControl={
            Platform.OS === "android" ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={trigger}
                colors={[colors.brandPrimary]}
                tintColor={colors.brandPrimary}
                progressBackgroundColor={colors.surface}
              />
            ) : undefined
          }
        />
      </Animated.View>

      {Platform.OS === "ios" ? (
        <RefreshArc
          progress={progress}
          refreshing={refreshingSV}
          rotation={rotation}
          color={colors.brandPrimary}
        />
      ) : null}
    </View>
  );
}

const ARC_SIZE = 34;
const ARC_STROKE = 3.5;
const ARC_R = (ARC_SIZE - ARC_STROKE) / 2;
const ARC_CIRCUMFERENCE = 2 * Math.PI * ARC_R;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function RefreshArc({
  progress,
  refreshing,
  rotation,
  color,
}: {
  progress: ReturnType<typeof useDerivedValue<number>>;
  refreshing: ReturnType<typeof useSharedValue<boolean>>;
  rotation: ReturnType<typeof useSharedValue<number>>;
  color: string;
}) {
  const dashOffset = useDerivedValue(() =>
    refreshing.value
      ? ARC_CIRCUMFERENCE * 0.25
      : ARC_CIRCUMFERENCE * (1 - progress.value),
  );

  const arcProps = useAnimatedProps(() => ({
    strokeDashoffset: dashOffset.value,
  }));

  const containerStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: withSpring(0.5 + progress.value * 0.5) }],
  }));

  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Animated.View style={[styles.arc, containerStyle]} pointerEvents="none">
      <Animated.View style={spinStyle}>
        <Svg width={ARC_SIZE} height={ARC_SIZE}>
          <Circle
            cx={ARC_SIZE / 2}
            cy={ARC_SIZE / 2}
            r={ARC_R}
            stroke={color}
            strokeOpacity={0.16}
            strokeWidth={ARC_STROKE}
            fill="none"
          />
          <AnimatedCircle
            cx={ARC_SIZE / 2}
            cy={ARC_SIZE / 2}
            r={ARC_R}
            stroke={color}
            strokeWidth={ARC_STROKE}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={`${ARC_CIRCUMFERENCE}`}
            animatedProps={arcProps}
          />
        </Svg>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    position: "relative",
  },
  listContainer: {
    flex: 1,
  },
  arc: {
    position: "absolute",
    top: 10,
    left: 0,
    right: 0,
    alignItems: "center",
  },
});

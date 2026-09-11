import { IconButton } from "@/components/icon-button";
import { TabPagerHeaderProps } from "@/components/tab-pager-types";
import { useCurrentUser } from "@/hooks/queries/use-current-user";
import { useQueryState } from "@/hooks/queries/use-query";
import { useThemeColors } from "@/lib/theme";
import { api } from "@sift/backend/convex/_generated/api";
import { Avatar } from "heroui-native";
import { useMemo } from "react";
import { Text, View } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
} from "react-native-reanimated";

export function InboxHeader({ position }: TabPagerHeaderProps) {
  const colors = useThemeColors();
  const { user } = useCurrentUser();
  const counts = useQueryState(api.messages.entries.getCounts, {});
  const firstName = user?.name?.split(" ")[0] ?? "there";

  const initials = useMemo(() => {
    const name = user?.name?.trim();
    if (!name) return "?";
    const parts = name.split(/\s+/);
    return parts.length > 1
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : parts[0].slice(0, 2).toUpperCase();
  }, [user?.name]);

  const unreadUrgent = counts.data?.urgent ?? 0;

  const actionsStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      position.value,
      [0, 0.35],
      [1, 0],
      Extrapolation.CLAMP,
    ),
    transform: [
      {
        translateY: interpolate(
          position.value,
          [0, 0.35],
          [0, -6],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  return (
    <View className="flex-1 flex-row items-end justify-between px-3 pb-2.5">
      <View className="flex-row items-center gap-2.5">
        <Avatar size="sm" variant="soft" color="accent" alt={firstName}>
          {user?.avatarUrl ? (
            <Avatar.Image source={{ uri: user.avatarUrl }} />
          ) : null}
          <Avatar.Fallback>{initials}</Avatar.Fallback>
        </Avatar>
        <Text
          className="pb-0.5 text-xl font-black tracking-tight"
          style={{ color: colors.foreground }}
        >
          Hello, {firstName}
        </Text>
      </View>
      <Animated.View
        style={actionsStyle}
        className="flex-row items-center gap-2"
      >
        <IconButton
          icon="search-outline"
          tone="surface"
          size={38}
          onPress={() => {}}
          accessibilityLabel="Search"
        />
        <IconButton
          icon="notifications-outline"
          tone="brand"
          size={38}
          badge={unreadUrgent > 0}
          onPress={() => {}}
          accessibilityLabel="Notifications"
        />
      </Animated.View>
    </View>
  );
}

import { Ionicons } from "@expo/vector-icons";
import { api } from "@sift/backend/convex/_generated/api";
import { useMutation, usePaginatedQuery } from "convex/react";
import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Button } from "heroui-native";

import { Container } from "@/components/container";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { RefreshableList } from "@/components/refreshable-list";
import { ScreenSkeleton } from "@/components/screen-skeleton";
import type { TabPagerPageProps } from "@/components/tab-pager-types";
import { EmailCard } from "@/features/inbox/components/email-card";
import { FilterChips } from "@/features/inbox/components/filter-chips";
import type { FilterKey, PriorityFeedItem } from "@/features/inbox/types";
import { useConnectInbox } from "@/features/inbox/use-connect-inbox";
import { useDisconnectInbox } from "@/features/inbox/use-disconnect-inbox";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useQueryState } from "@/hooks/use-query";
import { useThemeColors } from "@/lib/theme";

const PAGE_SIZE = 20;

export const InboxScreen = (_props: TabPagerPageProps) => {
  const colors = useThemeColors();
  const { isLoading: userLoading, isAuthenticated } = useCurrentUser();

  const [filter, setFilter] = useState<FilterKey>("all");
  const [reloadKey, setReloadKey] = useState(0);

  const inboxes = useQueryState(api.connectedInboxes.entries.list, {});
  const counts = useQueryState(api.messages.entries.getCounts, {});
  const feed = usePaginatedQuery(
    api.messages.entries.getPriorityFeed,
    {
      inboxId: undefined,
      urgency: filter === "all" ? undefined : filter,
    },
    { initialNumItems: PAGE_SIZE },
  );
  const markRead = useMutation(api.messages.entries.markRead);

  const hasInbox =
    inboxes.data !== undefined &&
    inboxes.data !== null &&
    inboxes.data.length > 0;
  const isFirstLoad =
    inboxes.isLoading ||
    counts.isLoading ||
    (feed.isLoading && feed.results.length === 0);
  const hasError = !!inboxes.error || !!counts.error;

  const loadMoreRef = useRef(false);
  useEffect(() => {
    if (feed.status !== "LoadingMore") {
      loadMoreRef.current = false;
    }
  }, [feed.status]);

  const handleLoadMore = useCallback(() => {
    if (loadMoreRef.current || feed.status !== "CanLoadMore") return;
    loadMoreRef.current = true;
    feed.loadMore(PAGE_SIZE);
  }, [feed]);

  const handleEmailPress = useCallback(
    async (item: PriorityFeedItem) => {
      if (item.isRead) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      markRead({ messageId: item._id });
    },
    [markRead],
  );

  const handleRetry = useCallback(() => setReloadKey((key) => key + 1), []);
  const { state: connectState, connect } = useConnectInbox();
  const handleConnect = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    void connect();
  }, [connect]);

  const { state: disconnectState, disconnect } = useDisconnectInbox();
  const handleDisconnect = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    void disconnect();
  }, [disconnect]);

  const pullToRefresh = useCallback(
    () =>
      new Promise<void>((resolve) => {
        setTimeout(resolve, 550);
      }),
    [],
  );

  const screen = useMemo(() => {
    if (!userLoading && !isAuthenticated) {
      return (
        <View className="flex-1 justify-center pb-12">
          <EmptyState
            icon="lock-closed-outline"
            title="Sign in to Sift"
            subtitle="Your priority inbox, daily digest and AI chat live here."
            tone="muted"
          />
        </View>
      );
    }

    if (isFirstLoad) {
      return <ScreenSkeleton variant="feed" />;
    }

    if (hasError) {
      return (
        <View className="flex-1 justify-center pb-12">
          <ErrorState
            title="Couldn't load your inbox"
            message="Check your connection and try again."
            onRetry={handleRetry}
          />
        </View>
      );
    }

    if (!hasInbox) {
      return (
        <View className="flex-1 justify-center pb-12">
          <EmptyState
            icon="mail-open-outline"
            title="Connect your inbox"
            subtitle="Sift watches the Gmail inboxes you choose and surfaces only what matters."
            action={
              <View className="items-center gap-3">
                <Button
                  variant="primary"
                  onPress={handleConnect}
                  isDisabled={connectState.status === "connecting"}
                  className="min-w-48 rounded-2xl"
                >
                  <Ionicons
                    name="logo-google"
                    size={16}
                    color={colors.brandPrimaryForeground}
                  />
                  <Button.Label>
                    {connectState.status === "connecting"
                      ? "Connecting…"
                      : "Connect Gmail"}
                  </Button.Label>
                </Button>
                {connectState.status === "connecting" ? (
                  <Text
                    className="text-[13px]"
                    style={{ color: colors.muted }}
                  >
                    Waiting for Google…
                  </Text>
                ) : null}
              </View>
            }
          />
        </View>
      );
    }

    if (feed.results.length === 0) {
      return filter === "all" ? (
        <View className="flex-1 justify-center pb-12">
          <EmptyState
            icon="checkmark-done-outline"
            title="All caught up"
            subtitle="No urgent mail right now. New messages will appear here."
            tone="success"
          />
        </View>
      ) : (
        <View className="flex-1 justify-center pb-12">
          <EmptyState
            icon="filter-outline"
            title={`Nothing ${filter}`}
            subtitle="Try another filter or check back later."
            tone="muted"
          />
        </View>
      );
    }

    return (
      <RefreshableList
        data={feed.results}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <EmailCard item={item} onPress={() => handleEmailPress(item)} />
        )}
        ItemSeparatorComponent={() => <View className="h-2.5" />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        onRefresh={pullToRefresh}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.6}
        ListFooterComponent={
          feed.status === "LoadingMore" ? (
            <Text
              className="pt-3.5 text-center text-[13px]"
              style={[styles.footerText, { color: colors.muted }]}
            >
              Loading more…
            </Text>
          ) : null
        }
      />
    );
  }, [
    userLoading,
    isAuthenticated,
    isFirstLoad,
    hasError,
    hasInbox,
    feed,
    filter,
    colors,
    handleRetry,
    handleConnect,
    connectState,
    handleEmailPress,
    handleLoadMore,
    pullToRefresh,
    handleDisconnect,
    disconnectState,
  ]);

  return (
    <Container isScrollable={false}>
      <View className="flex-1">
        {hasInbox && !isFirstLoad && !hasError ? (
          <View>
            <FilterChips
              selected={filter}
              counts={counts.data}
              onChange={setFilter}
            />
            <View className="flex-row justify-end px-4 pt-1">
              <Button
                variant="outline"
                size="sm"
                onPress={handleDisconnect}
                isDisabled={disconnectState.status === "disconnecting"}
                className="rounded-full"
              >
                <Button.Label>
                  {disconnectState.status === "disconnecting"
                    ? "Disconnecting…"
                    : "Disconnect"}
                </Button.Label>
              </Button>
            </View>
          </View>
        ) : null}
        <View className="flex-1" key={reloadKey}>
          {screen}
        </View>
      </View>
    </Container>
  );
};

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 2,
    paddingBottom: 24,
  },
  footerText: {
    fontFamily: "Manrope_500Medium",
  },
});

import { Ionicons } from "@expo/vector-icons";
import { api } from "@sift/backend/convex/_generated/api";
import type { FunctionReturnType } from "convex/server";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { Container } from "@/components/container";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { ScreenSkeleton } from "@/components/screen-skeleton";
import type {
  TabPagerHeaderProps,
  TabPagerPageProps,
} from "@/components/tab-pager-types";
import { useQueryState } from "@/hooks/use-query";
import { useThemeColors } from "@/lib/theme";

type DigestResult = FunctionReturnType<typeof api.digests.entries.getToday>;

export const DigestScreen = (_props: TabPagerPageProps) => {
  const digest = useQueryState(api.digests.entries.getToday, {});
  const [reloadKey, setReloadKey] = useState(0);

  let content;
  if (digest.isLoading) {
    content = <ScreenSkeleton variant="digest" />;
  } else if (digest.error) {
    content = (
      <View style={styles.center}>
        <ErrorState
          title="Couldn't load your digest"
          message="Check your connection and try again."
          onRetry={() => setReloadKey((key) => key + 1)}
        />
      </View>
    );
  } else if (digest.data === null) {
    content = (
      <View style={styles.center}>
        <EmptyState
          icon="reader-outline"
          title="No digest yet"
          subtitle="Your plain-English summary appears here as soon as there's something to summarize."
        />
      </View>
    );
  } else {
    content = <DigestView digest={digest.data} />;
  }

  return (
    <Container isScrollable={false}>
      <View style={styles.screen} key={reloadKey}>
        {content}
      </View>
    </Container>
  );
};

function DigestView({ digest }: { digest: NonNullable<DigestResult> }) {
  const colors = useThemeColors();

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.digestContent}
    >
      <View style={styles.digestMeta}>
        <Text style={[styles.digestDate, { color: colors.foreground }]}>
          {formatDate(digest.date)}
        </Text>
        <Text style={[styles.digestHint, { color: colors.muted }]}>
          {digest.lines.length} thing{digest.lines.length === 1 ? "" : "s"} to
          notice
        </Text>
      </View>

      {digest.lines.length === 0 ? (
        <EmptyState
          icon="checkmark-done-outline"
          title="A quiet day"
          subtitle="Nothing worth your attention today."
          tone="success"
          compact
        />
      ) : (
        <View
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.separator },
          ]}
        >
          {digest.lines.map((line, index) => {
            const tint = colors[line.urgency];
            return (
              <View
                key={index}
                style={[
                  styles.line,
                  index < digest.lines.length - 1 && {
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    borderBottomColor: colors.separator,
                  },
                ]}
              >
                <View style={[styles.lineDot, { backgroundColor: tint }]} />
                <Text style={[styles.lineText, { color: colors.foreground }]}>
                  {line.text}
                </Text>
              </View>
            );
          })}
        </View>
      )}

      {digest.audioUrl ? (
        <View
          style={[
            styles.audioCard,
            { backgroundColor: colors.brandPrimarySoft },
          ]}
        >
          <Ionicons name="play-circle" size={36} color={colors.brandPrimary} />
          <View style={styles.audioMeta}>
            <Text style={[styles.audioTitle, { color: colors.brandPrimary }]}>
              Audio version
            </Text>
            <Text style={[styles.audioHint, { color: colors.brandPrimary }]}>
              Tap to listen along
            </Text>
          </View>
        </View>
      ) : (
        <Text style={[styles.comingSoon, { color: colors.muted }]}>
          Audio summaries are coming to Sift Pro.
        </Text>
      )}
    </ScrollView>
  );
}

function formatDate(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  const parsed = new Date(year, month - 1, day);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export function DigestHeader({ title }: TabPagerHeaderProps) {
  const colors = useThemeColors();
  return (
    <View style={styles.header}>
      <Text style={[styles.headerTitle, { color: colors.foreground }]}>
        {title}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "transparent",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    paddingBottom: 48,
  },
  digestContent: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 40,
  },
  digestMeta: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  digestDate: {
    fontSize: 17,
    fontFamily: "Manrope_700Bold",
    letterSpacing: -0.3,
  },
  digestHint: {
    fontSize: 13,
    fontFamily: "Manrope_500Medium",
  },
  card: {
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  line: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  lineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginTop: 6,
  },
  lineText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Manrope_500Medium",
    lineHeight: 20,
  },
  audioCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 18,
    padding: 16,
    marginTop: 16,
  },
  audioMeta: {
    flex: 1,
  },
  audioTitle: {
    fontSize: 15,
    fontFamily: "Manrope_700Bold",
  },
  audioHint: {
    fontSize: 13,
    fontFamily: "Manrope_400Regular",
    marginTop: 2,
  },
  comingSoon: {
    marginTop: 20,
    textAlign: "center",
    fontSize: 13,
    fontFamily: "Manrope_500Medium",
  },
  header: {
    flex: 1,
    justifyContent: "flex-end",
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
});

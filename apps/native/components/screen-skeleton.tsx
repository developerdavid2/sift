import { StyleSheet, View } from "react-native";

import { Skeleton } from "heroui-native";

type Variant = "feed" | "digest" | "settings" | "generic";

type Props = {
  variant?: Variant;
  rows?: number;
};

export function ScreenSkeleton({ variant = "generic", rows }: Props) {
  switch (variant) {
    case "feed":
      return <FeedSkeleton rows={rows ?? 6} />;
    case "digest":
      return <DigestSkeleton />;
    case "settings":
      return <SettingsSkeleton />;
    default:
      return <GenericSkeleton rows={rows ?? 5} />;
  }
}

function FeedSkeleton({ rows }: { rows: number }) {
  return (
    <View style={styles.stack}>
      {Array.from({ length: rows }).map((_, index) => (
        <View key={index} style={styles.card}>
          <View style={styles.cardRow}>
            <Skeleton className="h-10 w-10 rounded-full" />
            <View style={styles.cardMiddle}>
              <Skeleton
                className="h-3 w-24 rounded-md"
                animation={{ shimmer: { duration: 1400 } }}
              />
              <Skeleton
                className="mt-2 h-3 w-16 rounded-md"
                animation={{ shimmer: { duration: 1400 } }}
              />
            </View>
            <Skeleton
              className="h-3 w-8 rounded-md"
              animation={{ shimmer: { duration: 1400 } }}
            />
          </View>
          <Skeleton
            className="mt-3 h-3 w-3/4 rounded-md"
            animation={{ shimmer: { duration: 1400 } }}
          />
          <Skeleton
            className="mt-2 h-3 w-1/2 rounded-md"
            animation={{ shimmer: { duration: 1400 } }}
          />
        </View>
      ))}
    </View>
  );
}

function DigestSkeleton() {
  return (
    <View style={styles.stack}>
      <Skeleton className="h-6 w-40 rounded-md" />
      {Array.from({ length: 6 }).map((_, index) => (
        <View key={index} style={styles.lineRow}>
          <Skeleton
            className="h-2.5 w-2.5 rounded-full"
            animation={{ shimmer: { duration: 1400 } }}
          />
          <Skeleton
            className="ml-3 h-4 flex-1 rounded-md"
            animation={{ shimmer: { duration: 1400 } }}
          />
        </View>
      ))}
    </View>
  );
}

function SettingsSkeleton() {
  return (
    <View style={styles.stack}>
      <Skeleton className="h-4 w-24 rounded-md" />
      <View style={styles.group}>
        {Array.from({ length: 3 }).map((_, index) => (
          <View key={index} style={styles.row}>
            <Skeleton
              className="h-9 w-9 rounded-full"
              animation={{ shimmer: { duration: 1400 } }}
            />
            <Skeleton
              className="ml-3 h-4 flex-1 rounded-md"
              animation={{ shimmer: { duration: 1400 } }}
            />
          </View>
        ))}
      </View>
      <Skeleton className="mt-4 h-4 w-24 rounded-md" />
      <View style={styles.group}>
        {Array.from({ length: 2 }).map((_, index) => (
          <View key={index} style={styles.row}>
            <Skeleton
              className="h-9 w-9 rounded-full"
              animation={{ shimmer: { duration: 1400 } }}
            />
            <Skeleton
              className="ml-3 h-4 flex-1 rounded-md"
              animation={{ shimmer: { duration: 1400 } }}
            />
          </View>
        ))}
      </View>
    </View>
  );
}

function GenericSkeleton({ rows }: { rows: number }) {
  return (
    <View style={styles.stack}>
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton
          key={index}
          className="h-12 w-full rounded-xl"
          animation={{ shimmer: { duration: 1400 } }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 12,
  },
  card: {
    borderRadius: 18,
    backgroundColor: "transparent",
    padding: 4,
    gap: 8,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  cardMiddle: {
    flex: 1,
  },
  lineRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  group: {
    marginTop: 10,
    borderRadius: 18,
    backgroundColor: "transparent",
    padding: 12,
    gap: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
});

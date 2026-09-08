import { Ionicons } from "@expo/vector-icons";
import { TouchableOpacity, View } from "react-native";
import { useThemeColors } from "@/lib/theme";

type AuthProgressHeaderProps = {
  step: number;
  totalSteps?: number;
  onBack?: () => void;
};

export function AuthProgressHeader({
  step,
  totalSteps = 3,
  onBack,
}: AuthProgressHeaderProps) {
  const colors = useThemeColors();

  return (
    <View className="flex flex-row px-6 h-16 items-center drop-shadow-2xl">
      <View className="h-9 justify-center">
        {onBack ? (
          <TouchableOpacity
            onPress={onBack}
            hitSlop={12}
            style={{ width: 36, height: 36, justifyContent: "center" }}
          >
            <Ionicons name="chevron-back" size={24} color={colors.foreground} />
          </TouchableOpacity>
        ) : null}
      </View>

      <View className="flex-1 flex-row items-center gap-x-2 max-w-[60%] mx-auto">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <View
            key={i}
            style={{
              flex: 1,
              height: 7,
              borderRadius: 2,
              backgroundColor: i < step ? colors.accent : colors.border,
            }}
          />
        ))}
      </View>
    </View>
  );
}

import { Button, Spinner } from "heroui-native";
import type { ComponentProps } from "react";

type ButtonProps = ComponentProps<typeof Button>;

export function LoadingButton({
  isLoading,
  isDisabled: disabled,
  children,
  ...props
}: ButtonProps & { isLoading: boolean }) {
  return (
    <Button {...props} isDisabled={disabled || isLoading}>
      {isLoading ? <Spinner size="sm" /> : children}
    </Button>
  );
}

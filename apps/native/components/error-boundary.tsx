import { Component, Fragment, type ErrorInfo, type ReactNode } from "react";

import { ErrorState } from "@/components/error-state";

type Props = {
  children: ReactNode;
  title?: string;
  message?: string;
  onRetry?: () => void;
};

type State = {
  hasError: boolean;
  retryKey: number;
};

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, retryKey: 0 };

  static getDerivedStateFromError(): Partial<State> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary caught error:", error, info.componentStack);
  }

  private handleRetry = () => {
    this.setState((prev) => ({
      hasError: false,
      retryKey: prev.retryKey + 1,
    }));
    this.props.onRetry?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <ErrorState
          title={this.props.title}
          message={this.props.message}
          onRetry={this.handleRetry}
        />
      );
    }

    return <Fragment key={this.state.retryKey}>{this.props.children}</Fragment>;
  }
}

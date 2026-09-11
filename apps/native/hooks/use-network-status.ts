import * as Network from "expo-network";
import { useEffect, useState } from "react";

type NetworkState = {
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
};

const DEFAULT_STATE: NetworkState = {
  isConnected: null,
  isInternetReachable: null,
};

export function useNetworkStatus(): {
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
  isOffline: boolean;
  isUnknown: boolean;
} {
  const [state, setState] = useState<NetworkState>(DEFAULT_STATE);

  useEffect(() => {
    let isMounted = true;

    Network.getNetworkStateAsync()
      .then((snapshot) => {
        if (!isMounted) return;
        setState({
          isConnected: snapshot.isConnected ?? null,
          isInternetReachable: snapshot.isInternetReachable ?? null,
        });
      })
      .catch(() => {});

    const subscription = Network.addNetworkStateListener((next) => {
      if (!isMounted) return;
      setState({
        isConnected: next.isConnected ?? null,
        isInternetReachable: next.isInternetReachable ?? null,
      });
    });

    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, []);

  const knownConnected = state.isConnected !== false;
  const knownReachable =
    state.isInternetReachable === null ||
    state.isInternetReachable === undefined ||
    state.isInternetReachable !== false;

  return {
    isConnected: state.isConnected,
    isInternetReachable: state.isInternetReachable,
    isOffline: !knownConnected || !knownReachable,
    isUnknown: state.isConnected === null,
  };
}

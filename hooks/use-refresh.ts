import { useState } from "react";

export const useRefresh = (callback: () => Promise<void>) => {
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await callback();
    setRefreshing(false);
  };

  return { refreshing, onRefresh };
};
import { useEffect, useState } from "react";

export const useIsWindows = (): boolean => {
  const [isWindows, setIsWindows] = useState(false);

  useEffect(() => {
    const platform = navigator.platform.toLowerCase();
    const userAgent = navigator.userAgent.toLowerCase();
    const isWin = platform.includes("win") || userAgent.includes("windows");
    setIsWindows(isWin);
  }, []);

  return isWindows;
};

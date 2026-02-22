import { useColorScheme } from "react-native";

export const useThemeLogo = () => {
  const scheme = useColorScheme();

  return scheme === "dark"
    ? require("@/assets/images/logo-dark.png")
    : require("@/assets/images/logo-light.png");
};

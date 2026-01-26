//custom in real Roomie Finder Project
import { Unmatched } from "expo-router";
import { Text, View } from "react-native";

export default function NotFoundScreen() {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Text>404 - Page Not Found</Text>
      <Unmatched />
    </View>
  );
}

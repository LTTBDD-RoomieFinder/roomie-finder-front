import React from "react";
import { View, Text, StyleSheet } from "react-native";

export type DividerProps = {
  orientation?: "horizontal" | "vertical";
  thickness?: number;
  color?: string;
  margin?: number;
  text?: string;
  textStyle?: any;
};

const Divider = ({
  orientation = "horizontal",
  thickness = 1,
  color = "#E0E0E0",
  margin = 16,
  text,
  textStyle,
}: DividerProps) => {
  if (orientation === "vertical") {
    return (
      <View
        style={{
          width: thickness,
          backgroundColor: color,
          marginHorizontal: margin / 2,
        }}
      />
    );
  }

  // Horizontal divider
  if (text) {
    return (
      <View style={[styles.row, { marginVertical: margin / 2 }]}>
        <View
          style={[
            styles.line,
            { height: thickness, backgroundColor: color },
          ]}
        />
        <Text style={[styles.text, textStyle]}>{text}</Text>
        <View
          style={[
            styles.line,
            { height: thickness, backgroundColor: color },
          ]}
        />
      </View>
    );
  }

  return (
    <View
      style={{
        height: thickness,
        backgroundColor: color,
        marginVertical: margin / 2,
      }}
    />
  );
};

export default Divider;

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  line: {
    flex: 1,
  },
  text: {
    marginHorizontal: 10,
    color: "#999",
    fontSize: 14,
  },
});

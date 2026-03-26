import React from "react";
import { Platform, StyleSheet, TextInput, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useAppTheme } from "@/hooks/use-app-theme";

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onFilterPress: () => void;
  placeholder?: string;
  hasActiveFilters?: boolean;
  autoFocus?: boolean;
  inputRef?: React.RefObject<TextInput>;
}

export function SearchBar({
  value,
  onChangeText,
  onFilterPress,
  placeholder = "",
  hasActiveFilters = false,
  autoFocus = false,
  inputRef,
}: SearchBarProps) {
  const { color } = useAppTheme();

  return (
    <View style={styles.container}>
      <View style={[styles.inputContainer, { backgroundColor: color.card, borderColor: color.border }]}>
        <Feather name="search" size={20} color={color.icon} style={styles.searchIcon} />
        <TextInput
          ref={inputRef}
          style={[styles.input, { color: color.text }]}
          placeholder={placeholder}
          placeholderTextColor={color.placeholder}
          value={value}
          onChangeText={onChangeText}
          returnKeyType="search"
          autoFocus={autoFocus}
        />
        {value.length > 0 && (
          <TouchableOpacity onPress={() => onChangeText("")} style={styles.clearButton}>
            <Feather name="x-circle" size={18} color={color.icon} />
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity
        style={[
          styles.filterButton,
          { 
            backgroundColor: hasActiveFilters ? color.primary : color.card,
            borderColor: hasActiveFilters ? color.primary : color.border,
          }
        ]}
        onPress={onFilterPress}
      >
        <Feather 
          name="sliders" 
          size={20} 
          color={hasActiveFilters ? color.primaryText : color.icon} 
        />
        {hasActiveFilters && <View style={styles.activeDot} />}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  inputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 12,
    borderCurve: "continuous",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.06,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
      },
      android: {
        elevation: 1,
      },
      default: {},
    }),
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: "100%",
    fontSize: 16,
  },
  clearButton: {
    padding: 4,
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    borderCurve: "continuous",
    position: "relative",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.06,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
      },
      android: {
        elevation: 1,
      },
      default: {},
    }),
  },
  activeDot: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "transparent",
  },
});

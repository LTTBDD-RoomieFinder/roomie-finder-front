import { Tabs } from "expo-router";
import React from "react";

import { HapticTab } from "@/components/haptic-tab";
import { profileTabGuard } from "@/utils/profile-tab-guard";
import { TabBarIconWithBadge } from "@/components/tab-bar-icon-with-badge";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useNotificationStore } from "@/stores/use-notification-store";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const requestUnread = useNotificationStore((s) => s.requestUnreadCount);
  const chatUnreadRooms = useNotificationStore((s) => s.chatUnreadRoomsCount);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        // Phụ thuộc badge để layout re-render khi store đổi (một số bản RN/React Navigation không cập nhật icon tab khi chỉ child subscribe).
        tabBarStyle: {
          opacity: 1 + (requestUnread + chatUnreadRooms) * 0,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            const state = navigation.getState();
            const current = state.routes[state.index];
            if (current.name === "profile" && profileTabGuard.isDirty()) {
              e.preventDefault();
              profileTabGuard.requestNavigation("home");
            }
          },
        })}
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="house.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="room"
        options={{
          title: "Room",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="bed.double.fill" color={color} />
          ),
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            const state = navigation.getState();
            const current = state.routes[state.index];
            if (current.name === "profile" && profileTabGuard.isDirty()) {
              e.preventDefault();
              profileTabGuard.requestNavigation("room");
              return;
            }
            e.preventDefault();
            navigation.navigate("room", { screen: "index" });
          },
        })}
      />
      <Tabs.Screen
        name="requests"
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            const state = navigation.getState();
            const current = state.routes[state.index];
            if (current.name === "profile" && profileTabGuard.isDirty()) {
              e.preventDefault();
              profileTabGuard.requestNavigation("requests");
            }
          },
        })}
        options={{
          title: "Requests",
          tabBarIcon: ({ color }) => (
            <TabBarIconWithBadge
              name="envelope.fill"
              color={color}
              variant="requests"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="chats"
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            const state = navigation.getState();
            const current = state.routes[state.index];
            if (current.name === "profile" && profileTabGuard.isDirty()) {
              e.preventDefault();
              profileTabGuard.requestNavigation("chats");
            }
          },
        })}
        options={{
          title: "Chats",
          tabBarIcon: ({ color }) => (
            <TabBarIconWithBadge
              name="bubble.left.and.bubble.right.fill"
              color={color}
              variant="chats"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="person.fill" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

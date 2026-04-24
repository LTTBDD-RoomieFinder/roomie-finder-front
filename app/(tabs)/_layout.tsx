import { Tabs } from "expo-router";
import React from "react";

import { HapticTab } from "@/components/haptic-tab";
import { TabBarIconWithBadge } from "@/components/tab-bar-icon-with-badge";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useLanguage } from "@/hooks/use-language";
import { useNotificationStore } from "@/stores/use-notification-store";
import { profileTabGuard } from "@/utils/profile-tab-guard";

export default function TabLayout() {
  const { color } = useAppTheme();
  const { t } = useLanguage();
  const requestUnread = useNotificationStore((s) => s.requestUnreadCount);
  const chatUnreadRooms = useNotificationStore((s) => s.chatUnreadRoomsCount);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: color.tint,
        headerShown: false,
        tabBarButton: HapticTab,
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
          title: t("tabs.home"),
          tabBarLabel: t("tabs.home"),
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="house.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            const state = navigation.getState();
            const current = state.routes[state.index];
            if (current.name === "profile" && profileTabGuard.isDirty()) {
              e.preventDefault();
              profileTabGuard.requestNavigation("map");
            }
          },
        })}
        options={{
          title: t("tabs.map"),
          tabBarLabel: t("tabs.map"),
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="map.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="room"
        options={{
          title: t("tabs.room"),
          tabBarLabel: t("tabs.room"),
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
          title: t("tabs.requests"),
          tabBarLabel: t("tabs.requests"),
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
          title: t("tabs.chats"),
          tabBarLabel: t("tabs.chats"),
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
          title: t("tabs.profile"),
          tabBarLabel: t("tabs.profile"),
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="person.fill" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

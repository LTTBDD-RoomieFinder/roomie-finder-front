# Component Guidelines

## 1. Create a New Screen (Route)

### 1.1 Choose Correct Route Folder
- Auth-related screen: `app/(auth)/...`
- Main app tab screen: `app/(tabs)/...`
- Room feature screen: `app/(tabs)/room/...`

### 1.2 Screen Template
Use this baseline structure:

```tsx
import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { useAppTheme } from "@/hooks/use-app-theme";

export default function ExampleScreen() {
  const { color } = useAppTheme();
  const [loading, setLoading] = useState(false);

  return (
    <ThemedView style={styles.root}>
      <View>
        <ThemedText type="title">Example</ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
```

### 1.3 Screen Rules
1. Keep data calls in event handlers/effects.
2. Call service functions, not API modules directly.
3. Keep navigation via `useRouter()` or `router` helpers from `expo-router`.

## 2. Create a Reusable Component

### 2.1 Placement
- Generic control: `components/ui/`
- Domain-specific room component: `components/room/`

### 2.2 Component Template
```tsx
import React from "react";
import { StyleSheet, View } from "react-native";
import { ThemedText } from "@/components/themed-text";

type Props = {
  title: string;
};

export function ExampleCard({ title }: Props) {
  return (
    <View style={styles.card}>
      <ThemedText>{title}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 12,
  },
});
```

### 2.3 Component Rules
1. Use explicit prop types.
2. Keep component pure and callback-driven.
3. Avoid implicit global state reads unless clearly justified.

## 3. Create a Custom Hook

### 3.1 Placement
- Shared hook: `hooks/use-*.ts`
- Keep simple feature-only state local unless reused.

### 3.2 Hook Template
```ts
import { useState } from "react";

export function useExample() {
  const [value, setValue] = useState(0);
  const increase = () => setValue((v) => v + 1);
  return { value, increase };
}
```

### 3.3 Hook Rules
1. Name starts with `use`.
2. Return a stable, explicit API.
3. Keep side effects predictable and scoped.

## 4. Create a Service + API Pair

### 4.1 API Module Example (`apis/example-api.ts`)
```ts
import axiosRequest from "@/config/axios";

export const exampleApi = {
  getItems: () => axiosRequest.get("/example"),
  createItem: (payload: ExampleCreateRequest) => axiosRequest.post("/example", payload),
};
```

### 4.2 Service Module Example (`services/example-service.ts`)
```ts
import { exampleApi } from "@/apis/example-api";

export const exampleService = {
  async getItems() {
    const res = await exampleApi.getItems();
    return res;
  },
  async createItem(payload: ExampleCreateRequest) {
    const res = await exampleApi.createItem(payload);
    return res;
  },
};
```

### 4.3 Service/API Rules
1. API file owns endpoint path strings.
2. Service file is consumed by screen/components.
3. Keep transport/auth behavior centralized in `config/axios.ts`.

## 5. Room Feature-Specific Notes
1. Prefer reusing `RoomForm` for create/edit style flows.
2. Keep display formatting in `utils/format-room.ts` style utility functions.
3. Keep enum label mappings in `constants/room-constants.ts`.

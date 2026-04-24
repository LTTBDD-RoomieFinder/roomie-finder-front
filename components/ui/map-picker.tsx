import React, { useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import MapView, { MapPressEvent, Marker } from "react-native-maps";

import { getNativeMapProvider } from "@/utils/map-runtime";

type Props = {
  latitude?: number;
  longitude?: number;
  onLocationSelect: (lat: number, lng: number) => void;
};

export default function MapPicker({
  latitude,
  longitude,
  onLocationSelect,
}: Props) {
  const [selectedLocation, setSelectedLocation] = useState(
    latitude && longitude
      ? { latitude, longitude }
      : null
  );

  const provider = useMemo(() => getNativeMapProvider(), []);

  useEffect(() => {
    if (latitude != null && longitude != null) {
      setSelectedLocation({ latitude, longitude });
    }
  }, [latitude, longitude]);

  const handlePress = (event: MapPressEvent) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;

    setSelectedLocation({ latitude, longitude });
    onLocationSelect(latitude, longitude);
  };

  return (
    <View style={styles.container}>
      <MapView
        provider={provider}
        style={styles.map}
        initialRegion={{
          latitude: latitude || 21.0285,
          longitude: longitude || 105.8542,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        onPress={handlePress}
      >
        {selectedLocation && (
          <Marker coordinate={selectedLocation} />
        )}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 300,
    borderRadius: 16,
    overflow: "hidden",
    marginTop: 12,
  },
  map: {
    flex: 1,
  },
});
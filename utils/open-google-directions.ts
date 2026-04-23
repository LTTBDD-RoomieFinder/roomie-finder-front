import * as Linking from "expo-linking";
import * as Location from "expo-location";

/**
 * Mở Google Maps (app hoặc web) chỉ đường tới đích.
 * Nếu đã cấp quyền vị trí, thêm `origin` = GPS hiện tại; không thì Google dùng “vị trí hiện tại”.
 */
export async function openGoogleMapsDirections(
  destLat: number,
  destLng: number,
): Promise<void> {
  if (!Number.isFinite(destLat) || !Number.isFinite(destLng)) {
    throw new Error("Invalid destination coordinates");
  }

  let url = `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}&travelmode=driving`;

  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status === Location.PermissionStatus.GRANTED) {
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const { latitude, longitude } = pos.coords;
      if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
        url = `https://www.google.com/maps/dir/?api=1&origin=${latitude},${longitude}&destination=${destLat},${destLng}&travelmode=driving`;
      }
    }
  } catch {
    /* giữ URL chỉ có destination */
  }

  await Linking.openURL(url);
}

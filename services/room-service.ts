import { roomApi } from "@/apis/room-api";
import { RoomCreateRequest } from "@/data/request";
import { RoomResponse } from "@/data/response";

/**
 * Interceptor trả về `response.data` — một số endpoint gói thêm `{ data: entity }`, một số trả thẳng phòng.
 */
function unwrapEntity<T>(res: unknown): T {
  if (res == null || typeof res !== "object") {
    throw new Error("Empty room response");
  }
  const o = res as Record<string, unknown>;
  if (o.data != null && typeof o.data === "object") {
    return o.data as T;
  }
  return res as T;
}

export const roomService = {
  async createRoom(roomCreateRequest: RoomCreateRequest){
    const res = await roomApi.createRoom(roomCreateRequest);
    return res;
  },

  async getRooms() {
    const res = await roomApi.getRooms();
    return res;
  },

  async getRoomById(id: number): Promise<RoomResponse> {
    const res = await roomApi.getRoomById(id);
    return unwrapEntity<RoomResponse>(res);
  },

  async getMyRooms() {
    const res = await roomApi.getMyRooms();
    return res;
  },

  async deleteRoom(id: number) {
    const res = await roomApi.deleteRoom(id);
    return res;
  },

  async updateRoom(id: number, roomCreateRequest: RoomCreateRequest) {
    const res = await roomApi.updateRoom(id, roomCreateRequest);
    return res;
  },
}
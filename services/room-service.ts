import { roomApi } from "@/apis/room-api";
import { RoomCreateRequest } from "@/data/request";
import { RoomResponse } from "@/data/response";

export const roomService = {
  async createRoom(roomCreateRequest: RoomCreateRequest){
    const res = await roomApi.createRoom(roomCreateRequest);
    return res;
  },

  async getRooms() {
    const res = await roomApi.getRooms();
    return res;
  },

  async getRoomById(id: number) {
    const res = await roomApi.getRoomById(id);
    return res;
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
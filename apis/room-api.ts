import axiosRequest from "@/config/axios";
import { RoomCreateRequest } from "@/data/request";

export const roomApi = {
  createRoom: (roomCreateRequest: RoomCreateRequest) => {
    return axiosRequest.post("/rooms", roomCreateRequest);
  },

  getRooms: () => {
    return axiosRequest.get("/rooms");
  },

  getRoomById: (id: number) => {
    return axiosRequest.get(`/rooms/${id}`);
  },

  getMyRooms: () => {
    return axiosRequest.get("/rooms/me");
  },

  deleteRoom: (id: number) => {
    return axiosRequest.delete(`/rooms/${id}`);
  },

  updateRoom: (id: number, roomCreateRequest: RoomCreateRequest) => {
    return axiosRequest.put(`/rooms/${id}`, roomCreateRequest);
  }
}
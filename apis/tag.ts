import axiosRequest from "@/config/axios";

export const tagApi = {
  getTag: () => {
    return axiosRequest.get("/tags");
  },
};

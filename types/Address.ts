export type City = {
  id: number;
  name: string;
  districts: District[];
}

export type District = {
  id: number;
  name: string;
  wards: Ward[];
}

export type Ward = {
  id: number;
  name: string;
}

export type Address = {
  id: number;
  streetAddress: string;
  city: City;
  district: District;
  ward: Ward;
};

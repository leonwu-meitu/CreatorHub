import provincesSource from "./data/indonesia-provinces.json";
import regenciesSource from "./data/indonesia-regencies.json";

// Source: https://github.com/Caknoooo/provinces-cities-indonesia (MIT)

type ProvinceSource = { id:number; province:string };
type RegencySource = { id:number; province_id:number; regency:string; type:string };

const provinces = provincesSource as ProvinceSource[];
const regencies = regenciesSource as RegencySource[];

export type IndonesiaProvince = { id:number; name:string };
export type IndonesiaCity = { id:number; provinceId:number; name:string };

export const indonesiaProvinces:IndonesiaProvince[] = provinces
  .map(item=>({id:item.id,name:item.province}))
  .sort((a,b)=>a.name.localeCompare(b.name,"id"));

export const indonesiaCities:IndonesiaCity[] = regencies
  .filter(item=>item.type==="Kota")
  .map(item=>({id:item.id,provinceId:item.province_id,name:`${item.type} ${item.regency}`}))
  .sort((a,b)=>a.name.localeCompare(b.name,"id"));

export const citiesForProvince = (provinceName:string) => {
  const province=indonesiaProvinces.find(item=>item.name===provinceName);
  return province?indonesiaCities.filter(item=>item.provinceId===province.id):[];
};

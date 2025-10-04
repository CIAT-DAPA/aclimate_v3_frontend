const GEOSERVER_PRODUCTION_URL ="https://geo.aclimate.org/geoserver/historical_climate_hn/wms";
const APP_ID_CO ="1";
const APP_ID_HN ="2";


export class Configuration{
  static getGeoserverUrl() {
    return GEOSERVER_PRODUCTION_URL;
  }
  static getColombiaAppId() {
    return APP_ID_CO;
  }
}
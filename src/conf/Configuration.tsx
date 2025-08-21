const GEOSERVER_PRODUCTION_URL ="https://geo.aclimate.org/geoserver/historical_climate_hn/wms";

class Configuration{
  static getGeoserverUrl() {
    return GEOSERVER_PRODUCTION_URL;
  }
}
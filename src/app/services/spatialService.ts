import axios from "axios";

export const spatialService = {
    getDatesFromGeoserver: async (wmsUrl: string, layer: string) => {
        try {
        const url = `${wmsUrl}?service=WMS&version=1.3.0&request=GetCapabilities`;
        const response = await axios.get(url);

        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(response.data, "text/xml");
        const layers = xmlDoc.getElementsByTagName("Layer");
        let dates: string[] = [];

        for (let i = 0; i < layers.length; i++) {
            const layerName = layers[i].getElementsByTagName("Name")[0].textContent;
            if (layerName === layer.split(":")[1]) {
            const dimension = layers[i].getElementsByTagName("Dimension")[0].textContent;
                if (dimension) {
                            const timeInterval = dimension.split(",");
                            dates = timeInterval.map((date) => {
                                const datePart = date.split("T")[0];
                                // Validar que la fecha tenga el formato correcto
                                if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
                                    return datePart;
                                } else {
                                    console.warn("Invalid date format:", datePart);
                                    return null;
                                }
                            }).filter(date => date !== null) as string[];
                            break;
                        }
            }
        }
        console.log("Fetched dates from GeoServer:", dates);
        return dates;
        } catch (error) {
        console.error("Error fetching dates from GeoServer:", error);
        return [];
        }
    }
}

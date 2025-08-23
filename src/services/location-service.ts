
'use server';

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

export async function getLocation(lat: number, lon: number): Promise<string> {
    if (!GOOGLE_MAPS_API_KEY) {
        console.error("Google Maps API key is not configured.");
        // Fallback for development if API key is not set
        return "Bilinmeyen Konum"; 
    }

    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lon}&key=${GOOGLE_MAPS_API_KEY}&language=tr&result_type=administrative_area_level_2|locality`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.status !== 'OK' || !data.results || data.results.length === 0) {
            throw new Error(`Google Maps API error: ${data.status} - ${data.error_message || 'No results found.'}`);
        }

        const cityComponent = data.results[0].address_components.find(
            (c: any) => c.types.includes('administrative_area_level_1')
        );
        const districtComponent = data.results[0].address_components.find(
            (c: any) => c.types.includes('administrative_area_level_2') || c.types.includes('locality')
        );

        const city = cityComponent ? cityComponent.long_name : null;
        const district = districtComponent ? districtComponent.long_name : null;

        if (city && district) {
            return `${city}, ${district}`;
        } else if (city) {
            return city;
        } else if (district) {
            return district;
        }

        return "Bilinmeyen Konum";

    } catch (error) {
        console.error("Failed to fetch location from Google Maps API:", error);
        throw new Error("Konum bilgisi alınırken bir hata oluştu.");
    }
}

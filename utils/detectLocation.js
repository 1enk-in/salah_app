export async function detectLocation() {
  try {
    const res = await fetch("https://ipapi.co/json/");
    const data = await res.json();

    return {
      city: data.city,
      country: data.country_name,
      timezone: data.timezone,
      lat: data.latitude,
      lon: data.longitude
    };
  } catch {
    return null;
  }
}
export async function fetchPrayerTimes(lat, lon, method = 2) {
  const res = await fetch(
    `https://api.aladhan.com/v1/timings?latitude=${lat}&longitude=${lon}&method=${method}`
  );
  const data = await res.json();

  return {
    fajr: data.data.timings.Fajr,
    dhuhr: data.data.timings.Dhuhr,
    asr: data.data.timings.Asr,
    maghrib: data.data.timings.Maghrib,
    isha: data.data.timings.Isha
  };
}
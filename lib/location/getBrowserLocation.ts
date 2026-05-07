export type BrowserLocation = {
  lat: number;
  lng: number;
  accuracy: number | null;
  altitude: number | null;
  heading: number | null;
  speed: number | null;
};

export function getBrowserLocation(timeoutMs = 20_000): Promise<BrowserLocation> {
  if (!("geolocation" in navigator)) {
    return Promise.reject(new Error("Geolocation is not supported by this browser."));
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy ?? null,
          altitude: position.coords.altitude ?? null,
          heading: position.coords.heading ?? null,
          speed: position.coords.speed ?? null
        });
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 15_000,
        timeout: timeoutMs
      }
    );
  });
}

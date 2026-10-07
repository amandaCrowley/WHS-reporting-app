import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./IssueMap.css";
import { isValidCoordinates } from "../../../shared/validation.js";

// Initial campus-area views only; a location is saved only after the user selects it.
const campusCenters = {
  Callaghan: [-32.892, 151.704],
  "Newcastle City": [-32.927, 151.771],
  Ourimbah: [-33.359, 151.378],
  "Gosford Hospital": [-33.419, 151.342],
  "Gosford Mann Street": [-33.424, 151.343],
  Sydney: [-33.868, 151.205],
  "Port Macquarie": [-31.454, 152.879],
};

export default function IssueMap({ campus, value, onChange, readOnly = false }) {
  const container = useRef(null);
  const map = useRef(null);
  const marker = useRef(null);
  const change = useRef(onChange);
  const request = useRef(0);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState("");
  const valid = isValidCoordinates(value);
  const latitude = valid ? value.latitude : null;
  const longitude = valid ? value.longitude : null;

  useEffect(() => { change.current = onChange; }, [onChange]);

  useEffect(() => {
    const instance = L.map(container.current, { scrollWheelZoom: false });
    map.current = instance;
    instance.on("moveend", () => setLocating(false));
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).on("tileerror", () => setError("Map tiles could not load. You can still enter the specific location and submit your report.")).addTo(instance);
    if (!readOnly) {
      instance.on("click", ({ latlng }) => {
        request.current += 1;
        setLocating(false);
        change.current?.({ latitude: latlng.lat, longitude: latlng.wrap().lng });
      });
    }
    const resize = new ResizeObserver(() => instance.invalidateSize());
    resize.observe(container.current);
    return () => {
      request.current += 1;
      resize.disconnect();
      instance.remove();
      map.current = null;
      marker.current = null;
    };
  }, [readOnly]);

  useEffect(() => {
    request.current += 1;
    const point = latitude !== null ? [latitude, longitude] : campusCenters[campus] || campusCenters.Callaghan;
    map.current.setView(point, 16);
    if (marker.current) marker.current.remove();
    marker.current = latitude !== null
      ? L.circleMarker(point, { radius: 9, color: "#164e63", fillColor: "#06b6d4", fillOpacity: 1 }).addTo(map.current)
      : null;
  }, [campus, latitude, longitude, readOnly]);

  const locate = () => {
    if (!navigator.geolocation) {
      setError("Your browser does not support location. Click the map to select a point instead.");
      return;
    }
    setError("");
    setLocating(true);
    const id = ++request.current;
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      if (id !== request.current) return;
      setLocating(false);
      change.current?.({ latitude: coords.latitude, longitude: coords.longitude });
    }, () => {
      if (id !== request.current) return;
      setLocating(false);
      setError("Could not get your location. Allow location access or click the map instead.");
    }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });
  };

  return (
    <div className="issue-map">
      {!readOnly && <p>Map pin (optional): select a campus, then click the map at the incident location. Keep building and room details in Specific Location.</p>}
      <div ref={container} className="issue-map-canvas" role="region" aria-label="Incident location map" />
      <p aria-live="polite">{valid ? `Selected location: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}` : "No map pin selected."}</p>
      {!readOnly && <div className="issue-map-actions">
        <button type="button" onClick={locate} disabled={locating}>{locating ? "Finding location…" : "Use my location"}</button>
        <button type="button" onClick={() => change.current?.({ latitude: map.current.getCenter().lat, longitude: map.current.getCenter().wrap().lng })}>Use map centre</button>
        <button type="button" disabled={!valid} onClick={() => change.current?.(null)}>Remove pin</button>
      </div>}
      {valid && <a href={`https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=18/${latitude}/${longitude}`} target="_blank" rel="noopener noreferrer">Open location in OpenStreetMap</a>}
      {error && <p role="alert">{error}</p>}
    </div>
  );
}

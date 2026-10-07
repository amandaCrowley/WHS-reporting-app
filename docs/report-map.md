# Report locations and name validation

## Using the map

1. Open **Report Issues** and select a campus. This centres the map on the campus area; it does not select a location for you.
2. Click the incident location to place a pin, or choose **Use my location** and allow browser location access. Check the selected point before submitting.
3. For keyboard selection, focus the map, use the arrow keys to pan and +/- to zoom, then choose **Use map centre**.
4. Enter building, floor or room details in **Specific Location**. This is required even when a pin is selected.
5. Submit the report or save a draft. The pin is retained in both. Saved pins appear in issue details and can be changed or removed in Edit Issue.

The map is optional. Changing the campus clears the old pin. Reports and drafts created before this feature still work without coordinates.

## Setup

Run `npm install` in `client` to install Leaflet, then start the client and server normally. No map API key is needed. Map tiles require internet access to OpenStreetMap. Browser geolocation requires localhost or HTTPS and the user's permission.

The API stores `coordinates` as `{ "latitude": -32.892, "longitude": 151.704 }`, or `null`. Issue creation accepts this object in JSON; multipart issue updates accept its JSON-encoded representation. The API rejects non-numeric, non-finite and out-of-range coordinates.

## Names

The app has first and last names, not a separate editable username. Registration, profile edits and administrator user edits share frontend/backend validation in `shared/validation.js`. Keep the `shared` directory when deploying the client or server.

Names must be 2–50 characters after trimming. International letters, combining accents, spaces, hyphens and apostrophes are supported. Digits and symbols such as `!@#$%^` are rejected with a validation message.

## Manual checks

- Select a pin, save a draft, reload it, submit, and confirm the same point appears in issue details.
- Edit the pin, remove it, and change campus; verify each saved result.
- Deny browser location permission and confirm manual pin selection and text-only submission still work.
- Try `Jane!` in profile and admin edits; verify it is rejected. Try `Anne-Marie` or `Nguyễn`; verify they are accepted.

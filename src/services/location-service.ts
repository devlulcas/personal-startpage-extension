import {
	getStoredLocation,
	type LocationConfig,
	saveLocation,
} from "../config/location";
import { err, ok, type Result } from "../types/result";

export function readStoredLocation(): LocationConfig | null {
	return getStoredLocation();
}

export function persistLocation(
	location: LocationConfig,
): Result<LocationConfig, "invalid_location"> {
	if (
		!location.city ||
		Number.isNaN(location.latitude) ||
		Number.isNaN(location.longitude)
	) {
		return err(
			"invalid_location",
			"Location must include a city and valid coordinates.",
		);
	}

	saveLocation(location);
	return ok(location);
}

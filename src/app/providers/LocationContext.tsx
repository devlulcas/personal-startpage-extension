import { createContext, useContext, useMemo, useState } from "react";
import type { LocationConfig } from "../../config/location";
import { readStoredLocation } from "../../services/location-service";

interface LocationContextValue {
	location: LocationConfig | null;
	setLocation: (location: LocationConfig | null) => void;
}

const LocationContext = createContext<LocationContextValue | null>(null);

export function LocationProvider({ children }: { children: React.ReactNode }) {
	const [location, setLocation] = useState<LocationConfig | null>(() =>
		readStoredLocation(),
	);

	const value = useMemo<LocationContextValue>(
		() => ({ location, setLocation }),
		[location],
	);

	return (
		<LocationContext.Provider value={value}>
			{children}
		</LocationContext.Provider>
	);
}

export function useLocationContext(): LocationContextValue {
	const context = useContext(LocationContext);
	if (!context) {
		throw new Error("useLocationContext must be used within LocationProvider.");
	}

	return context;
}

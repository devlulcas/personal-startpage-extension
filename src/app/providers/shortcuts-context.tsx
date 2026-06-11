import {
	createContext,
	useCallback,
	useContext,
	useMemo,
	useState,
} from "react";
import { toaster } from "../../components/toast/toast";
import {
	createShortcutInput,
	getShortcuts,
	normalizeShortcuts,
	type ShortcutConfig,
	saveShortcuts,
} from "../../config/shortcuts";

type ShortcutInput = Omit<ShortcutConfig, "id">;

type ShortcutsContextValue = {
	shortcuts: ShortcutConfig[];
	addShortcut: (shortcut: ShortcutInput) => boolean;
	updateShortcut: (id: string, shortcut: ShortcutInput) => boolean;
	deleteShortcut: (id: string) => boolean;
	replaceShortcuts: (shortcuts: ShortcutConfig[]) => boolean;
};

const ShortcutsContext = createContext<ShortcutsContextValue | null>(null);

export function ShortcutsProvider({ children }: { children: React.ReactNode }) {
	const [shortcuts, setShortcuts] = useState(() => getShortcuts());

	const persistShortcuts = useCallback((next: ShortcutConfig[]) => {
		try {
			saveShortcuts(next);
			setShortcuts(next);
			return true;
		} catch (error) {
			toaster.error(
				error instanceof Error ? error.message : "Failed to save shortcuts.",
			);
			return false;
		}
	}, []);

	const addShortcut = useCallback(
		(shortcut: ShortcutInput) => {
			const next = [...shortcuts, createShortcutInput(shortcut)];
			return persistShortcuts(next);
		},
		[persistShortcuts, shortcuts],
	);

	const updateShortcut = useCallback(
		(id: string, shortcut: ShortcutInput) => {
			let didUpdate = false;
			const next = shortcuts.map((currentShortcut) => {
				if (currentShortcut.id !== id) {
					return currentShortcut;
				}

				didUpdate = true;
				return { ...shortcut, id: currentShortcut.id };
			});

			if (!didUpdate) {
				toaster.error("Shortcut could not be found.");
				return false;
			}

			return persistShortcuts(next);
		},
		[persistShortcuts, shortcuts],
	);

	const deleteShortcut = useCallback(
		(id: string) => {
			const next = shortcuts.filter((shortcut) => shortcut.id !== id);
			if (next.length === shortcuts.length) {
				toaster.error("Shortcut could not be found.");
				return false;
			}

			return persistShortcuts(next);
		},
		[persistShortcuts, shortcuts],
	);

	const replaceShortcuts = useCallback(
		(nextShortcuts: ShortcutConfig[]) => {
			return persistShortcuts(normalizeShortcuts(nextShortcuts));
		},
		[persistShortcuts],
	);

	const value = useMemo<ShortcutsContextValue>(
		() => ({
			shortcuts,
			addShortcut,
			updateShortcut,
			deleteShortcut,
			replaceShortcuts,
		}),
		[addShortcut, deleteShortcut, replaceShortcuts, shortcuts, updateShortcut],
	);

	return (
		<ShortcutsContext.Provider value={value}>
			{children}
		</ShortcutsContext.Provider>
	);
}

export function useShortcutsContext(): ShortcutsContextValue {
	const context = useContext(ShortcutsContext);
	if (!context) {
		throw new Error(
			"useShortcutsContext must be used within ShortcutsProvider.",
		);
	}

	return context;
}

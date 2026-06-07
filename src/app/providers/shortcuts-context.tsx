import { createContext, useContext, useMemo, useState } from "react";
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
	addShortcut: (shortcut: ShortcutInput) => void;
	updateShortcut: (id: string, shortcut: ShortcutInput) => void;
	deleteShortcut: (id: string) => void;
	replaceShortcuts: (shortcuts: ShortcutConfig[]) => void;
};

const ShortcutsContext = createContext<ShortcutsContextValue | null>(null);

export function ShortcutsProvider({ children }: { children: React.ReactNode }) {
	const [shortcuts, setShortcuts] = useState(() => getShortcuts());

	const value = useMemo<ShortcutsContextValue>(
		() => ({
			shortcuts,
			addShortcut: (shortcut) => {
				setShortcuts((current) => {
					const next = [...current, createShortcutInput(shortcut)];
					saveShortcuts(next);
					return next;
				});
			},
			updateShortcut: (id, shortcut) => {
				setShortcuts((current) => {
					const next = current.map((currentShortcut) =>
						currentShortcut.id === id
							? { ...shortcut, id: currentShortcut.id }
							: currentShortcut,
					);
					saveShortcuts(next);
					return next;
				});
			},
			deleteShortcut: (id) => {
				setShortcuts((current) => {
					const next = current.filter((shortcut) => shortcut.id !== id);
					saveShortcuts(next);
					return next;
				});
			},
			replaceShortcuts: (nextShortcuts) => {
				const normalized = normalizeShortcuts(nextShortcuts);
				saveShortcuts(normalized);
				setShortcuts(normalized);
			},
		}),
		[shortcuts],
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

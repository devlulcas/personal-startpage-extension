import { type CSSProperties, useState } from "react";
import { useShortcutsContext } from "../../app/providers/shortcuts-context";
import {
	normalizeShortcutInput,
	SHORTCUT_ICON_OPTIONS,
	type ShortcutConfig,
	validateShortcutInput,
} from "../../config/shortcuts";
import { AppButton } from "../common/button";
import { toaster } from "../toast/toast";
import {
	AriaColorField,
	AriaSelectField,
	SettingsErrorMessage,
	SettingsField,
	SettingsSection,
} from "./settings-controls";
import { SettingsDialog } from "./settings-dialog";
import styles from "./shortcuts-settings-section.module.css";

type ShortcutFormState = Omit<ShortcutConfig, "id">;

const DEFAULT_SHORTCUT_FORM: ShortcutFormState = {
	label: "",
	href: "",
	icon: "globe",
	color: "#7c3aed",
};

type ShortcutFormProps = {
	errorMessage: string | null;
	form: ShortcutFormState;
	title: string;
	onChange: (form: ShortcutFormState) => void;
};

function ShortcutForm({
	errorMessage,
	form,
	onChange,
	title,
}: ShortcutFormProps) {
	return (
		<div className={styles.shortcutForm}>
			<h4>{title}</h4>

			<SettingsField label="Name" htmlFor="shortcut-name-input">
				<input
					id="shortcut-name-input"
					value={form.label}
					onChange={(event) =>
						onChange({
							...form,
							label: event.target.value,
						})
					}
					placeholder="Docs"
					autoComplete="off"
				/>
			</SettingsField>

			<SettingsField label="Link" htmlFor="shortcut-link-input">
				<input
					id="shortcut-link-input"
					type="url"
					value={form.href}
					onChange={(event) =>
						onChange({
							...form,
							href: event.target.value,
						})
					}
					placeholder="https://example.com"
					autoComplete="off"
				/>
			</SettingsField>

			<div className={styles.shortcutFormGrid}>
				<AriaSelectField
					id="shortcut-icon-select"
					label="Icon"
					value={form.icon}
					options={SHORTCUT_ICON_OPTIONS}
					onChange={(icon) =>
						onChange({
							...form,
							icon,
						})
					}
				/>

				<AriaColorField
					label="Background"
					value={form.color}
					onChange={(color) =>
						onChange({
							...form,
							color,
						})
					}
				/>
			</div>

			<SettingsErrorMessage message={errorMessage} />
		</div>
	);
}

export function ShortcutsSettingsSection() {
	const { addShortcut, deleteShortcut, shortcuts, updateShortcut } =
		useShortcutsContext();
	const [editingId, setEditingId] = useState<string | null>(null);

	const [form, setForm] = useState<ShortcutFormState>(DEFAULT_SHORTCUT_FORM);
	const [shortcutErrorMessage, setShortcutErrorMessage] = useState<
		string | null
	>(null);

	const editingShortcut = shortcuts.find(
		(shortcut) => shortcut.id === editingId,
	);
	const formTitle = editingShortcut ? "Edit Shortcut" : "Add Shortcut";

	function resetForm() {
		setEditingId(null);
		setForm(DEFAULT_SHORTCUT_FORM);
		setShortcutErrorMessage(null);
	}

	function handleEditShortcut(shortcut: ShortcutConfig) {
		setEditingId(shortcut.id);
		setForm({
			label: shortcut.label,
			href: shortcut.href,
			icon: shortcut.icon,
			color: shortcut.color,
		});
		setShortcutErrorMessage(null);
	}

	function handleDeleteShortcut(id: string) {
		const didDelete = deleteShortcut(id);
		if (!didDelete) {
			return;
		}

		if (editingId === id) {
			resetForm();
		}
		toaster.success("Shortcut deleted.");
	}

	function handleSaveShortcut() {
		const validationMessage = validateShortcutInput(form);
		if (validationMessage) {
			setShortcutErrorMessage(validationMessage);
			return;
		}

		const normalizedForm = normalizeShortcutInput(form);
		const didSave = editingId
			? updateShortcut(editingId, normalizedForm)
			: addShortcut(normalizedForm);
		if (!didSave) {
			return;
		}

		if (editingId) {
			toaster.success("Shortcut updated.");
		} else {
			toaster.success("Shortcut added.");
		}

		resetForm();
	}

	return (
		<SettingsSection
			title="Shortcuts"
			description="Create quick links for the sites and tools you use often."
		>
			<div className={styles.shortcutList}>
				{shortcuts.length === 0 ? (
					<p className={styles.emptyMessage}>No shortcuts configured.</p>
				) : (
					shortcuts.map((shortcut) => (
						<div key={shortcut.id} className={styles.shortcutRow}>
							<div
								className={styles.shortcutSwatch}
								style={{ "--shortcut-color": shortcut.color } as CSSProperties}
								aria-hidden="true"
							/>
							<div className={styles.shortcutSummary}>
								<span>{shortcut.label}</span>
								<a
									href={shortcut.href}
									target="_blank"
									rel="noreferrer noopener"
								>
									{shortcut.href}
								</a>
							</div>
							<div className={styles.shortcutActions}>
								<AppButton
									variant="text"
									onPress={() => handleEditShortcut(shortcut)}
								>
									Edit
								</AppButton>
								<AppButton
									variant="text"
									onPress={() => handleDeleteShortcut(shortcut.id)}
								>
									Delete
								</AppButton>
							</div>
						</div>
					))
				)}
			</div>

			<ShortcutForm
				errorMessage={shortcutErrorMessage}
				form={form}
				title={formTitle}
				onChange={setForm}
			/>

			<SettingsDialog.FooterPortal>
				<AppButton onPress={handleSaveShortcut}>
					{editingShortcut ? "Save Shortcut" : "Add Shortcut"}
				</AppButton>
				{editingShortcut && (
					<AppButton variant="filled" onPress={resetForm}>
						Cancel
					</AppButton>
				)}
			</SettingsDialog.FooterPortal>
		</SettingsSection>
	);
}

import { CheckIcon, XIcon } from "@phosphor-icons/react";
import { type CSSProperties, useState } from "react";
import {
	Button,
	Dialog,
	Heading,
	Modal,
	ModalOverlay,
} from "react-aria-components";
import { useShortcutsContext } from "../../app/providers/shortcuts-context";
import {
	normalizeShortcutInput,
	SHORTCUT_ICON_OPTIONS,
	type ShortcutConfig,
	type ShortcutIconId,
	validateShortcutInput,
} from "../../config/shortcuts";
import { AppButton } from "../common/button";
import { shortcutIcons } from "../search/shortcut-icons";
import { toaster } from "../toast/toast";
import {
	AriaColorField,
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
				<ShortcutIconPicker
					value={form.icon}
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

type ShortcutIconPickerProps = {
	value: ShortcutIconId;
	onChange: (icon: ShortcutIconId) => void;
};

function ShortcutIconPicker({ onChange, value }: ShortcutIconPickerProps) {
	const [isOpen, setIsOpen] = useState(false);
	const selectedOption =
		SHORTCUT_ICON_OPTIONS.find((option) => option.id === value) ??
		SHORTCUT_ICON_OPTIONS[0];
	const SelectedIcon = shortcutIcons[value];

	function handleSelectIcon(icon: ShortcutIconId) {
		onChange(icon);
		setIsOpen(false);
	}

	return (
		<div className={styles.iconPickerField}>
			<span className={styles.iconPickerLabel}>Icon</span>
			<Button
				className={styles.iconPickerButton}
				onPress={() => setIsOpen(true)}
				aria-label={`Choose shortcut icon, current icon ${selectedOption.label}`}
			>
				<span className={styles.iconPickerPreview} aria-hidden="true">
					<SelectedIcon size={22} weight="duotone" />
				</span>
				<span className={styles.iconPickerValue}>{selectedOption.label}</span>
			</Button>

			<ModalOverlay
				className={styles.iconPickerOverlay}
				isOpen={isOpen}
				onOpenChange={setIsOpen}
				isDismissable
			>
				<Modal className={styles.iconPickerModal}>
					<Dialog className={styles.iconPickerDialog}>
						{({ close }) => (
							<>
								<header className={styles.iconPickerHeader}>
									<Heading slot="title" className={styles.iconPickerTitle}>
										Choose Icon
									</Heading>
									<Button
										className={styles.iconPickerCloseButton}
										onPress={close}
										aria-label="Close icon picker"
									>
										<XIcon size={18} weight="bold" aria-hidden="true" />
									</Button>
								</header>

								<div className={styles.iconPickerGrid}>
									{SHORTCUT_ICON_OPTIONS.map((option) => {
										const Icon = shortcutIcons[option.id];
										const isSelected = option.id === value;

										return (
											<Button
												key={option.id}
												className={styles.iconPickerGridButton}
												data-selected={isSelected || undefined}
												onPress={() => handleSelectIcon(option.id)}
												aria-label={option.label}
											>
												<span
													className={styles.iconPickerGridIcon}
													aria-hidden="true"
												>
													<Icon size={24} weight="duotone" />
												</span>
												<span className={styles.iconPickerGridLabel}>
													{option.label}
												</span>
												{isSelected && (
													<CheckIcon
														className={styles.iconPickerGridCheck}
														size={14}
														weight="bold"
														aria-hidden="true"
													/>
												)}
											</Button>
										);
									})}
								</div>
							</>
						)}
					</Dialog>
				</Modal>
			</ModalOverlay>
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

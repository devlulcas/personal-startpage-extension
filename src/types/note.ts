export type Note = {
	id: string;
	title: string;
	content: string;
	createdAt: string;
	updatedAt: string;
};

export type NoteSummary = Pick<
	Note,
	"id" | "title" | "createdAt" | "updatedAt"
>;

export type ObsidianNotesSettings = {
	vault: string;
	folder: string;
	glassTransparency: number;
	glassTransparencyStrong: number;
	glassTransparencySoft: number;
};

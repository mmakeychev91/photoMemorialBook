export type Folder = {
    id: number;
    name: string;
}

export type FolderDetail = {
    id: number;
    name: string,
    cards: []
}

export type Cards = {
    cards: {
        id: number,
        file_path: string,
        description: string,
    }[];
}
export type Folder = {
    id: number;
    name: string;
}

export type FoldersArray = Folder[];

export type FolderDetail = {
    id: number;
    name: string,
    cards: []
}

export type Card = {
    id: number;
    file_path: string;
    description: string;
    created_at?: string;  // Сделал необязательным, если сервер не всегда его возвращает
};

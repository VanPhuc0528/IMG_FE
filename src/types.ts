//thông tin user
export interface User {
    id: string
    username: string;
    email: string;
}

//
export interface AuthContextType{
    user: User | null;
    token: string | null;
    loginUser: (user: User, token: string) => void;
    logoutUser: () => void;
}

//thư mục chung
export interface Folder {
  id: number;
  name: string;
  parent: number | null;
  allowUpload?: boolean;
  allowSync?: boolean;
  owner_id?: number;
}

//chia sẻ ảnh
export interface SharedFolder {
  id: number;
  name: string;
  owner: {
    id: number;
    email: string;
    username: string;
  };
  shared_by: string;
  permission: 'read' | 'write' | 'delete';
  shared_at?: string;
  allowSync?: boolean;
  allowUpload?: string;
}

//chi tiết ảnh
export interface ImageItem{
    id: string;
    image_name: string;
    image: string;
    folder_id: number | null;
    created_at: string;
}

//google
export interface GoogleImage {
  id: string;
  name: string;
  thumbnailLink: string;
}

export interface GooglePickerFile {
  id: string;
  name: string;
}

export interface GooglePickerData {
  action: string;
  docs: GooglePickerFile[];
}
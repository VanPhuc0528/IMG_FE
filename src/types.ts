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
    loginUser: (user: User, token: string) => void; //nếu login trả về user và token
    logoutUser: () => void; //đăng xuất xóa toàn bộ dữ liệu đã được Login trả về
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
  owner_id: number;
  owner_email: string;
  owner_username: string;
  allowUpload: string;
  allowSync: string;
  permission: 'read' | 'write' | 'delete';
}

export interface SharedFoldersResponse {
  user_id: number;
  shared_folders: SharedFolder[];
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

//google Picker
export interface GooglePickerFile {
  id: string;
  name: string;
}

//dữ liệu trong Google Picker
export interface GooglePickerData {
  action: string;
  docs: GooglePickerFile[];
}
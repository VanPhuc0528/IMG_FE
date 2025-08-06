import React, { useEffect, useRef, useState } from "react";
import FolderTree from "../components/folders/FolderTree";
import ImageGrid from "../layoutgrid/ImageGrid";
import FolderConfig from "../components/config/FolderConfig";
import { useNavigate, useParams } from "react-router-dom";
import type { ImageItem } from "../types";
import axios from "axios";
import type { SharedFolder, Folder, GooglePickerData } from "../types";

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const DEVELOPER_KEY = import.meta.env.VITE_GOOGLE_DEVELOPER_KEY;
const SCOPE = "https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/userinfo.email";
const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";

declare global {
  interface Window {
    google: any;
    gapi: any;
  }
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [folders, setFolders] = useState<Folder[]>([]);
  const [images, setImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const accessTokenRef = useRef<string | null>(null);
  const [sharedFolder, setSharedFolder] = useState<SharedFolder[]>([]);

  const getCurrentUserId = (): number => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      return user?.id || 1;
    } catch {
      return 1;
    }
  };

  const selectedFolderId = id === "home" ? null : id ? parseInt(id) : folders.length > 0 ? folders[0].id: null;
  const selectedFolder = folders.find((f) => f.id === selectedFolderId) || sharedFolder.find((f) => f.id === selectedFolderId);

  useEffect(() => {
    const fetchFolders = async () => {
      try {
        const userId = getCurrentUserId();
        const token = localStorage.getItem("token");
        const response = await axios.get(`${API_URL}/user/${userId}/home/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const normalized: Folder[] = response.data.folders.map((f: any) => ({
          id: f.id,
          name: f.name,
          parent: f.parent ?? null,
          allowUpload: true,
          allowSync: true,
        }));
        console.log("fetch:", response.data.folders)
        setFolders(normalized);

      } catch (err) {
        console.error("Lỗi khi tải thư mục:", err);
        setError("Không thể tải thư mục.");
      }
    };

    fetchFolders();
  }, [id]);

  useEffect(() => {
  const fetchImages = async () => {
    const userId = getCurrentUserId();
    const token = localStorage.getItem("token");

    try {
      if (selectedFolderId === null) {
        const res = await axios.get(`${API_URL}/user/${userId}/home/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setImages(res.data.images || []);
      } else {
        const isShared = sharedFolder.some((f) => f.id === selectedFolderId);
        const url = isShared
          ? `${API_URL}/user/${userId}/shared/  `
          : `${API_URL}/user/${userId}/folder/${selectedFolderId}/images/`;

        const res = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setImages(res.data.images || []);
        console.log("Ảnh trong thư mục:", res.data.images);
      }
    } catch (err) {
      console.error("Lỗi khi tải ảnh:", err);
      setError("Không thể tải ảnh từ server.");
    }
  };

  fetchImages();
}, [selectedFolderId, folders, sharedFolder]);

  useEffect(() => {
    const loadApis = async () => {
      try {
        const gapiScript = document.createElement("script");
        gapiScript.src = "https://apis.google.com/js/api.js";
        document.head.appendChild(gapiScript);
        await new Promise((res, rej) => {
          gapiScript.onload = res;
          gapiScript.onerror = rej;
        });

        const gisScript = document.createElement("script");
        gisScript.src = "https://accounts.google.com/gsi/client";
        document.head.appendChild(gisScript);
        await new Promise((res, rej) => {
          gisScript.onload = res;
          gisScript.onerror = rej;
        });

        window.gapi.load("picker", {
          callback: () => {},
          onerror: () => setError("Không thể tải Google Picker API."),
        });
      } catch {
        setError("Không thể tải Google APIs.");
      }
    };

    loadApis();
  }, []);

  const fetchSharedFolder = async () => {
    const userId = getCurrentUserId();
    const token  = localStorage.getItem("token");

    try {
      const res = await axios.get(`${API_URL}/user/${userId}/shared/`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      console.log("Shared folders:", res.data.shared_folders);
      setSharedFolder(res.data.shared_folders || []);
    } catch (err) {
      console.error("Lỗi khi tải shared folders:", err);
    }
  }

  useEffect(() => {
    fetchSharedFolder();
  }, []);

  const handleUpload = async (files: FileList) => {
    if (!selectedFolder?.allowUpload || files.length === 0) return;
    setLoading(true);
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        if (!file.type.startsWith("image/")) throw new Error(`File ${file.name} không hợp lệ`);
        if (file.size > 10 * 1024 * 1024) throw new Error(`File ${file.name} quá lớn`);

        const formData = new FormData();
        formData.append("image", file);
        formData.append("folder_id", selectedFolderId !== null ? selectedFolderId.toString() : "null");
        formData.append("createdAt", new Date().toISOString());

        console.log("formData:", formData);

        const userId = getCurrentUserId();
        const token = localStorage.getItem("token");
        const res = await axios.post(`${API_URL}/user/${userId}/upload/img/`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const result = res.data;

        return {
          id: result.id,
          image_name: result.name,
          image: result.url,
          folder_id: selectedFolderId,
          created_at: result.created_at,
        };
      });

      const newImages = await Promise.all(uploadPromises);
      setImages((prev) => [...prev, ...newImages]);
    } catch (err: any) {
      setError(err.message || "Lỗi khi upload ảnh");
    } finally {
      setLoading(false);
    }
  };

  const handleSyncDrive = () => {
    if (!selectedFolderId || !selectedFolder?.allowSync || !window.google?.accounts?.oauth2) return;

    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPE,
      callback: async (tokenResponse: { access_token: string }) => {
        const access_token = tokenResponse.access_token;
        accessTokenRef.current = access_token;
        console.log("Access Token:", access_token)

        try {
          const userInfoRes = await axios.get("https://www.googleapis.com/oauth2/v3/userinfo", {
            headers: { Authorization: `Bearer ${access_token}` },
          });

          const userInfo = userInfoRes.data;
          const driveEmail = userInfo.email;

          const userId = getCurrentUserId();
          const token = localStorage.getItem("token");
          
          await axios.post(`${API_URL}/user/${userId}/sync/save_drive_token/`,{
            access_token: tokenResponse.access_token,
            userId: userId,
            driveEmail: driveEmail,
          }, {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }). catch((err) => console.error("❌ Lỗi gửi token:", err));

          console.log("Access Token Drive trả về:", access_token);
          showPicker(access_token, driveEmail);
        } catch (err) {
          console.error("Lỗi lấy thông tin người dùng Google:", err);
          setError("Không thể lấy thông tin người dùng Google.");
        }
      },
    });

    tokenClient.requestAccessToken();
  };

  const showPicker = (accessToken: string, driveEmail: string) => {
    const view = new window.google.picker.View(window.google.picker.ViewId.DOCS_IMAGES);
    view.setMimeTypes("image/png,image/jpeg,image/jpg,image/gif");

    const picker = new window.google.picker.PickerBuilder()
      .enableFeature(window.google.picker.Feature.MULTISELECT_ENABLED)
      .setAppId(CLIENT_ID.split("-")[0])
      .setOAuthToken(accessToken)
      .addView(view)
      .addView(new window.google.picker.DocsUploadView())
      .setDeveloperKey(DEVELOPER_KEY)
      .setCallback(async (data: GooglePickerData) => {
        if (data.action === window.google.picker.Action.PICKED && selectedFolderId !== null) {
          const newImages: ImageItem[] = [];

          for (const file of data.docs) {
            const newImg: ImageItem = {
              id: file.id,
              image_name: file.name,
              image: `https://drive.google.com/uc?export=view&id=${file.id}`,
              folder_id: selectedFolderId,
              created_at: new Date().toISOString(),
            };

            const body = JSON.stringify({
              user_id: getCurrentUserId,
              drive_email: driveEmail,
              img_name: file.name,
              img_id: file.id,
              img_folder_id: selectedFolderId,
            })
            console.log("Body", body)

            try {
              const userId = getCurrentUserId();
              const token = localStorage.getItem("token");
              await axios.post(`${API_URL}/user/${userId}/sync/img/`,{
                user_id: userId,
                drive_email: driveEmail,
                img_name: file.name,
                img_id: file.id,
                img_folder_id: selectedFolderId,
                sync_type: "gg_drive"
              }, {
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
              });

              newImages.push(newImg);
            } catch (err) {
              console.error("Lỗi khi lưu ảnh:", err);
              setError("Không thể lưu ảnh từ Google Drive.");
            }
          }

          setImages((prev) => [...prev, ...newImages]);
        }
      })
      .build();

    picker.setVisible(true);
  };

  const handleAddFolder = async (parentId: number | null) => {

    console.log("parentId:", parentId)

    const name = prompt("Tên thư mục:");
    if (!name) return;

    const userId = getCurrentUserId();
    const token = localStorage.getItem("token");
    try {
      const response = await axios.post(`${API_URL}/user/${userId}/folder/create/`, {
        name: name.trim(),
        parent: parentId ?? null,
        owner: userId,
      }, {
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });

      console.log("Hiển thị dữ liệu con:", response.data)

      const newFolder = await response.data;

      setFolders((prev) => [
        ...prev,
        {
          id: newFolder.id,
          name: newFolder.name,
          parent: newFolder.parent ?? null,
          allowUpload: true,
          allowSync: true,
        },
      ]);
    } catch (err) {
      console.error("Lỗi khi tạo thư mục:", err);
      alert("Không thể tạo thư mục.");
    }
  };

  const handleUpdateFolder = (updated: Folder) => {
    setFolders((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
  };

  const handleDeleteFolder = async (folderId: number) => {
    if (!confirm("Xoá thư mục và toàn bộ ảnh bên trong?")) return;

    const userId = getCurrentUserId();
    const token = localStorage.getItem("token");

    try {
      await axios.delete(`${API_URL}/user/${userId}/folder/${folderId}/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Lọc đệ quy nếu có folder con:
      const collectAllFolderIds = (fid: number, list: Folder[]): number[] => {
        const children = list.filter((f) => f.parent === fid);
        let ids = [fid];
        for (const c of children) {
          ids = ids.concat(collectAllFolderIds(c.id, list));
        }
        return ids;
      };

      const idsToDelete = collectAllFolderIds(folderId, folders);

      setFolders((prev) => prev.filter((f) => !idsToDelete.includes(f.id)));
      setImages((prev) => prev.filter((img) => !idsToDelete.includes(img.folder_id)));

      // Nếu folder đang xem bị xóa thì chuyển về Trang chủ
      if (idsToDelete.includes(selectedFolderId ?? -999)) {
        navigate("/folder/home");
      }
    } catch (err) {
      console.error("❌ Lỗi xóa thư mục thất bại:", err);
      alert("Xoá thư mục thất bại");
    }
  };
  
  return (
    <div className="flex h-full">
      <FolderTree
        folders={folders}
        sharedFolders={sharedFolder}
        selectedId={selectedFolderId}
        onSelectFolder={(id) => navigate(`/folder/${id}`)}
        onAddFolder={handleAddFolder}
        onDeleteFolder={handleDeleteFolder}
        onSelectSharedFolder={(id) => navigate(`/folder/${id}`)}
      />
      <div className="flex-1 p-6 overflow-auto bg-white">
        {loading && <div className="text-blue-500 mb-4">Đang tải...</div>}
        {error && (
          <div className="text-red-600 mb-4">
            {error}
            <button className="ml-2 text-sm underline" onClick={() => setError(null)}>
              Đóng
            </button>
          </div>
        )}
        {selectedFolder && "parent" in selectedFolder && (
          <div className="mb-4">
            <FolderConfig folder={selectedFolder} onUpdate={handleUpdateFolder} />
          </div>
        )}
        <ImageGrid
          folderId={selectedFolderId}
          folders={folders}
          images={images}
          onSyncDrive={handleSyncDrive}
          onSelectFolder={(id) => navigate(`/folder/${id}`)}
          onUploaded={(newImgs) => setImages((prev) => [...prev, ...newImgs])}
          onUpload={handleUpload}
        />
      </div>
    </div>
  );
};

export default Dashboard;

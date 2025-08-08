import React, { useEffect, useState, useCallback } from "react";
import UploadImages from "../components/upload/UploadImages";
import type { ImageItem, Folder } from "../types";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";

interface ImageGridProps {
  folderId: number | null;
  folders: Folder[];
  images: ImageItem[];
  onSyncDrive: () => void;
  onSelectFolder: (id: number | null) => void;
  onUploaded: (newImgs: ImageItem[]) => void;
  onUpload: (files: FileList) => Promise<void>;
  userPermission?: string; // thêm prop quyền người dùng trong folder chia sẻ
}

const ImageGrid: React.FC<ImageGridProps> = ({
  folderId,
  folders,
  onSyncDrive,
  onUploaded,
  onUpload,
  userPermission, // nhận prop quyền
}) => {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [ _error, setError] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [filter, setFilter] = useState({ year: "", month: "", day: "", keyword: "" });
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  const currentFolder =
    folderId === null
      ? { id: null, name: "Trang chủ", allowUpload: true, allowSync: true, parent: null }
      : folders.find((f) => f.id === folderId);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const user_id = user?.id;

  // Tính quyền thực tế của người dùng
  const effectivePermission = (() => {
    if (folderId === null) return undefined; // Thư mục Home: full quyền
    const current = folders.find((f) => f.id === folderId);
    if (current?.owner_id === user_id) return undefined; // Là chủ folder: full quyền
    return userPermission; // Folder được chia sẻ
  })();

  const formatDate = (dateStr: string): string => {
    if (!dateStr || isNaN(Date.parse(dateStr))) return "Không rõ ngày";
    const date = new Date(dateStr);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const fetchImages = useCallback(async () => {
    if (!user_id) return;

    const token = localStorage.getItem("token");
    const current = folders.find((f) => f.id === folderId);
    // const owner_id = current?.owner_id || user_id;

    try {
      const res =
        folderId === null
          ? await axios.get(`${API_URL}/user/${user_id}/home/?t=${Date.now()}`, {
              headers: { Authorization: `Bearer ${token}` },
            })
          : await axios.get(`${API_URL}/user/folder/${folderId}/images/?t=${Date.now()}`, {
              headers: { Authorization: `Bearer ${token}` },
            });

      setImages(res.data.images || []);
    } catch (error) {
      if (error instanceof Error) {
        console.error("Lỗi khi tải ảnh:", error.message);
      } else {
        console.error("Lỗi khi tải ảnh:", error);
      }
      setError("Không thể tải ảnh!");
    }
  }, [user_id, folderId, folders]);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  const filteredImages = images.filter((img) => {
    const date = new Date(img.created_at);
    const matchYear = filter.year ? date.getFullYear() === +filter.year : true;
    const matchMonth = filter.month ? date.getMonth() + 1 === +filter.month : true;
    const matchDay = filter.day ? date.getDate() === +filter.day : true;
    const matchesName = !filter.keyword || img.image_name.toLowerCase().includes(filter.keyword.toLowerCase());
    return matchYear && matchMonth && matchDay && matchesName;
  });

  const handleToogleMenu = (imageId: number) => {
    setOpenMenuId((prev) => (prev === imageId ? null : imageId));
  };

  const handleDeleteImage = async (imageId: number) => {
    const token = localStorage.getItem("token");
    if (!user_id || folderId === null) return;
    if (!confirm("Bạn có chắc muốn xóa ảnh này chứ?")) return;

    try{
      await axios.delete(`${API_URL}/user/folder/${folderId}/image/${imageId}/`, {
        headers: {Authorization: `Bearer ${token}`},
      });
      setImages((prev) => prev.filter((img) => Number(img.id) !== Number(imageId)));
      setOpenMenuId(null);
    } catch (err) {
      console.log("Lỗi xảy ra:", err);
      alert("Không thể xóa ảnh!");
    }
  };

  const handleUploaded = async (newImgs: ImageItem[]) => {
    onUploaded(newImgs);
    setTimeout(() => {
      fetchImages();
    }, 500);
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">
        {folderId !== null ? `📁 ${currentFolder?.name || "Thư mục"}` : "Chọn thư mục để xem ảnh"}
      </h2>

      <div className="mb-4 flex justify-between items-center flex-wrap gap-4">
        <div className="flex gap-2 flex-wrap">
          <select
            value={filter.year}
            onChange={(e) => setFilter({ ...filter, year: e.target.value })}
            className="border px-2 py-1 rounded"
          >
            <option value="">Chọn năm</option>
            {Array.from({ length: 16 }, (_, i) => {
              const year = 2015 + i;
              return (
                <option key={year} value={year}>
                  {year}
                </option>
              );
            })}
          </select>
          <select
            value={filter.month}
            onChange={(e) => setFilter({ ...filter, month: e.target.value })}
            className="border px-2 py-1 rounded"
          >
            <option value="">Chọn tháng</option>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>{i + 1}</option>
            ))}
          </select>
          <select
            value={filter.day}
            onChange={(e) => setFilter({ ...filter, day: e.target.value })}
            className="border px-2 py-1 rounded"
          >
            <option value="">Chọn ngày</option>
            {Array.from({ length: 31 }, (_, i) => (
              <option key={i + 1} value={i + 1}>{i + 1}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Tìm ảnh theo tên"
            value={filter.keyword || ""}
            onChange={(e) => setFilter({ ...filter, keyword: e.target.value })}
            className="border px-2 py-1 rounded"
          />
        </div>

        <div className="flex items-center border rounded-full overflow-hidden">
          <button
            onClick={() => setViewMode("list")}
            className={`px-4 py-2 ${viewMode === "list" ? "bg-blue-100" : "bg-white"}`}
            title="Xem dạng danh sách"
          >
            <i className="fas fa-bars" />
          </button>
          <button
            onClick={() => setViewMode("grid")}
            className={`px-4 py-2 ${viewMode === "grid" ? "bg-blue-100" : "bg-white"}`}
            title="Xem dạng lưới"
          >
            <i className="fas fa-th" />
          </button>
        </div>
      </div>

      {filteredImages.length > 0 ? (
        <div className={viewMode === "grid" ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" : "flex flex-col gap-2"}>
          {filteredImages.map((img) => (
            <div
              key={`${img.image_name}-${img.id}`}
              className={`relative border rounded-lg overflow-hidden shadow ${viewMode === "list" ? "flex items-center" : ""}`}
            >
              <img
                src={`${img.image}?t=${Date.now()}`}
                alt={img.image_name}
                className={viewMode === "list" ? "w-24 h-24 object-cover mr-4" : "w-full h-48 object-cover cursor-pointer"}
                onClick={() => setPreviewUrl(`${img.image}?t=${Date.now()}`)}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = "https://placehold.co/200x200?text=Lỗi+ảnh";
                }}
              />
              <div className="p-2">
                <div className="font-semibold">{img.image_name}</div>
                <div className="text-sm text-gray-500">{formatDate(img.created_at)}</div>
              </div>
              <div className="absolute top-2 right-2">
                <button
                  className="bg-white border rounded-full p-1 hover:bg-gray-200"
                  onClick={() => handleToogleMenu(Number(img.id))}
                >
                  ⋮
                </button>
                {openMenuId === Number(img.id) && (
                  <div className="absolute right-0 mt-2 bg-white border rounded shadow z-10">
                    <button
                      className="block w-full px-4 py-2 text-red-600 hover:bg-red-100 text-sm"
                      onClick={() => handleDeleteImage(Number(img.id))}
                    >
                      🗑️ Xóa ảnh
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500">Không tìm thấy ảnh phù hợp.</p>
      )}

      {/* Upload ảnh nếu có quyền */}
      {effectivePermission !== "read" && (
        <div className="mt-8">
          <UploadImages
            folderId={folderId}
            disabled={false}
            onUploaded={handleUploaded}
            onUpload={onUpload}
            userPermission={effectivePermission}
          />
        </div>
      )}

      {/* Đồng bộ Drive nếu có quyền */}
      {currentFolder?.allowSync && (
        <div className="mt-4">
          <button
            onClick={onSyncDrive}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Đồng bộ Drive
          </button>
        </div>
      )}

      {previewUrl && (
        <div
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50"
          onClick={() => setPreviewUrl(null)}
        >
          <img
            src={previewUrl}
            className="max-w-4xl max-h-[90vh] border-4 border-white rounded-lg"
            alt="preview"
          />
        </div>
      )}
    </div>
  );
};

export default ImageGrid;

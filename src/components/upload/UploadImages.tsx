import React, { useRef } from "react";
import type { ImageItem } from "../../types";
const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";
import axios from "axios";

interface Props {
  folderId: number | null;
  disabled: boolean;
  onUploaded: (newImgs: ImageItem[]) => void;
}

const getCurrentUserId = (): number => {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return user?.id || 1;
  } catch {
    return 1;
  }
};

const UploadImages: React.FC<Props> = ({ folderId, disabled, onUploaded }) => {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const user_id = user?.id;
    if (!user_id) {
      alert("Không tìm thấy user_id trong localStorage.");
      return;
    }

    const uploadPromises = Array.from(files).map(async (file) => {
      if (!file.type.startsWith("image/")) {
        alert("Không phải ảnh hợp lệ");
        return null;
      }

      if (file.size > 10 * 1024 * 1024) {
        alert("Ảnh quá lớn (tối đa 10MB)");
        return null;
      }

      const formData = new FormData();
      formData.append("img_file", file);
      formData.append("folder_id", folderId !== null ? folderId.toString() : "null");
      formData.append("img_name", file.name);
      formData.append("user_id", user_id.toString());

      try {
        const userId = getCurrentUserId();
        const token = localStorage.getItem("token");
        const res = await axios.post(`${API_URL}/user/upload/img/`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const result: ImageItem = res.data;
        return result;
      } catch (err) {
        console.error("Upload thất bại:", err);
        return null;
      }
    });

    const newImages = (await Promise.all(uploadPromises)).filter(Boolean) as ImageItem[];
    onUploaded(newImages);
  };

  return (
    <div
      className={`w-full h-40 border-2 border-dashed flex flex-col justify-center items-center text-center bg-gray-200 rounded cursor-pointer ${
        disabled ? "opacity-50 pointer-events-none" : "hover:bg-gray-300"
      }`}
      onClick={() => !disabled && inputRef.current?.click()}
    >
      <img src="/placeholder-upload.png" alt="upload icon" className="w-12 h-12 mb-2" />
      <p className="font-medium">Upload ảnh lên đây:</p>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple //Cho phép chọn nhiều ảnh upload
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
};

export default UploadImages;

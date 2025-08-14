import React, { useEffect, useRef, useState } from "react";
import axios from "axios";

interface GoogleImage {
  id: string;
  name: string;
  thumbnailLink: string;
}

const GoogleDriveSync: React.FC = () => {
  const [images, setImages] = useState<GoogleImage[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const accessTokenRef = useRef<string | null>(null);

  // 1️⃣ Khi component mount → gọi backend lấy access_token còn hạn
  useEffect(() => {
    const token = localStorage.getItem("google_access_token");
    if (token) {
      accessTokenRef.current = token;
      loadGoogleApi(token);
    } else {
      fetchAccessToken();
    }
  }, []);

  const fetchAccessToken = async () => {
    try {
      const resp = await axios.post("http://127.0.0.1:8000/api/sync_drive_folder/");
      const token = resp.data.access_token;
      accessTokenRef.current = token;
      localStorage.setItem("google_access_token", token); // ✅ Lưu token
      loadGoogleApi(token);
    } catch (err) {
      console.error("❌ Lỗi lấy token từ backend:", err);
    }
  };

  // 2️⃣ Load Google API và fetch ảnh
  const loadGoogleApi = (token: string) => {
    const script = document.createElement("script");
    script.src = "https://apis.google.com/js/api.js";
    script.onload = () => {
      window.gapi.load("client", async () => {
        await window.gapi.client.init({
          discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"],
        });

        window.gapi.client.setToken({ access_token: token });

        window.gapi.client.drive.files
          .list({
            q: "mimeType contains 'image/' and trashed = false",
            fields: "files(id, name, thumbnailLink)",
            pageSize: 20,
          })
          .then((response: { result: { files: GoogleImage[] } }) => {
            setImages(response.result.files || []);
          })
          .catch((err: any) => console.error("❌ Lỗi fetch ảnh:", err));
      });
    };
    document.body.appendChild(script);
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const updated = new Set(prev);
      if (updated.has(id)) updated.delete(id);
      else updated.add(id);
      return updated;
    });
  };

  // 3️⃣ Đồng bộ ảnh đã chọn lên backend
  const handleSync = async () => {
    const token = accessTokenRef.current;
    if (!token) {
      alert("❌ Không có access token. Vui lòng đăng nhập lại Google.");
      return;
    }

    const selectedImages = images.filter((img) => selected.has(img.id));

    try {
      await axios.post(
        "http://127.0.0.1:8000/api/drive/sync/",
        { images: selectedImages },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert(`✅ Đồng bộ thành công ${selectedImages.length} ảnh!`);
    } catch (err) {
      console.error("❌ Lỗi đồng bộ:", err);
      alert("Đồng bộ thất bại!");
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-3">🧩 Google Drive Sync</h2>
      <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
        {images.map((img) => (
          <div
            key={img.id}
            className={`border rounded p-1 cursor-pointer relative ${
              selected.has(img.id) ? "ring-2 ring-blue-500" : ""
            }`}
            onClick={() => toggleSelect(img.id)}
          >
            <img
              src={img.thumbnailLink}
              alt={img.name}
              className="w-full h-32 object-cover rounded"
            />
            <div className="text-xs mt-1 text-center truncate">{img.name}</div>
          </div>
        ))}
      </div>

      {selected.size > 0 && (
        <div className="mt-4">
          <button
            onClick={handleSync}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Đồng bộ {selected.size} ảnh vào hệ thống
          </button>
        </div>
      )}
    </div>
  );
};

export default GoogleDriveSync;

import React, { useEffect, useRef, useState } from "react";

const CLIENT_ID = "1070318039881-53p11ea9cvllv03g594jg28t7br02kgv.apps.googleusercontent.com";
const API_KEY = "AIzaSyAqWGu8sO8GBBHZYjZ9tvdAjBD4JRptrYs";
const SCOPE = "https://www.googleapis.com/auth/drive.readonly";
const DISCOVERY_DOC = "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest";
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

  useEffect(() => {
    const loadGoogleApi = () => {
      const script = document.createElement("script");
      script.src = "https://apis.google.com/js/api.js";
      script.onload = () => {
        window.gapi.load("client:auth2", initClient);
      };
      document.body.appendChild(script);
    };

    const initClient = () => {
      window.gapi.client
        .init({
          apiKey: API_KEY,
          clientId: CLIENT_ID,
          scope: SCOPE,
          discoveryDocs: [DISCOVERY_DOC],
        })
        .then(() => {
          const authInstance = window.gapi.auth2.getAuthInstance();
          if (!authInstance.isSignedIn.get()) {
            authInstance.signIn().then(() => handleTokenAndImages());
          } else {
            handleTokenAndImages();
          }
        });
    };

    const handleTokenAndImages = () => {
      const authInstance = window.gapi.auth2.getAuthInstance();
      const currentUser = authInstance.currentUser.get();
      const authResponse = currentUser.getAuthResponse();
      const token = authResponse?.access_token;

      if (token) {
        accessTokenRef.current = token;
        console.log("✅ Access Token:", token);

        axios.post("http://127.0.0.1:8000/api/user/save_drive_token/", {token}, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        })
          .then(() => {
            console.log("✅ Token đã gửi về server.");
          })
          .catch((err) => console.error("❌ Lỗi gửi token:", err));

        fetchDriveImages();
      } else {
        console.error("⚠️ Không thể lấy được access token.");
      }
    };

    loadGoogleApi();
  }, []);

  const fetchDriveImages = () => {
    window.gapi.client.drive.files
      .list({
        q: "mimeType contains 'image/' and trashed = false",
        fields: "files(id, name, thumbnailLink)",
        pageSize: 20,
      })
      .then((response: { result: { files: GoogleImage[] } }) => {
        setImages(response.result.files || []);
      });
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const updated = new Set(prev);
      if (updated.has(id)) {
        updated.delete(id);
      } else {
        updated.add(id);
      }
      return updated;
    });
  };

  const handleSync = async () => {
    const token = accessTokenRef.current;
    if (!token) {
      alert("❌ Không có access token. Vui lòng đăng nhập lại Google.");
      return;
    }

    const selectedImages = images.filter((img) => selected.has(img.id));

    console.log("🔥 Body gửi đi:", {
      images: selectedImages,
      token,
    });

    try {
      await axios.post("http://127.0.0.1:8000/api/drive/sync/", {images, token}, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      alert("✅ Đồng bộ thành công!");
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

import React from "react";
import axios from "axios";

declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

const GoogleDriveFolderPicker: React.FC = () => {
  const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const DEVELOPER_KEY = import.meta.env.VITE_GOOGLE_DEVELOPER_KEY;
  const APP_ID = import.meta.env.VITE_GOOGLE_APP_ID;
  const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";

  const SCOPES = ["https://www.googleapis.com/auth/drive.readonly"];

  const handlePickFolder = async () => {
    // Load auth2 & picker
    await new Promise((resolve) => {
      window.gapi.load("auth2", resolve);
    });
    await new Promise((resolve) => {
      window.gapi.load("picker", resolve);
    });

    // Init auth
    await window.gapi.auth2.init({
      client_id: CLIENT_ID,
      scope: SCOPES.join(" "),
    });

    // Sign in
    const googleUser = await window.gapi.auth2.getAuthInstance().signIn();
    const token = googleUser.getAuthResponse().access_token;
    console.log("✅ Access token:", token);

    // Mở Google Picker chọn folder
    const picker = new window.google.picker.PickerBuilder()
      .addView(
        new window.google.picker.DocsView(window.google.picker.ViewId.DOCS_IMAGES)
          .setSelectFolderEnabled(true)
          .setParent("root")
          .setIncludeFolders(true)
      )
      .setOAuthToken(token)
      .setDeveloperKey(DEVELOPER_KEY)
      .setAppId(APP_ID)
      .setCallback((data: any) => {
        if (data[window.google.picker.Response.ACTION] === window.google.picker.Action.PICKED) {
          const doc = data[window.google.picker.Response.DOCUMENTS][0]; //
          const driveFolderId = doc[window.google.picker.Document.ID]; //Lấy DriveFolderID từ Drive về
          const folderName = doc[window.google.picker.Document.NAME]; //Lấy tên Folder từ Drive về

          console.log("📂 Folder đã chọn:", driveFolderId, folderName);
          console.log("DriveFolderID:",driveFolderId )
          console.log("Folder Name:", folderName);

          // Gửi folder lên backend
          axios.post(`${API_URL}/user/sync/folder/`, {
            name: folderName,
            drive_folder_id: driveFolderId,
            parent: null,
          })
          .then(res => console.log("✅ Folder lưu vào backend:", res.data))
          .catch(err => console.error("❌ Lỗi lưu folder:", err));
        }
      })
      .build();

    picker.setVisible(true);
  };

  return (
    <button
      onClick={handlePickFolder}
      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
    >
      Chọn folder từ Google Drive
    </button>
  );
};

export default GoogleDriveFolderPicker;

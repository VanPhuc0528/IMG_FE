import React, { useEffect, useState } from "react";
import axios from "axios";
import FolderTree from "../folders/FolderTree";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";

interface Folder {
  id: number;
  name: string;
  parent: number | null;
  owner: number;
}

const Sidebar: React.FC = () => {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [userId, setUserId] = useState<number | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setUserId(user.id);
    }
  }, []);

  useEffect(() => {
    if (!userId) return;
    const token = localStorage.getItem("token");
    const fetchFolders = async () => {
      try {
        const res = await axios.get(`${API_URL}/user/${userId}/home/`, {
          params: { user_id: userId },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setFolders(res.data);
        console.log("Folder:", res.data)

        if (Array.isArray(res.data)) {
        setFolders(res.data);
      } else if (Array.isArray(res.data.folders)) {
        setFolders(res.data.folders);
      } else {
        console.error("❌ API trả về sai định dạng:", res.data);
        setFolders([]);
      }
      } catch (err) {
        console.error("Lỗi khi load thư mục:", err);
      }
    };  
    fetchFolders();
  }, [userId]);

  const handleAddFolder = async (parent: number | null) => {
    const name = prompt("Nhập tên thư mục:");
    if (!name || !userId) return;
    try {
      const res = await axios.post(`${API_URL}/user/${userId}/folder/create/`, {
        name,
        parent,
        owner: userId,
      });
      setFolders((prev) => [...prev, res.data]);
    } catch (err) {
      console.error("Tạo thư mục thất bại:", err);
    }
  };

  const handleDeleteFolder = async (id: number) => {
    if (!userId) return;
    const confirmDelete = confirm("Bạn có chắc muốn xoá thư mục này không?");
    if (!confirmDelete) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_URL}/user/${userId}/folder/${id}/`,{
        headers:{
          Authorization: `Bearer ${token}`
        }
      });
      setFolders((prev) => prev.filter((f) => f.id !== id));
    } catch (err) {
      console.error("Xoá thư mục thất bại:", err);
    }
  };

  return (
    <FolderTree
      folders={folders}
      selectedId={selectedFolderId}
      onSelectFolder={(id) => setSelectedFolderId(id)}
      onAddFolder={handleAddFolder}
      onDeleteFolder={handleDeleteFolder}
    />
  );
};

export default Sidebar;
import React, { useState } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";

interface SharedUser {
  email: string;
  permission: "read" | "write" | "delete";
}

interface Props {
  folderId: number;
  userId: number;
  onSubmit?: () => void;
}

const PermissionShare: React.FC<Props> = ({ folderId, userId, onSubmit }) => {
  const [email, setEmail] = useState("");
  const [permission, setPermission] = useState<SharedUser["permission"]>("read");
  const [sharedList, setSharedList] = useState<SharedUser[]>([]);
  const [loading, setLoading] = useState(false);

  const handleAddUser = () => {
    const trimmed = email.trim();
    if (!trimmed) return;
    if (sharedList.some((u) => u.email === trimmed)) {
      alert("Email đã tồn tại trong danh sách");
      return;
    }

    setSharedList([...sharedList, { email: trimmed, permission }]);
    setEmail("");
    setPermission("read");
  };

  const handleRemoveUser = (index: number) => {
    setSharedList(sharedList.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (sharedList.length === 0) {
      alert("Vui lòng thêm ít nhất một người dùng");
      return;
    }

    setLoading(true);

    const allow_read = sharedList.map((u) => u.email);
    const allow_write = sharedList
      .filter((u) => u.permission === "write" || u.permission === "delete")
      .map((u) => u.email);
    const allow_delete = sharedList
      .filter((u) => u.permission === "delete")
      .map((u) => u.email);

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${API_URL}/user/folder/${folderId}/change-permission/`,
        { allow_read, allow_write, allow_delete },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const result = response.data;
      console.log("Phân quyền:", result)
      console.log("Người phân quyền:", allow_read, allow_write, allow_delete)
      alert("Phân quyền thành công");
      if (onSubmit) onSubmit();
    } catch (error) {
      console.error("Lỗi phân quyền:", error);
      alert("Có lỗi xảy ra khi phân quyền");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded shadow w-full max-w-md">
      <h2 className="text-xl font-bold mb-4">Phân quyền thư mục</h2>

      <div className="mb-3">
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Nhập email người dùng"
          className="w-full border p-2 rounded"
        />
      </div>

      <div className="mb-3">
        <select
          value={permission}
          onChange={(e) => setPermission(e.target.value as SharedUser["permission"])}
          className="w-full border p-2 rounded"
        >
          <option value="read">Người xem</option>
          <option value="write">Người chỉnh sửa</option>
          <option value="delete">Người xóa</option>
        </select>
      </div>

      <button
        onClick={handleAddUser}
        className="bg-blue-600 text-white px-4 py-2 rounded w-full hover:bg-blue-700 mb-4"
      >
        Thêm người dùng
      </button>

      {sharedList.length > 0 && (
        <div className="mb-4">
          <h3 className="font-semibold mb-2">Danh sách phân quyền:</h3>
          {sharedList.map((user, index) => (
            <div
              key={index}
              className="flex justify-between items-center border p-2 mb-2 rounded text-sm"
            >
              <div>
                <p>{user.email}</p>
                <p className="text-gray-500 italic">{user.permission}</p>
              </div>
              <button
                onClick={() => handleRemoveUser(index)}
                className="text-red-600 hover:text-red-800 text-xs"
              >
                Xóa
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading}
        className={`w-full px-4 py-2 rounded text-white ${
          loading ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"
        }`}
      >
        {loading ? "Đang gửi..." : "Lưu phân quyền"}
      </button>
    </div>
  );
};

export default PermissionShare;

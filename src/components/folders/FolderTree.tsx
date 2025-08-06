import React, { useState, useEffect } from "react";
import PermissionShare from "../permissions/PermissionShare";
import { useNavigate } from "react-router-dom";

interface Folder {
  id: number;
  name: string;
  parent: number | null;
}

interface Props {
  folders: Folder[];
  sharedFolders?: SharedFolder[];
  selectedId: number | null;
  onSelectFolder: (id: number | null) => void;
  onAddFolder: (parent: number | null) => void;
  onDeleteFolder: (id: number) => void;
  onSelectSharedFolder?: (folderId: number) => void;
}

const FolderTree: React.FC<Props> = ({
  folders,
  sharedFolders = [],
  selectedId,
  onSelectFolder,
  onAddFolder,
  onDeleteFolder,
  onSelectSharedFolder,
}) => {
  const navigate = useNavigate();
  const [permissionFolderId, setPermissionFolderId] = useState<number | null>(null);
  const [isDriveExpanded, setIsDriveExpanded] = useState<boolean>(true);
  const [isSharedExpanded, setIsSharedExpanded] = useState<boolean>(true);
  const currentUserId = JSON.parse(localStorage.getItem("user") || "{}").id;

  useEffect(() => {
    setIsDriveExpanded(true);
  }, []);

  const toggleDriveExpanded = () => {
    setIsDriveExpanded(!isDriveExpanded);
  };

  const toggleSharedExpanded = () => {
    setIsSharedExpanded(!isSharedExpanded);
  };

  const renderTree = (parentId: number | null, level = 0) => {
    return folders
      .filter((f) => f.parent === parentId)
      .map((folder) => (
        <div key={folder.id} style={{ marginLeft: `${level * 16}px` }}>
          <div
            className={`cursor-pointer px-2 py-1 rounded hover:bg-blue-100 ${
              selectedId === folder.id ? "bg-blue-200 font-medium" : ""
            }`}
            onClick={() => {
              onSelectFolder(folder.id);
              navigate(`/folder/${folder.id}`);
            }}
          >
            📁 {folder.name}
            <span
              onClick={(e) => {
                e.stopPropagation();
                onAddFolder(folder.id);
              }}
              className="ml-2 text-green-500 hover:text-green-700 cursor-pointer text-sm"
            >
              ➕
            </span>
            <span
              onClick={(e) => {
                e.stopPropagation();
                onDeleteFolder(folder.id);
              }}
              className="ml-2 text-red-500 hover:text-red-700 cursor-pointer text-sm"
            >
              ❌
            </span>
            <span
              onClick={(e) => {
                e.stopPropagation();
                setPermissionFolderId(folder.id);
              }}
              className="ml-2 text-blue-500 hover:text-blue-700 cursor-pointer text-sm"
            >
              👥
            </span>
          </div>
          <div className="ml-4">{renderTree(folder.id, level + 1)}</div>
        </div>
      ));
  };

  // Render shared folders
  const renderSharedFolders = () => {
    return sharedFolders.map((folder) => (
      <div key={folder.id} className="cursor-pointer px-2 py-1 rounded hover:bg-green-100">
        <div
          onClick={() => onSelectSharedFolder && onSelectSharedFolder(folder.id)}
          className={`flex justify-between items-center ${
            selectedId === folder.id ? "bg-green-200 font-medium" : ""
          }`}
        >
          <span>
            📁 {folder.name}
            <span className="text-xs text-gray-500 ml-1">
              (by {folder.owner.username || folder.owner.email || "?"})
            </span>
          </span>
          <span className="text-xs text-gray-500">{folder.permission}</span>
        </div>
      </div>
    ));
  };

  return (
    <aside className="w-64 bg-gray-100 p-4 border-r overflow-y-auto">
      <li
        onClick={() => {
          onSelectFolder(null);
          navigate("/folder/home");
        }}
        className={`cursor-pointer px-2 py-1 rounded-md ${selectedId === null ? "bg-blue-100" : ""}`}
      >
        🏠 Trang chủ
      </li>
      {/* My Drive Section */}
        <div
          className={`cursor-pointer px-2 py-1 rounded hover:bg-blue-100 mb-2 ${
            isDriveExpanded ? "bg-blue-50" : ""
          }`}
          onClick={toggleDriveExpanded}
        >
          <div className="flex justify-between items-center">
            <span>
              {isDriveExpanded ? "📂" : "📁"} Drive của tôi
            </span>
            <button
              className="text-green-600 text-sm hover:underline"
              onClick={(e) => {
                e.stopPropagation();
                onAddFolder(null);
              }}
            >
              + Thêm
            </button>
          </div>
        </div>
        
        {isDriveExpanded && (
          <div className="ml-4 text-sm space-y-1 mb-4">
            {renderTree(null)}
          </div>
        )}
      
      <div
          className={`cursor-pointer px-2 py-1 rounded hover:bg-green-100 mb-2 ${
            isSharedExpanded ? "bg-green-50" : ""
          }`}
          onClick={toggleSharedExpanded}
        >
          <div className="flex justify-between items-center">
            <span>
              {isSharedExpanded ? "👥" : "👤"} Được chia sẻ với tôi
            </span>
            <span className="text-xs text-gray-500">
              ({sharedFolders.length})
            </span>
          </div>
        </div>

        {isSharedExpanded && (
          <div className="ml-4 text-sm space-y-1 mb-4">
            {renderSharedFolders()}
          </div>
        )}
      {permissionFolderId !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-[400px] relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-black"
              onClick={() => setPermissionFolderId(null)}
            >
              ✖
            </button>
            <PermissionShare folderId={permissionFolderId} userId={currentUserId} />
          </div>
        </div>
      )}
    </aside>
  );
};

export default FolderTree;

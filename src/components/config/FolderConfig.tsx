import React from "react";

export interface Folder {
  id: number;
  name: string;
  parent: number | null;
  allowUpload?: boolean;
  allowSync?: boolean;
}

interface FolderConfigProps {
  folder: Folder;
  onUpdate: (updated: Folder) => void;
}

const FolderConfig: React.FC<FolderConfigProps> = ({ folder, onUpdate }) => {
  const toggle = (key: "allowUpload" | "allowSync") => {
    onUpdate({ ...folder, [key]: !folder[key] });
  };

  return (
    <div className="p-4 border rounded mb-4">
      <h3 className="text-lg font-semibold mb-2">⚙️ Cấu hình thư mục</h3>
      <div className="flex gap-6 items-center text-sm">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={folder.allowUpload}
            onChange={() => toggle("allowUpload")}
          />
          Cho phép upload
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={folder.allowSync}
            onChange={() => toggle("allowSync")}
          />
          Cho phép đồng bộ từ Drive
        </label>
      </div>
    </div>
  );
};

export default FolderConfig;

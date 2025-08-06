import React from "react";
import Navbar from "./Navbar";

interface Props {
  children: React.ReactNode;
}

const MainLayout: React.FC<Props> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar nằm trên cùng toàn trang */}
      <Navbar />

      {/* Dưới navbar: chia 2 cột: Sidebar | Nội dung */}
      <div className="flex flex-1">
        
        <main className="flex-1 p-4 overflow-y-auto bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;

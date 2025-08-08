import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/authContext"; // bạn nhớ sửa lại đường dẫn đúng nếu khác

const Navbar: React.FC = () => {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutUser(); // dùng AuthContext cho đúng flow
    navigate("/login");
  };

  return (
    <nav className="bg-white shadow px-6 py-3 flex justify-between items-center">
      <Link to="/" className="text-lg font-semibold text-sky-700">
        📸 MyDrive
      </Link>

      <div className="flex items-center space-x-4">
        <Link to="/" className="text-gray-600 hover:text-sky-600 text-sm">Trang chủ</Link>
        <Link to="/login-google" className="text-gray-600 hover:text-sky-600 text-sm">Đăng nhập Google</Link>

        {user ? (
          <>
            <span className="text-sm text-gray-700">
              Xin chào, <b>{user.username}</b>
            </span>
            <button
              onClick={handleLogout}
              className="text-sm text-red-500 hover:underline"
            >
              Đăng xuất
            </button>
          </>
        ) : (
          <button
            onClick={() => navigate("/login")}
            className="text-sm text-sky-600 hover:underline"
          >
            Đăng nhập
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { register } from "../services/auth";

const Register = () => {
  const [username, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await register(username, email, password);
      alert("Đăng ký thành công! Vui lòng đăng nhập.");
      navigate("/login");
    } catch (err) {
      console.log("Lỗi:", err);
      alert("Đăng ký thất bại");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-tr from-purple-100 to-blue-100 flex justify-center items-center px-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">🔐</div>
          <h2 className="text-2xl font-bold text-blue-700">Tạo tài khoản</h2>
        </div>

        {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}

        <form onSubmit={handleRegister} className="space-y-4">
          <input
            type="text"
            placeholder="Tên đầy đủ"
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={username}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <input
            type="email"
            placeholder="Email"
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Mật khẩu"
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Đăng ký
          </button>
        </form>

        <p className="mt-5 text-sm text-center text-gray-600">
          Đã có tài khoản?{" "}
          <span
            className="text-blue-600 hover:underline cursor-pointer"
            onClick={() => navigate("/login")}
          >
            Đăng nhập
          </span>
        </p>
      </div>
    </div>
  );
};

export default Register;

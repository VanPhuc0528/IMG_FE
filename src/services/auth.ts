import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";

// ✅ Đăng nhập bằng email và password
export async function login(email: string, password: string) {
  const res = await axios.post(`${API_URL}/auth/login/`, {
    email,
    password,
  });
  return res.data;
}

// ✅ Đăng ký tài khoản mới
export async function register(username: string, email: string, password: string) {
  const res = await axios.post(`${API_URL}/auth/register/`, {
    username,
    email,
    password,
  });
  return res.data; //backend trả về username, email, password
}

// ✅ Đăng nhập với Google
export async function loginGoogle(access_token: string) {
  const res = await axios.post(`${API_URL}/auth/gg-login/`, {
    access_token: access_token,
  });
  return res.data; //backend trả về access_token từ Google
}

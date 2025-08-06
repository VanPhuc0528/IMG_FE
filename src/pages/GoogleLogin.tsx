import { useGoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import { loginGoogle } from '../services/auth'; // Hàm gọi API gg_login
import { useAuth } from '../context/authContext';

const GoogleLogin = () => {
  const navigate = useNavigate();
  const { loginUser } = useAuth();

  const login = useGoogleLogin({
    scope: 'openid email profile', //Lấy OpenID xác thực người dùng, lấy email chuẩn người dùng, và thông tin của người dùng email đó
    onSuccess: async (response) => {
      try {
        const { access_token } = response;
        if (!access_token) {
          console.error("Không nhận được access_token từ Google");
          return;
        }

        const res = await loginGoogle(access_token);
        const { user, token } = res;
        
        console.log("Token Google trả về:", access_token);

        loginUser(user, token); // Cập nhật context và localStorage
        navigate('/'); // Chuyển hướng về trang chính
      } catch (error) {
        console.error('Đăng nhập Google thất bại:', error);
      }
    },
    onError: (err) => {
      console.error('Lỗi đăng nhập Google:', err);
    }
  });

  return (
    <button
      onClick={() => login()}
      className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded"
    >
      Đăng nhập với Google
    </button>
  );
};

export default GoogleLogin;

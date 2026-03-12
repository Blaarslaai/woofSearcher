import { useState, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import Navbar from '../components/Navbar';
import Alert from '../components/Alert';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, loginLoading, loginError, isAuthenticated, isLoading } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setShowAlert(loginError instanceof Error);
    }, 500);

    return () => {
      window.clearTimeout(timer);
    };
  }, [loginError]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      await login({ username, password });
      navigate("/dashboard");
    } catch {
      // handled by loginError
    }
  }

  if (isLoading) return <div>Loading...</div>;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  return (
    <main className='flex flex-col min-h-screen'>
      <Navbar />    

      <div className='flex justify-center items-center mt-10'>
        <form onSubmit={handleSubmit} className='flex flex-col'>
          <fieldset className="fieldset bg-base-200 border-base-300 rounded-box w-xs border p-4 gap-4">
            <legend className="fieldset-legend mb-4">Login</legend>

            <label className="label">Username</label>
            <input
              className='input input-primary'
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              type="text"
              placeholder="Username"
              autoComplete="username"
            />

            <label className="label">Password</label>
            <input
              className='input input-primary'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              placeholder="Password"
              autoComplete="current-password"
            />

            <button type="submit" disabled={loginLoading} className='btn btn-primary'>
              {loginLoading ? "Logging in..." : "Login"}
            </button>
          </fieldset>
        </form>
      </div>

      <div className='flex flex-col justify-center items-center absolute bottom-0 top-auto mb-10 w-full'>
        {showAlert && <Alert type='alert-warning' message={loginError?.message && JSON.parse(loginError.message).message || "Login failed"} />}
      </div>
    </main>
  );
}

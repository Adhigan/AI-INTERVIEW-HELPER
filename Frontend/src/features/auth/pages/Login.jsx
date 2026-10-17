
import React, { useState } from "react";
import { useNavigate, Link } from "react-router";
import "../auth.form.scss";
import { useAuth } from "../hooks/useAuth";

const Login = () => {
    const { loading, handleLogin } = useAuth();
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        try {
            const success = await handleLogin({
                email,
                password
            });

            if (success) {
                navigate("/", { replace: true });
            }
        } catch (err) {
            setError(
                err.response?.data?.message ||
                err.message ||
                "Login failed. Please try again."
            );
        }
    };

    return (
        <main>
            <div className="form-container">
                <h1>Login</h1>

                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label htmlFor="email">Email</label>
                        <input
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            type="email"
                            id="email"
                            name="email"
                            placeholder="Enter email address"
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="password">Password</label>
                        <input
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            type="password"
                            id="password"
                            name="password"
                            placeholder="Enter password"
                            required
                        />
                    </div>

                    {error && (
                        <p role="alert" style={{ color: "red" }}>
                            {error}
                        </p>
                    )}

                    <button
                        className="button primary-button"
                        type="submit"
                        disabled={loading}
                    >
                        {loading ? "Logging in..." : "Login"}
                    </button>
                </form>

                <p>
                    Don't have an account?{" "}
                    <Link to="/register">Register</Link>
                </p>
            </div>
        </main>
    );
};

export default Login;

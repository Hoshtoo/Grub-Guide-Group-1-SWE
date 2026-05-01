import { useState } from "react"
import { supabase } from "../supabaseClient"

function AuthForm({ onAuthSuccess }) {
    const [mode, setMode] = useState("login")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [username, setUsername] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [message, setMessage] = useState(null)

    async function handleSubmit(e) {
        e.preventDefault()
        setError(null)
        setMessage(null)
        setLoading(true)

        try {
            if (mode === "login") {
                const { data, error } = await supabase.auth.signInWithPassword({
                    email,
                    password
                })
                if (error) throw error
                onAuthSuccess?.(data.user)
            } else {
                if (!username.trim()) {
                    throw new Error("Username is required")
                }
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            username: username.trim()
                        }
                    }
                })
                if (error) throw error
                if (data.user && !data.session) {
                    setMessage("Check your email for a confirmation link!")
                } else {
                    onAuthSuccess?.(data.user)
                }
            }
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    function toggleMode() {
        setMode(mode === "login" ? "signup" : "login")
        setError(null)
        setMessage(null)
    }

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <h1 style={styles.logo}>
                    Grub<span style={styles.logoAccent}>Guide</span>
                </h1>
                <p style={styles.subtitle}>
                    {mode === "login" ? "Welcome back" : "Create your account"}
                </p>

                <form onSubmit={handleSubmit} style={styles.form}>
                    {mode === "signup" && (
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Username</label>
                            <input
                                style={styles.input}
                                type="text"
                                placeholder="Choose a username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                        </div>
                    )}

                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Email</label>
                        <input
                            style={styles.input}
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Password</label>
                        <input
                            style={styles.input}
                            type="password"
                            placeholder="Your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                        />
                    </div>

                    {error && <div style={styles.error}>{error}</div>}
                    {message && <div style={styles.message}>{message}</div>}

                    <button
                        type="submit"
                        style={styles.button}
                        disabled={loading}
                    >
                        {loading
                            ? "Loading..."
                            : mode === "login"
                            ? "Sign In"
                            : "Create Account"}
                    </button>
                </form>

                <p style={styles.toggleText}>
                    {mode === "login"
                        ? "Don't have an account? "
                        : "Already have an account? "}
                    <button onClick={toggleMode} style={styles.toggleButton}>
                        {mode === "login" ? "Sign up" : "Sign in"}
                    </button>
                </p>
            </div>
        </div>
    )
}

const styles = {
    container: {
        minHeight: "100vh",
        backgroundColor: "#0f1a14",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px"
    },
    card: {
        width: "100%",
        maxWidth: "380px",
        backgroundColor: "rgba(255,255,255,0.04)",
        borderRadius: "16px",
        padding: "32px 28px",
        border: "0.5px solid rgba(255,255,255,0.08)"
    },
    logo: {
        fontFamily: "'DM Serif Display', serif",
        fontSize: "28px",
        color: "#a8d5b5",
        textAlign: "center",
        marginBottom: "4px"
    },
    logoAccent: {
        color: "#4caf78"
    },
    subtitle: {
        textAlign: "center",
        color: "rgba(232,240,234,0.5)",
        fontSize: "14px",
        marginBottom: "28px"
    },
    form: {
        display: "flex",
        flexDirection: "column",
        gap: "16px"
    },
    inputGroup: {
        display: "flex",
        flexDirection: "column"
    },
    label: {
        fontSize: "10px",
        marginBottom: "6px",
        color: "rgba(255,255,255,0.35)",
        fontWeight: "500",
        textTransform: "uppercase",
        letterSpacing: "1px"
    },
    input: {
        width: "100%",
        padding: "12px 14px",
        borderRadius: "8px",
        border: "0.5px solid rgba(255,255,255,0.12)",
        fontSize: "14px",
        boxSizing: "border-box",
        backgroundColor: "rgba(255,255,255,0.06)",
        color: "#e8f0ea"
    },
    button: {
        width: "100%",
        padding: "14px",
        backgroundColor: "#4caf78",
        color: "#0f1a14",
        border: "none",
        borderRadius: "8px",
        fontSize: "15px",
        cursor: "pointer",
        fontWeight: "600",
        marginTop: "8px"
    },
    error: {
        backgroundColor: "rgba(232,90,90,0.12)",
        border: "0.5px solid rgba(232,90,90,0.3)",
        borderRadius: "8px",
        padding: "10px 14px",
        color: "#f1a16d",
        fontSize: "13px"
    },
    message: {
        backgroundColor: "rgba(76,175,120,0.12)",
        border: "0.5px solid rgba(76,175,120,0.3)",
        borderRadius: "8px",
        padding: "10px 14px",
        color: "#9be1b7",
        fontSize: "13px"
    },
    toggleText: {
        textAlign: "center",
        color: "rgba(232,240,234,0.5)",
        fontSize: "13px",
        marginTop: "20px"
    },
    toggleButton: {
        background: "none",
        border: "none",
        color: "#4caf78",
        cursor: "pointer",
        fontSize: "13px",
        fontWeight: "600",
        padding: 0
    }
}

export default AuthForm

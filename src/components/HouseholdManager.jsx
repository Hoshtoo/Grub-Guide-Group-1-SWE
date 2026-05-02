import { useState, useEffect } from "react"
import { supabase } from "../supabaseClient"

function generateInviteCode() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    let result = ""
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
}

/** households.created_by and household_members.user_id FK to profiles(id) */
async function ensureProfileRow() {
    const { data: { user: sessionUser }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !sessionUser) {
        throw new Error("Not signed in")
    }

    const { data: existing } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", sessionUser.id)
        .maybeSingle()

    if (existing) return sessionUser

    const metaName = sessionUser.user_metadata?.username?.trim()
    const emailLocal = sessionUser.email?.split("@")[0]?.trim()
    let username = (metaName || emailLocal || "user").slice(0, 32)
    if (!username) username = "user"

    let { error: insertErr } = await supabase.from("profiles").insert({
        id: sessionUser.id,
        username
    })

    if (insertErr?.code === "23505") {
        username = `${username.slice(0, 20)}_${sessionUser.id.slice(0, 8)}`
        const retry = await supabase.from("profiles").insert({
            id: sessionUser.id,
            username
        })
        insertErr = retry.error
    }

    if (insertErr) throw insertErr
    return sessionUser
}

function HouseholdManager({ user, household, members, onClose, onHouseholdChange }) {
    const [mode, setMode] = useState(household ? "view" : "choose")
    const [householdName, setHouseholdName] = useState("")
    const [joinCode, setJoinCode] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [copied, setCopied] = useState(false)

    useEffect(() => {
        if (household) {
            setMode("view")
        } else {
            setMode("choose")
        }
    }, [household])

    async function handleCreateHousehold(e) {
        e.preventDefault()
        if (!householdName.trim()) return

        setLoading(true)
        setError(null)

        try {
            const sessionUser = await ensureProfileRow()
            const inviteCode = generateInviteCode()

            const { data: newHousehold, error: createError } = await supabase
                .from("households")
                .insert({
                    name: householdName.trim(),
                    invite_code: inviteCode,
                    created_by: sessionUser.id
                })
                .select()
                .single()

            if (createError) throw createError

            const { error: joinError } = await supabase
                .from("household_members")
                .insert({
                    household_id: newHousehold.id,
                    user_id: sessionUser.id
                })

            if (joinError) throw joinError

            onHouseholdChange?.()
            setHouseholdName("")
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    async function handleJoinHousehold(e) {
        e.preventDefault()
        if (!joinCode.trim()) return

        setLoading(true)
        setError(null)

        try {
            const sessionUser = await ensureProfileRow()

            const { data: rows, error: findError } = await supabase.rpc(
                "get_household_by_invite_code",
                { code: joinCode.trim().toUpperCase() }
            )
            const foundHousehold = Array.isArray(rows) ? rows[0] : rows

            if (findError || !foundHousehold) {
                throw new Error("Invalid invite code")
            }

            const { error: joinError } = await supabase
                .from("household_members")
                .insert({
                    household_id: foundHousehold.id,
                    user_id: sessionUser.id
                })

            if (joinError) {
                if (joinError.code === "23505") {
                    throw new Error("You're already in this household")
                }
                throw joinError
            }

            onHouseholdChange?.()
            setJoinCode("")
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    async function handleLeaveHousehold() {
        if (!household) return
        if (!confirm("Are you sure you want to leave this household?")) return

        setLoading(true)
        setError(null)

        try {
            const { error } = await supabase
                .from("household_members")
                .delete()
                .eq("household_id", household.id)
                .eq("user_id", user.id)

            if (error) throw error

            onHouseholdChange?.()
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    function copyInviteCode() {
        if (household?.invite_code) {
            navigator.clipboard.writeText(household.invite_code)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    return (
        <div style={styles.overlay} onClick={onClose}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div style={styles.header}>
                    <h2 style={styles.title}>Household</h2>
                    <button onClick={onClose} style={styles.closeBtn}>×</button>
                </div>

                {error && <div style={styles.error}>{error}</div>}

                {mode === "view" && household && (
                    <div style={styles.content}>
                        <div style={styles.householdInfo}>
                            <div style={styles.householdName}>{household.name}</div>
                            <div style={styles.inviteSection}>
                                <label style={styles.label}>Invite Code</label>
                                <div style={styles.codeRow}>
                                    <code style={styles.code}>{household.invite_code}</code>
                                    <button onClick={copyInviteCode} style={styles.copyBtn}>
                                        {copied ? "Copied!" : "Copy"}
                                    </button>
                                </div>
                                <p style={styles.hint}>Share this code with others to invite them</p>
                            </div>
                        </div>

                        <div style={styles.membersSection}>
                            <label style={styles.label}>Members ({members?.length || 0})</label>
                            <ul style={styles.memberList}>
                                {members?.map((m) => (
                                    <li key={m.user_id} style={styles.memberItem}>
                                        <span style={styles.memberAvatar}>
                                            {(m.profiles?.username || "?").charAt(0).toUpperCase()}
                                        </span>
                                        <span style={styles.memberName}>
                                            {m.profiles?.username || "Unknown"}
                                            {m.user_id === user.id && " (you)"}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <button
                            onClick={handleLeaveHousehold}
                            style={styles.leaveBtn}
                            disabled={loading}
                        >
                            {loading ? "Leaving..." : "Leave Household"}
                        </button>
                    </div>
                )}

                {mode === "choose" && (
                    <div style={styles.content}>
                        <p style={styles.description}>
                            Join a household to share your pantry with family or roommates.
                        </p>

                        <div style={styles.optionCard}>
                            <h3 style={styles.optionTitle}>Create a Household</h3>
                            <form onSubmit={handleCreateHousehold}>
                                <input
                                    style={styles.input}
                                    type="text"
                                    placeholder="Household name"
                                    value={householdName}
                                    onChange={(e) => setHouseholdName(e.target.value)}
                                />
                                <button
                                    type="submit"
                                    style={styles.primaryBtn}
                                    disabled={loading || !householdName.trim()}
                                >
                                    {loading ? "Creating..." : "Create"}
                                </button>
                            </form>
                        </div>

                        <div style={styles.orDivider}>
                            <span>or</span>
                        </div>

                        <div style={styles.optionCard}>
                            <h3 style={styles.optionTitle}>Join with Invite Code</h3>
                            <form onSubmit={handleJoinHousehold}>
                                <input
                                    style={styles.input}
                                    type="text"
                                    placeholder="Enter 6-character code"
                                    value={joinCode}
                                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                                    maxLength={6}
                                />
                                <button
                                    type="submit"
                                    style={styles.secondaryBtn}
                                    disabled={loading || joinCode.length !== 6}
                                >
                                    {loading ? "Joining..." : "Join"}
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

const styles = {
    overlay: {
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        zIndex: 1000
    },
    modal: {
        width: "100%",
        maxWidth: "400px",
        backgroundColor: "#1a2820",
        borderRadius: "16px",
        border: "0.5px solid rgba(255,255,255,0.1)",
        overflow: "hidden"
    },
    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "16px 20px",
        borderBottom: "0.5px solid rgba(255,255,255,0.08)"
    },
    title: {
        fontSize: "16px",
        fontWeight: "600",
        color: "#e8f0ea",
        margin: 0
    },
    closeBtn: {
        background: "none",
        border: "none",
        fontSize: "24px",
        color: "rgba(232,240,234,0.5)",
        cursor: "pointer",
        padding: 0,
        lineHeight: 1
    },
    content: {
        padding: "20px"
    },
    description: {
        color: "rgba(232,240,234,0.6)",
        fontSize: "14px",
        marginBottom: "20px",
        lineHeight: 1.5
    },
    error: {
        margin: "12px 20px 0",
        backgroundColor: "rgba(232,90,90,0.12)",
        border: "0.5px solid rgba(232,90,90,0.3)",
        borderRadius: "8px",
        padding: "10px 14px",
        color: "#f1a16d",
        fontSize: "13px"
    },
    optionCard: {
        backgroundColor: "rgba(255,255,255,0.03)",
        borderRadius: "10px",
        padding: "16px",
        border: "0.5px solid rgba(255,255,255,0.06)"
    },
    optionTitle: {
        fontSize: "13px",
        fontWeight: "600",
        color: "#e8f0ea",
        marginBottom: "12px"
    },
    input: {
        width: "100%",
        padding: "10px 12px",
        borderRadius: "8px",
        border: "0.5px solid rgba(255,255,255,0.12)",
        fontSize: "14px",
        boxSizing: "border-box",
        backgroundColor: "rgba(255,255,255,0.06)",
        color: "#e8f0ea",
        marginBottom: "10px"
    },
    label: {
        display: "block",
        fontSize: "10px",
        marginBottom: "8px",
        color: "rgba(255,255,255,0.35)",
        fontWeight: "500",
        textTransform: "uppercase",
        letterSpacing: "1px"
    },
    primaryBtn: {
        width: "100%",
        padding: "10px",
        backgroundColor: "#4caf78",
        color: "#0f1a14",
        border: "none",
        borderRadius: "8px",
        fontSize: "14px",
        cursor: "pointer",
        fontWeight: "600"
    },
    secondaryBtn: {
        width: "100%",
        padding: "10px",
        backgroundColor: "rgba(127,177,220,0.14)",
        color: "#b9d6ee",
        border: "0.5px solid rgba(127,177,220,0.35)",
        borderRadius: "8px",
        fontSize: "14px",
        cursor: "pointer",
        fontWeight: "600"
    },
    orDivider: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        margin: "16px 0",
        color: "rgba(232,240,234,0.3)",
        fontSize: "12px"
    },
    householdInfo: {
        marginBottom: "20px"
    },
    householdName: {
        fontSize: "20px",
        fontWeight: "600",
        color: "#e8f0ea",
        marginBottom: "16px"
    },
    inviteSection: {
        backgroundColor: "rgba(255,255,255,0.03)",
        borderRadius: "10px",
        padding: "14px",
        border: "0.5px solid rgba(255,255,255,0.06)"
    },
    codeRow: {
        display: "flex",
        gap: "10px",
        alignItems: "center"
    },
    code: {
        flex: 1,
        padding: "10px 14px",
        backgroundColor: "rgba(76,175,120,0.1)",
        borderRadius: "6px",
        color: "#9be1b7",
        fontSize: "18px",
        fontFamily: "monospace",
        letterSpacing: "3px",
        textAlign: "center"
    },
    copyBtn: {
        padding: "10px 14px",
        backgroundColor: "rgba(255,255,255,0.06)",
        color: "#e8f0ea",
        border: "0.5px solid rgba(255,255,255,0.12)",
        borderRadius: "6px",
        fontSize: "13px",
        cursor: "pointer",
        fontWeight: "500"
    },
    hint: {
        fontSize: "12px",
        color: "rgba(232,240,234,0.4)",
        marginTop: "10px",
        marginBottom: 0
    },
    membersSection: {
        marginBottom: "20px"
    },
    memberList: {
        listStyle: "none",
        padding: 0,
        margin: 0
    },
    memberItem: {
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "10px 0",
        borderBottom: "0.5px solid rgba(255,255,255,0.06)"
    },
    memberAvatar: {
        width: "32px",
        height: "32px",
        borderRadius: "50%",
        backgroundColor: "rgba(76,175,120,0.2)",
        color: "#9be1b7",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "13px",
        fontWeight: "600"
    },
    memberName: {
        fontSize: "14px",
        color: "#e8f0ea"
    },
    leaveBtn: {
        width: "100%",
        padding: "12px",
        backgroundColor: "rgba(232,90,90,0.12)",
        color: "#e87070",
        border: "0.5px solid rgba(232,90,90,0.3)",
        borderRadius: "8px",
        fontSize: "14px",
        cursor: "pointer",
        fontWeight: "500"
    }
}

export default HouseholdManager

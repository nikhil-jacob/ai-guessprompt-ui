import React, { useState, useEffect, useRef } from "react";

function GuessPromptGame() {
  const [mode, setMode] = useState("single");
  const [playerCount, setPlayerCount] = useState(2);
  const [players, setPlayers] = useState([]);
  const [name, setName] = useState("");
  const [guess, setGuess] = useState("");
  const [score, setScore] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [leaderboard, setLeaderboard] = useState([]);
  const [loadingPrompt, setLoadingPrompt] = useState(false);
  const [guessImage, setGuessImage] = useState("");
  const [guessLoad, setGuessLoad] = useState(false);
  const [groupScores, setGroupScores] = useState([]);
  const [muted, setMuted] = useState(false);

  const audioRef = useRef(null);

  // 🎵 Setup background music
  useEffect(() => {
  audioRef.current = new Audio("/background-music.mp3");
  audioRef.current.loop = true;
  audioRef.current.volume = 0.5;

  const tryPlay = () => {
    audioRef.current.play()
      .then(() => {
        console.log("Music started 🎵");
      })
      .catch(() => {
        console.log("Autoplay blocked, will retry in 2s or on user interaction.");
        setTimeout(tryPlay, 2000); // retry every 2s until it works
      });
  };

  tryPlay();

  return () => {
    audioRef.current.pause();
    audioRef.current = null;
  };
}, []);

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !audioRef.current.muted;
      setMuted(audioRef.current.muted);
    }
  };

  // Helper function to enforce 12-word limit
  const enforceWordLimit = (value) => {
    const words = value.trim().split(/\s+/).filter(Boolean);
    if (words.length <= 12) {
      return value;
    }
    return words.slice(0, 12).join(" ");
  };

  // Load a new prompt
  const fetchPrompt = () => {
    setLoadingPrompt(true);
    fetch("http://localhost:4000/prompt")
      .then((res) => res.json())
      .then((data) => {
        setImageUrl(data.image);
        setSubmitted(false);
        setGuess("");
        setScore(null);
        setGroupScores([]);
        setGuessImage("");
        setPlayers(Array.from({ length: playerCount }, () => ({ name: "", guess: "" })));
      })
      .catch(() => alert("Failed to load prompt."))
      .finally(() => setLoadingPrompt(false));
  };

  // Load leaderboard
  const fetchLeaderboard = () => {
    fetch("http://localhost:4000/leaderboard")
      .then((res) => res.json())
      .then((data) => setLeaderboard(data));
  };

  useEffect(() => {
    document.title = "Guess the Prompt Game";
    fetchPrompt();
    fetchLeaderboard();
  }, []);

  const handleSubmit = () => {
    setGuessLoad(true);

    if (mode === "single") {
      fetch("http://localhost:4000/guess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, guess }),
      })
        .then((res) => res.json())
        .then((data) => {
          setScore(data.score);
          setGuessImage(data.guessImage);
          setSubmitted(true);
          fetchLeaderboard();
        })
        .finally(() => setGuessLoad(false));
    } else {
      fetch("http://localhost:4000/guess-group", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ players }),
      })
        .then((res) => res.json())
        .then((data) => {
          setGroupScores(data.scores);
          setGuessImage(data.topScorerImage);
          setSubmitted(true);
          fetchLeaderboard();
        })
        .finally(() => setGuessLoad(false));
    }
  };

  return (
    <div style={containerStyle}>
      {/* Leaderboard */}
      <div style={leaderboardStyle}>
        <h2 style={{ marginBottom: 16, color: "#facc15" }}>🏆 Leaderboard</h2>
        <ul style={{ padding: 0, listStyle: "none" }}>
          {leaderboard.slice(0, 10).map((entry, i) => (
            <li key={i} style={leaderboardItemStyle}>
              <span>{i + 1}. {entry.name}</span>
              <span>{entry.score}</span>
            </li>
          ))}
        </ul>

        {/* 🎵 Mute / Unmute Button */}
        <button
          onClick={toggleMute}
          style={{
            ...buttonStyle,
            marginTop: 20,
            background: muted ? "#ef4444" : "#22c55e",
          }}
        >
          {muted ? "🔇 Unmute" : "🔊 Mute"}
        </button>
      </div>

      {/* Game Area */}
      <div style={gameAreaStyle}>
        <h1 style={headerStyle}>🎯 Guess the Prompt</h1>

        {!submitted && (
          <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: "12px" }}>
            <label>Mode:</label>
            <select
              value={mode}
              onChange={(e) => {
                setMode(e.target.value);
                if (e.target.value === "group") {
                  setPlayers(Array.from({ length: playerCount }, () => ({ name: "", guess: "" })));
                }
              }}
              style={inputStyle}
            >
              <option value="single">Single Player</option>
              <option value="group">Group</option>
            </select>

            {mode === "group" && (
              <>
                <label>Players:</label>
                <input
                  type="number"
                  value={playerCount}
                  min={2}
                  max={5}
                  style={{ ...inputStyle, width: "80px" }}
                  onChange={(e) => {
                    let val = parseInt(e.target.value, 10);
                    if (isNaN(val)) val = 2;
                    if (val < 2) val = 2;
                    if (val > 5) val = 5;
                    setPlayerCount(val);
                    setPlayers(Array.from({ length: val }, () => ({ name: "", guess: "" })));
                  }}
                />
              </>
            )}
          </div>
        )}

        {/* Game body */}
        <div style={{ flex: 1, display: "flex", height: "100%", gap: "16px" }}>
          {/* Image area */}
          <div style={imageBoxStyle}>
            {loadingPrompt ? (
              <p>Loading image...</p>
            ) : (
              imageUrl && <img src={imageUrl} alt="AI Generated" style={imageStyle} />
            )}
          </div>

          {/* Input / Results area */}
          <div style={inputAreaStyle}>
            {!submitted ? (
              <>
                {mode === "single" ? (
                  <>
                    <input
                      placeholder="Your Name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      style={inputStyle}
                    />
                    <input
                      placeholder="Guess the prompt... (Max 12 words)"
                      value={guess}
                      onChange={(e) => setGuess(enforceWordLimit(e.target.value))}
                      style={inputStyle}
                      onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                    />
                  </>
                ) : (
                  players.map((p, i) => (
                    <div key={i} style={{ marginBottom: 12, width: "100%" }}>
                      <input
                        placeholder={`Player ${i + 1} Name`}
                        value={p.name}
                        onChange={(e) =>
                          setPlayers((prev) =>
                            prev.map((pl, idx) =>
                              idx === i ? { ...pl, name: e.target.value } : pl
                            )
                          )
                        }
                        style={inputStyle}
                      />
                      <input
                        placeholder={`Player ${i + 1} Guess (Max 12 words)`}
                        value={p.guess}
                        onChange={(e) =>
                          setPlayers((prev) =>
                            prev.map((pl, idx) =>
                              idx === i
                                ? { ...pl, guess: enforceWordLimit(e.target.value) }
                                : pl
                            )
                          )
                        }
                        style={inputStyle}
                      />
                    </div>
                  ))
                )}

                <button
                  onClick={handleSubmit}
                  disabled={
                    guessLoad ||
                    (mode === "single"
                      ? !name.trim() || !guess.trim()
                      : players.length !== playerCount ||
                        players.some((p) => !p.name.trim() || !p.guess.trim()))
                  }
                  style={buttonStyle}
                >
                  {guessLoad ? "Loading ..." : "Submit Guess"}
                </button>
              </>
            ) : (
              <>
                <div
                  style={{
                    display: "flex",
                    gap: "16px",
                    justifyContent: "center",
                    flexWrap: "wrap",
                  }}
                >
                  {mode === "single" ? (
                    <div style={{ textAlign: "center" }}>
                      <h2 style={{ color: "#10b981" }}>Your Score: {score}</h2>
                      {guessImage && (
                        <img src={guessImage} alt="Guessed" style={imageStyle} />
                      )}
                    </div>
                  ) : (
                    <>
                      <div style={{ textAlign: "center" }}>
                        {groupScores[0]?.score > 0 && (
                          <h3 style={{ color: "#facc15" }}>
                            🏆 Top Scorer: {groupScores[0].name}
                          </h3>
                        )}
                        {guessImage && (
                          <img src={guessImage} alt="Top scorer" style={imageStyle} />
                        )}
                      </div>
                      <div style={{ textAlign: "left" }}>
                        <h2 style={{ color: "#10b981" }}>Group Scores:</h2>
                        <ul>
                          {groupScores.map((p, i) => (
                            <li key={i}>
                              {p.name}: {p.score}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </>
                  )}
                </div>

                <button
                  onClick={() => {
                    setMode("single");
                    setPlayerCount(2);
                    setPlayers([]);
                    setName("");
                    setGuess("");
                    setScore(null);
                    setGroupScores([]);
                    setGuessImage("");
                    setSubmitted(false);
                    fetchPrompt();
                  }}
                  style={buttonStyle}
                >
                  Next Round 🔄
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Styles
const containerStyle = {
  display: "flex",
  height: "100vh",
  backgroundColor: "#0f172a",
  color: "#e2e8f0",
  fontFamily: "Segoe UI, sans-serif",
};

const leaderboardStyle = {
  width: "20%",
  padding: "24px",
  backgroundColor: "#1e293b",
  overflowY: "auto",
  borderRight: "1px solid #334155",
};

const leaderboardItemStyle = {
  display: "flex",
  justifyContent: "space-between",
  padding: "6px 0",
  borderBottom: "1px solid #334155",
};

const gameAreaStyle = {
  width: "80%",
  padding: "24px",
  display: "flex",
  flexDirection: "column",
};

const headerStyle = {
  color: "#facc15",
  textAlign: "center",
  marginBottom: 16,
  fontSize: "1.5rem",
};

const imageBoxStyle = {
  width: "50%",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  padding: "10px",
  backgroundColor: "#1e293b",
  borderRadius: 8,
  minHeight: "300px",
};

const imageStyle = {
  maxHeight: "300px",
  maxWidth: "100%",
  objectFit: "contain",
  borderRadius: 8,
  border: "2px solid #334155",
};

const inputAreaStyle = {
  width: "50%",
  padding: "20px",
  display: "flex",
  flexDirection: "column",
  justifyContent: "flex-start",
  alignItems: "center",
};

const inputStyle = {
  width: "90%",
  padding: 12,
  marginBottom: 6,
  borderRadius: 8,
  background: "#334155",
  color: "#e2e8f0",
  border: "1px solid #475569",
  fontSize: "1rem",
};

const buttonStyle = {
  width: "80%",
  padding: 12,
  background: "#4f46e5",
  color: "#fff",
  fontWeight: "bold",
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
  marginTop: 16,
  marginBottom: 16,
};

export default GuessPromptGame;

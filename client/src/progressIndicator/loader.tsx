import React from "react";
import "./dot.css";
export const Indicator: React.FC = () => {
  return (
    <div style={styling.loaderContainer}>
      <div style={styling.emoji}>🌱</div>
      <p style={styling.text}>Henter din informasjon...</p>
      <div style={styling.bouncingDots}>
        <div style={styling.dot} className="bounce"></div>
        <div style={styling.dot} className="bounce"></div>
        <div style={styling.dot} className="bounce"></div>
      </div>
    </div>
  );
};
const styling = {
  loaderContainer: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    height: "30vh",
    fontFamily: "'Comic Sans MS', cursive, sans-serif",
    backgroundColor: "rgba(116,138,106,0.5)",
    color: "#fffefe",
  },
  emoji: {
    fontSize: "4rem",
    marginBottom: "1rem",
  },
  text: {
    fontSize: "1.5rem",
    marginBottom: "1rem",
  },
  bouncingDots: {
    display: "flex",
    gap: "0.5rem",
  },
  dot: {
    width: "1rem",
    height: "1rem",
    backgroundColor: "#82bd7e",
    borderRadius: "50%",
    animation: "bounce 1.5s infinite ease-in-out",
  },
};

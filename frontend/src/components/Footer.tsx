import { type CSSProperties } from "react";

export function Footer() {
  const footerStyle: CSSProperties = {
    backgroundColor: "#1e222d",
    borderTop: "1px solid #2a2e39",
    padding: "24px",
    marginTop: "auto", 
    marginLeft: "-24px",
    marginRight: "-24px",
    marginBottom: "-40px", 
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "12px",
    zIndex: 10
  };

  const textStyle: CSSProperties = {
    color: "#8d929b",
    fontSize: "12px",
    textAlign: "center",
    lineHeight: "1.5"
  };


  return (
    <footer style={footerStyle}>
      <div style={textStyle}>
        &copy; {new Date().getFullYear()} FINBOARD PRO. All rights reserved.<br/>
        Market data provided for simulation purposes only.
      </div>
    </footer>
  );
}
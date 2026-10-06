import React from "react";

export function LiveComments({ onOpenChat }: { onOpenChat: () => void }) {
  return (
    <button className="ea-comments" onClick={onOpenChat} aria-label="Ouvrir les commentaires">
      <div><b>Jean</b> Bravo 👏</div>
      <div><b>Awa</b> Magnifique émission !</div>
      <div><b>Koffi</b> 🔥🔥🔥</div>
    </button>
  );
}

import { useState, useEffect } from "react";

function App() {
  const [chars, setChars] = useState([]);

  useEffect(() => {
    const load = async () => {
      const res = await fetch("http://localhost:8000/api/characters");
      const data = await res.json();
      const list = Object.entries(data).map(([char, info]) => ({
        char,
        ...info,
      }));
      setChars(list);
    };
    load();
  }, []);

  return (
    <div>
      {chars.map((c) => (
        <div key={c.char}>
          <span>{c.char}</span> — {c.pinyin} (HSK {c.hsk})
        </div>
      ))}
    </div>
  );
}

export default App;

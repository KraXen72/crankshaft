type RowObjectType = {
  position: string;
  name: string;
  score: string;
  kills: string;
  deaths: string;
  objective: string;
  damage: string;
};

export function isCompetitiveMode() {
  const competitive = document.getElementById("mMenuHolComp");
  return competitive.style.display === "block";
}

export function createButton() {
  let button = document.createElement("button");
  button.innerText = "Export Match Info";
  button.style.position = "absolute";
  button.style.top = "20px";
  button.style.left = "20px";
  button.style.padding = "10px 15px";
  button.style.borderRadius = "5px";
  button.style.border = "none";
  button.style.backgroundColor = "#4CAF50";
  button.style.color = "white";
  button.style.fontSize = "16px";
  button.style.cursor = "pointer";
  button.style.boxShadow = "0px 4px 6px rgba(0, 0, 0, 0.1)";
  button.style.transition = "background-color 0.3s ease, transform 0.1s ease";
  button.style.zIndex = "1000";
  button.style.pointerEvents = "auto";
  button.style.display = "none";

  button.onmouseover = () => (button.style.backgroundColor = "#45a049");
  button.onmouseout = () => (button.style.backgroundColor = "#4CAF50");
  button.onmousedown = () => (button.style.transform = "scale(0.95)");
  button.onmouseup = () => (button.style.transform = "scale(1)");

  document.body.appendChild(button);
  return button;
}

export function showCopiedLabel() {
  const label = document.createElement("div");
  label.innerText = "Copied to clipboard!";
  label.style.position = "absolute";
  label.style.top = "0px";
  label.style.left = "20px";
  label.style.backgroundColor = "#333";
  label.style.color = "#fff";
  label.style.padding = "5px 10px";
  label.style.borderRadius = "3px";
  label.style.fontSize = "14px";
  label.style.boxShadow = "0px 4px 6px rgba(0, 0, 0, 0.1)";
  label.style.transition = "opacity 0.5s ease";
  label.style.opacity = "1";
  label.style.zIndex = "1001";

  document.body.appendChild(label);

  setTimeout(() => {
    label.style.opacity = "0";
    setTimeout(() => {
      document.body.removeChild(label);
    }, 500);
  }, 1500);
}

export function setupClipboardCopy(button) {
  button.addEventListener("click", () => {
    const rows = Array.from(document.querySelectorAll("#endTable tr"));
    rows.shift();

    const data: RowObjectType[] = [];
    rows.forEach((row, index) => {
      if (index === 0) return;

      const cells = row.querySelectorAll("td");
      const rowData = Array.from(cells).map((cell) => cell.innerText.trim());

      rowData.splice(2, -2);

      const rowObject = {
        position: rowData[0].substring(0, 1) || "",
        name: rowData[1].split(" ")[0] || "",
        score: rowData[2] || "",
        kills: rowData[3] || "",
        deaths: rowData[4] || "",
        objective: rowData[5] || "",
        damage: rowData[6] || "",
      };
      data.push(rowObject);
    });

    const jsonToCopy = JSON.stringify(data, null, 2);
    navigator.clipboard.writeText(jsonToCopy);
    showCopiedLabel();
  });
}

export function initializeCompResultSaver() {
  let button = createButton();
  setupClipboardCopy(button);

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      const endTable = document.querySelector("#endTable");
      console.log(isCompetitiveMode());
      if (isCompetitiveMode() && endTable) {
        button.style.display = "block";
      } else {
        button.style.display = "none";
      }
    });
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

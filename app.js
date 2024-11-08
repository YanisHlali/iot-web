let history = [];
let lastTimestamp = null;
let totalOnTime = 0;
let ledIsOn = false;
let realTimeTimer;

async function fetchLEDData() {
  try {
    const response = await fetch("http://localhost:1880/ledStatus");
    const data = await response.json();

    document.getElementById("ledStatus").innerText = data.status;
    document.getElementById("dailyCount").innerText = data.dailyCount;
    document.getElementById("lastTimestamp").innerText = new Date(
      data.timestamp
    ).toLocaleString();

    const currentTimestamp = new Date(data.timestamp);

    if (
      data.status === "on" &&
      (!ledIsOn ||
        !lastTimestamp ||
        currentTimestamp - lastTimestamp > 1000)
    ) {
      ledIsOn = true;
      history.push(currentTimestamp.toLocaleString());
      lastTimestamp = currentTimestamp;
      startRealTimeTimer();
      updateHistory();
    } else if (data.status === "off" && ledIsOn) {
      ledIsOn = false;
      stopRealTimeTimer();
    }
  } catch (error) {
    console.error("Erreur lors de la récupération des données :", error);
  }
}

function toggleLed() {
  const newState = ledIsOn ? "off" : "on";
  fetch(`http://localhost:1880/toggleLed?state=${newState}`)
    .then((response) => response.text())
    .then((data) => {
      console.log("Commande envoyée :", data);
    })
    .catch((error) => {
      console.error("Erreur lors de l'envoi de la commande :", error);
    });
}

function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours}h ${minutes}m ${secs}s`;
}

function updateHistory() {
  const historyList = document.getElementById("history");
  historyList.innerHTML = "";
  const today = new Date().toLocaleDateString();
  history
    .filter((time) => new Date(time).toLocaleDateString() === today)
    .forEach((time) => {
      const listItem = document.createElement("li");
      listItem.innerText = `Allumé à : ${time}`;
      historyList.appendChild(listItem);
    });
}

function startRealTimeTimer() {
  if (!realTimeTimer) {
    realTimeTimer = setInterval(() => {
      totalOnTime += 1;
      document.getElementById("totalOnTime").innerText =
        formatDuration(totalOnTime);
    }, 1000);
  }
}

function stopRealTimeTimer() {
  clearInterval(realTimeTimer);
  realTimeTimer = null;
}

function exportData() {
  let csvContent =
    "data:text/csv;charset=utf-8,Date et heure d'allumage\n";
  history.forEach((time) => {
    csvContent += `${time}\n`;
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "historique_allumages.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

setInterval(fetchLEDData, 1000);
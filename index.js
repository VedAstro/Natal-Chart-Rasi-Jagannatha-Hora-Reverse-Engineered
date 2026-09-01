// Natal Rasi (D-1) data reconstructed from the JHora workflow.
// Requires Node.js 18+ (fetch is built in).

const API_BASE_URL = "https://api.vedastro.org/api";
const AYANAMSA = "LAHIRI";

// Change these values to calculate another natal chart.
const birthDetails = {
  StdTime: "14:20 16/10/1918 +05:30",
  Location: {
    Name: "Bangalore, India",
    Longitude: 77.5946,
    Latitude: 12.9716,
  },
};

const useGet = process.argv.includes("--get");

function buildGetUrl(calculatorName) {
  const [clock, date, offset] = birthDetails.StdTime.split(/\s+/);
  const [day, month, year] = date.split("/");
  const location = birthDetails.Location.Name.replace(/\s+/g, "");
  const parts = [
    "Calculate",
    calculatorName,
    "Location",
    location,
    "Time",
    clock,
    day,
    month,
    year,
    offset,
    "Ayanamsa",
    AYANAMSA,
  ];

  return `${API_BASE_URL}/${parts.map(encodeURIComponent).join("/")}`;
}

async function calculate(calculatorName) {
  const url = useGet
    ? buildGetUrl(calculatorName)
    : `${API_BASE_URL}/Calculate/${calculatorName}`;

  const response = await fetch(url, useGet
    ? undefined
    : {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Ayanamsa: AYANAMSA,
          Time: birthDetails,
        }),
      });

  if (!response.ok) {
    throw new Error(`${calculatorName} failed: HTTP ${response.status}`);
  }

  const envelope = await response.json();
  if (envelope.Status !== "Pass") {
    throw new Error(`${calculatorName} failed: ${JSON.stringify(envelope.Payload)}`);
  }

  return envelope.Payload[calculatorName];
}

function toNamedObject(rows, nameKey, valueKey) {
  return Object.fromEntries(rows.map((row) => [row[nameKey], row[valueKey]]));
}

async function main() {
  const [planetRows, houseRows] = await Promise.all([
    calculate("AllPlanetRasiSigns"),
    calculate("AllHouseRasiSigns"),
  ]);

  const planets = toNamedObject(
    planetRows,
    "Planet",
    "AllPlanetRasiSigns",
  );
  const houses = toNamedObject(
    houseRows,
    "House",
    "AllHouseRasiSigns",
  );

  console.log(JSON.stringify({
    chart: "Natal Rasi (D-1)",
    requestMethod: useGet ? "GET" : "POST",
    ayanamsa: AYANAMSA,
    birthDetails,
    ascendant: houses.House1,
    planets,
    houses,
  }, null, 2));
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});

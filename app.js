const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const dbPath = path.join(__dirname, "covid19India.db");
const app = express();
app.use(express.json());

let db = null;

const objectSnakeToCamel = (newObject) => {
  return {
    stateId: newObject.state_id,
    stateName: newObject.state_name,
    population: newObject.population,
  };
};

const districtSnakeToCamel = (newObject) => {
  return {
    districtId: newObject.district_id,
    districtName: newObject.district_name,
    stateId: newObject.state_id,
    cases: newObject.cases,
    cured: newObject.cured,
    active: newObject.active,
    deaths: newObject.deaths,
  };
};

const reportSnakeToCamelCase = (newObject) => {
  return {
    totalCases: newObject.cases,
    totalCured: newObject.cured,
    totalActive: newObject.active,
    totalDeaths: newObject.deaths,
  };
};

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3,
      Database,
    });
    app.listen(3000, () => {
      console.log("Server is Running at https://localhost/:3000/");
    });
  } catch (e) {
    console.log(`DB Error:${e.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

app.get("/states/", async (request, response) => {
  const totalStates = `
    SELECT *
    FROM state
    ORDER BY state_id;`;
  const stateList = await db.all(totalStates);
  const stateResult = statesList.map((eachObject) => {
    return objectSnakeToCamel(eachObject);
  });
  response.send(stateResult);
});

app.get("/states/:stateId", async (request, response) => {
  const { stateId } = request.params;
  const getState = `
        SELECT *
        FROM state
        WHERE state_id = ${stateId};`;
  const newState = await db.get(getState);
  const stateResult = objectSnakeToCamel(newState);
  response.send(stateResult);
});

app.post("/districts/", async (request, response) => {
  const createDistrict = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = createDistrict;
  const newDistrict = `
    INSERT INTO
    district (district_name, state_id, cases, cured, active, deaths)
    VALUES
        ('${districtName}', ${stateId}, ${cases}, ${cured}, ${active}, ${deaths});`;
  const addDistrict = await db.run(newDistrict);
  response.send("New District Added");
});

app.get("/districts/:districtId", async (request, response) => {
  const { districtId } = request.params;
  const getDistrict = `
    SELECT * 
    FROM district
    WHERE district_id = ${districtId};`;
  const newDistrict = await db.get(getDistrict);
  const districtResult = districtSnakeToCamel(newDistrict);
  response.send(districtResult);
});

app.delete("/districts/:districtId", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrict = `
    SELECT * 
    FROM district
    WHERE district_id = ${districtId};`;
  const deleted = await db.run(deleteDistrict);
  response.send("District Deleted Successfully");
});

app.put("/districts/:districtId", async (request, response) => {
  const { districtId } = request.params;
  const districtDetails = request.body;
  const { districtName, cases, cured, active, deaths } = districtDetails;
  const updateDistrict = `
    UPDATE
        district
    SET
        district_name = '${districtName}',
        cases = ${cases},
        cured = ${cured},
        active = ${active},
        deaths = ${deaths}
    WHERE district_id = ${districtId};`;
  await db.run(updateDistrict);
  response.send("District Details Updated");
});

app.get("/states/:stateId/stats", async (request, response) => {
  const { stateId } = request.params;
  const getStateReporter = `
    SELECT SUM(cases) AS cases,
    SUM(cured) as cured,
    SUM(active) as active,
    SUM(deaths) as deaths
    FROM district
    WHERE state_id = ${stateId};
    `;
  const stateReport = await db.get(getStateReporter);
  const resultReport = reportSnakeToCamelCase(stateReport);
  response.send(resultReport);
});

app.get("/districts:/districtId/details", async (request, response) => {
  const { districtId } = request.params;
  const stateDetails = `
    SELECT state_name
    FROM state JOIN district
    ON state.state_id = district.district_id
    WHERE district.district_id = ${districtId};`;
  const stateName = await db.get(stateDetails);
  response.send({ stateName: stateName.state_name });
});

module.exports = app;

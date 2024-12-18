import express from "express";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { MongoClient, ServerApiVersion, ObjectId } from "mongodb";

dotenv.config();

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const ENTRAID_CLIENT_ID = process.env.ENTRAID_CLIENT_ID;
const ENTRAID_CLIENT_SECRET = process.env.ENTRAID_CLIENT_SECRET;

const server = express();
server.use(express.json());
server.use(cookieParser());

const uri =
  "mongodb+srv://noab004:sbKYMyxIuR6PV4zi@appdb.szx2w.mongodb.net/?retryWrites=true&w=majority&appName=AppDb";
const client = new MongoClient(uri, {
  serverApi: ServerApiVersion.v1,
});
server.get("/", (req, res) => {
  res.send("Hello, world!");
});

server.use((req, res, next) => {
  res.setTimeout(5000, () => {
    req.origin =
      (req.headers["x-forwarded-proto"] || req.protocol) +
      "://" +
      (req.headers["x-forwarded-host"] || req.headers.host);
    next();
  });
});
server.get("/api/login/entraid/start", async (req, res) => {
  const discovery_endpoint =
    "https://login.microsoftonline.com/organizations/v2.0/.well-known/openid-configuration";
  const client_id = ENTRAID_CLIENT_ID;

  const configuration = await fetch(discovery_endpoint);
  if (!configuration.ok) {
    return res.status(500).json({
      status: "error",
      message: "Failed to fetch OpenID configuration",
    });
  }
  const { authorization_endpoint } = await configuration.json();

  const parameters = {
    response_type: "code",
    scope: "openid profile email",
    client_id,
    redirect_uri: req.origin + "/api/login/entraid/callback",
    prompt: "login consent",
  };

  const authorization_url = `${authorization_endpoint}?${new URLSearchParams(parameters)}`;

  res.redirect(authorization_url);
});

server.get("/api/login/entraid/callback", async (req, res) => {
  const { error, error_description, code } = req.query;

  if (error) {
    return res.json({
      status: "error",
      error,
      error_description,
    });
  }
  if (code) {
    const discovery_endpoint =
      "https://login.microsoftonline.com/organizations/v2.0/.well-known/openid-configuration";
    const configuration = await fetch(discovery_endpoint);
    const { token_endpoint } = await configuration.json();

    const tokenResult = await fetch(token_endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: ENTRAID_CLIENT_ID,
        client_secret: ENTRAID_CLIENT_SECRET,
        code,
        redirect_uri: req.origin + "/api/login/entraid/callback",
      }),
    });
    if (tokenResult.ok) {
      const { access_token } = await tokenResult.json();

      res.cookie("access_token", access_token);
      res.cookie("discovery_endpoint", discovery_endpoint);

      return res.redirect("/registereduser");
    } else {
      return res.json({
        status: "error",
        json: await tokenResult.json(),
      });
    }
  }
});

server.post("/api/login", (req, res) => {
  const { access_token, discovery_endpoint } = req.body;
  res.cookie("access_token", access_token);
  res.cookie("discovery_endpoint", discovery_endpoint);
  res.sendStatus(201);
});
server.post("/organizer/login", (req, res) => {
  const { access_token, discovery_endpoint } = req.body;
  res.cookie("access_token", access_token);
  res.cookie("discovery_endpoint", discovery_endpoint);
  res.sendStatus(201);
});

server.get("/api/userinfo", async (req, res) => {
  const { access_token, discovery_endpoint } = req.cookies;
  if (access_token) {
    const configuration = await fetch(discovery_endpoint);
    const { userinfo_endpoint } = await configuration.json();
    if (!userinfo_endpoint) {
      console.error("Userinfo endpoint ikke funnet");
      return res.status(500);
    }
    console.log({ discovery_endpoint, userinfo_endpoint });

    const userinfoResponse = await fetch(userinfo_endpoint, {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });
    const userinfo = await userinfoResponse.json();
    console.log(userinfo);

    res.status(userinfoResponse.status).json(userinfo);
    return;
  }
  res.sendStatus(401);
});
server.get("api/login/google", async (req, res) => {
  const discovery_endpoint =
    "https://accounts.google.com/.well-known/openid-configuration";
  const config = await fetch(discovery_endpoint);
  const { authorization_endpoint } = await config.json();
  const params = {
    response_type: "code",
    scope: "openid profile email",
    client_id:
      "572159469524-k5jkjk9u93o5dnvk87m4t34s42dau5t2.apps.googleusercontent.com",
    redirect_uri: req.origin + "/api/login/google/callback",
  };
  const authorization_url = `${authorization_endpoint}?${new URLSearchParams(params)}`;
  res.redirect(authorization_url);
});
server.get("/api/login/google/callback", async (req, res) => {
  const { error, error_description, code } = req.query;
  if (error) {
    return res.json({
      status: "error",
      error,
      error_description,
    });
  }
  if (code) {
    const discovery_endpoint =
      "https://accounts.google.com/.well-known/openid-configuration";
    const config = await fetch(discovery_endpoint);
    const { token_endpoint } = await config.json();

    const tokenRes = await fetch(token_endpoint, {
      method: "POST",
      headers: {
        "Conent-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        code,
        redirect_uri:
          req.protocol +
          "://" +
          req.headers.host +
          "/api/login/google/callback",
      }),
    });
    if (tokenRes.ok) {
      const { access_token } = await tokenRes.json();
      res.cookie("access_token", access_token);
      res.cookie("discovery_endpoint", discovery_endpoint);
    } else {
      return res.json({
        status: "error",
        json: await tokenRes.json(),
      });
    }
  }
});
server.post("/api/events", async (req, res) => {
  const {
    addTitle,
    addDate,
    addCategory,
    addTime,
    addDescription,
    addLocation,
  } = req.body;
  if (!req.body) {
    return res.status(400).send({ message: "Event innhold kreves" });
  }
  if (
    !addTitle ||
    !addDate ||
    !addCategory ||
    !addDescription ||
    !addLocation ||
    !addTime
  ) {
    return res.status(400).json({ error: "Alle felt er krevd" });
  }
  try {
    await client.connect();
    console.log("Tilkoblet Mongodb");

    const db = client.db("Appdb");
    const eventCollection = db.collection("events");

    const newEvent = {
      addTitle,
      addDate,
      addCategory,
      addTime,
      addDescription,
      addLocation,
      signups: [],
    };
    const result = await eventCollection.insertOne(newEvent);
    console.log(result);
  } catch (error) {
    console.error("Feil med å legge inn event: ", error);
  } finally {
    await client.close();
  }
});
server.get("/api/events", async (req, res) => {
  try {
    await client.connect();
    console.log("Tilkoblet Mongodb");

    const db = client.db("Appdb");
    const eventCollection = db.collection("events");

    const events = await eventCollection.find().toArray();
    res.status(200).json(events);
  } catch (error) {
    console.error("Feil med å legge inn event: ", error);
  } finally {
    await client.close();
  }
});
server.put("/api/events/:id", async (req, res) => {
  const { id } = req.params;
  const updatedEvent = req.body;
  console.log("Event ID", id);
  console.log("Oppdatert info: ", updatedEvent);

  try {
    await client.connect();
    console.log("Mongodb -- redigere events ");
    if (!ObjectId.isValid(id)) {
      return res.status(400).send("Ugyldig ID format");
    }

    delete updatedEvent._id;

    const db = client.db("Appdb");
    const eventCollection = db.collection("events");
    console.log("inn i db ");
    const result = await eventCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updatedEvent },
    );
    console.log("Matched count:", result.matchedCount);
    console.log("Modified count:", result.modifiedCount);

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "Event ikke funnet" });
    }

    const updatedEventResponse = await eventCollection.findOne({
      _id: new ObjectId(id),
    });
    res.status(200).json(updatedEventResponse);
  } catch (error) {
    console.error("Kan ikke oppdatere event: ", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

server.delete("/api/events/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Ugyldig event ID" });
    }

    await client.connect();
    const db = client.db("Appdb");
    const eventCollection = db.collection("events");

    const deleteRes = await eventCollection.deleteOne({
      _id: new ObjectId(id),
    });

    if (deleteRes.deletedCount === 0) {
      return res
        .status(404)
        .json({ message: `Finner ingen event med ID ${id}` });
    }

    res.status(200).json({ message: `Event med ID ${id} har blitt slettet` });
  } catch (error) {
    console.error("Feil med å slette event: ", error);
    res.status(500).json({ message: error.message });
  } finally {
    await client.close();
  }
});

server.listen(process.env.PORT || 3000, () => {
  console.log(`Backend server running on port: ${3000}`);
});

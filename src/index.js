import express from "express";
import cors from "cors";
import fileUpload from "express-fileupload";

import config from "./config";
import { authRoutes, adminsRoutes, driversRoutes, vehiclesRoutes } from "./routes";

const app = express();

/* Middlewares */
app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);
app.use(fileUpload());
app.use(express.json());

/* Routes */
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/admins", adminsRoutes);
app.use("/api/v1/drivers", driversRoutes);
app.use("/api/v1/vehicles", vehiclesRoutes);

app.listen(config.SERVER_PORT, () => console.info("Server on port: " + config.SERVER_PORT));

import express from "express";
import cors from "cors";
import fileUpload from "express-fileupload";

import config from "./config";
import { authRoutes, adminsRoutes, driversRoutes, vehiclesRoutes, shipmentsRoutes } from "./routes";

const app = express();

/* Middlewares */
app.use(cors());
app.use(fileUpload());
app.use(express.json());

/* Routes */
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/admins", adminsRoutes);
app.use("/api/v1/drivers", driversRoutes);
app.use("/api/v1/vehicles", vehiclesRoutes);
app.use("/api/v1/shipments", shipmentsRoutes);

app.listen(config.SERVER_PORT, () => console.info("Server on port: " + config.SERVER_PORT));

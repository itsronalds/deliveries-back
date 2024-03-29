import express from "express";
import bcrypt from "bcrypt";
import moment from "moment";

import { validate, createDriverValidations, createDocumentValidations, driversByQueriesValidations } from "./validations";
import { isAuth, createDriver, createDriverDocument, getDriverIdByIdentificationCode, getDriversByQueries, getDriverData } from "./drivers";

import { uploadImage } from "../../utils/cloudinary";
import { base64Image } from "../../utils/image";

import { successResponse, errorResponse, responseCodes } from "../../responses";
import { DRIVER_DOCUMENTS } from "../../constants";

const router = express.Router();

router.post("/", isAuth, driversByQueriesValidations(), validate, async (req, res) => {
  const result = await getDriversByQueries(req.body);

  if (!result) {
    return res.status(responseCodes.HTTP_200_OK).json(errorResponse("Hubo un problema al realizar la búsqueda."));
  }

  result.drivers = result.drivers.map((driver) => ({
    ...driver,
    createdAt: moment(driver.createdAt).local().format("lll"),
  }));

  res.status(responseCodes.HTTP_200_OK).json(successResponse(result));
});

router.post("/create", isAuth, createDriverValidations(), validate, async (req, res) => {
  const { name, lastname, identificationCode, gender, dateOfBirth, email, password, document } = req.body;
  const { photo } = req.files;
  const encryptedPassword = await bcrypt.hash(password, 8);

  const imageBase64 = base64Image(photo);
  const cloudResponse = await uploadImage(imageBase64, "deliveries-system/driver-photo");

  if (!cloudResponse) {
    return res
      .status(responseCodes.HTTP_200_OK)
      .json(errorResponse("Hubo un problema en el registro del conductor, intenta de nuevo."));
  }

  const result = await createDriver({
    name,
    lastname,
    identificationCode,
    gender,
    dateOfBirth,
    email,
    password: encryptedPassword,
    photo: cloudResponse.secure_url,
    IDDriverStatus: 3,
  });

  if (!result) {
    return res
      .status(responseCodes.HTTP_200_OK)
      .json(errorResponse("Hubo un problema en el registro del conductor, intenta de nuevo."));
  }

  if (document) {
    const formatedDocument = JSON.parse(document);

    const IDDriver = result.insertId;
    const { title, expedition, expiration, type } = formatedDocument;

    const reorganizedDocument = JSON.stringify({
      title,
      name,
      lastname,
      identificationCode,
      gender,
      expedition,
      expiration,
      type,
    });

    const driverDocumentResult = await createDriverDocument({ IDDriver, title, document: reorganizedDocument });

    if (!driverDocumentResult) {
      return res
        .status(responseCodes.HTTP_200_OK)
        .json(errorResponse("Hubo un problema en el registro del documento, intenta de nuevo."));
    }
  }

  res.status(responseCodes.HTTP_200_OK).json(successResponse({ message: "Registro éxitoso." }));
});

router.post("/documents", isAuth, createDocumentValidations(), validate, async (req, res) => {
  const { title, name, lastname, identificationCode, gender, expedition, expiration, type } = req.body.document;

  const reorganizedDocument = JSON.stringify({
    title,
    name,
    lastname,
    identificationCode,
    gender,
    expedition,
    expiration,
    type,
  });
  const driverId = await getDriverIdByIdentificationCode(identificationCode);

  if (!driverId) {
    return res
      .status(responseCodes.HTTP_200_OK)
      .json(errorResponse("Hubo un problema en el registro, intenta de nuevo."));
  }

  if (!(await createDriverDocument({ IDDriver: driverId, title, Document: reorganizedDocument }))) {
    return res
      .status(responseCodes.HTTP_200_OK)
      .json(errorResponse("Hubo un problema en el registro, intenta de nuevo."));
  }

  res.status(responseCodes.HTTP_200_OK).json(successResponse({ message: "Registro éxitoso." }));
});

router.get("/data", isAuth, async (req, res) => {
  const { id } = req.user
  const result = await getDriverData(id)

  if (!result) {
    return res.status(responseCodes.HTTP_200_OK).json(errorResponse("Hubo un problema al obtener los datos del perfil. Por favor, intenta más tarde."));
  }

  result.driverDateOfBirth = moment(result.driverDateOfBirth).format("DD-MM-YYYY")

  res.status(responseCodes.HTTP_200_OK).json(successResponse(result))
})

router.get("/documents", isAuth, (req, res) => {
  res.status(responseCodes.HTTP_200_OK).json(successResponse(DRIVER_DOCUMENTS));
});

export default router;

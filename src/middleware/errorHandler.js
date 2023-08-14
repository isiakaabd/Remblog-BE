import { StatusCodes } from "http-status-codes";
const errorHandler = (err, req, res, next) => {
  let customError = {
    statusCode: err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR,
    message: err.message || "Something went wrong",
  };

  if (err.name === "validationError") {
    customError.message = Object.values(err.errors)
      .map((item) => {
        return item.message;
      })
      .join(",");
  }
  if (err.name === "CastError") {
    (customError.message = `No item found with id : ${err.value}`),
      (customError.statusCode = 404);
  }
  if (err?.code === 11000) {
    customError.message = `Duplicate value entered for ${Object.keys(
      err.keyValue
    )} field, please enter a valid value`;
    customError.statusCode = 400;
  }
  return res
    .status(customError.statusCode)
    .json({ message: customError.message });
};
export default errorHandler;

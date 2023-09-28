import { BadRequest } from "../error/bad-request.js";

async function checkRequiredParams(params, requiredParams) {
  const missingParams = requiredParams.filter((param) => !params[param]);
  console.log(missingParams);
  if (missingParams.length > 0) {
    throw new BadRequest(
      `Please provide the following parameters: ${missingParams.join(", ")}`
    );
  }
}

export { checkRequiredParams };

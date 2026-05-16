import type {
  Handler,
  HandlerResponse,
  HandlerEvent,
  HandlerContext,
} from "@netlify/functions";
import serverless from "serverless-http";

import application from "../../configs/application";

type ServerlessHandler = (event: unknown, context: unknown) => Promise<unknown>;

let cachedHandler: ServerlessHandler;

export const handler: Handler = async (
  event: HandlerEvent,
  context: HandlerContext,
): Promise<HandlerResponse> => {
  if (!cachedHandler) {
    await application.initialize();
    cachedHandler = serverless(application.app, {
      binary: ["image/*", "font/*", "application/pdf"],
    }) as ServerlessHandler;
  }

  context.callbackWaitsForEmptyEventLoop = false;

  const result = await cachedHandler(event, context);

  return result as HandlerResponse;
};

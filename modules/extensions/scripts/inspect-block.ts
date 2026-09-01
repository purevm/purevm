import { getBlockByHash, getBlockByNumber, getBlockByTag } from "../block/index.js";
import { createInspectionContext, inspectExtension, runInspectionScript } from "./inspection.js";

runInspectionScript(async () => {
  const context = await createInspectionContext();

  await inspectExtension("getBlockByHash", () =>
    getBlockByHash(context.client, context.blockHash, context.options),
  );
  await inspectExtension("getBlockByNumber", () =>
    getBlockByNumber(context.client, context.blockNumber, context.options),
  );
  await inspectExtension("getBlockByTag", () =>
    getBlockByTag(context.client, context.blockTag, context.options),
  );
});

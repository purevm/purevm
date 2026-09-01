import {
  getBlockDebugTracesByHash,
  getBlockDebugTracesByNumber,
  getBlockDebugTracesByTag,
} from "../debug/index.js";
import { createInspectionContext, inspectExtension, runInspectionScript } from "./inspection.js";

runInspectionScript(async () => {
  const context = await createInspectionContext();

  await inspectExtension("getBlockDebugTracesByHash", () =>
    getBlockDebugTracesByHash(context.client, context.blockHash, context.options),
  );
  await inspectExtension("getBlockDebugTracesByNumber", () =>
    getBlockDebugTracesByNumber(context.client, context.blockNumber, context.options),
  );
  await inspectExtension("getBlockDebugTracesByTag", () =>
    getBlockDebugTracesByTag(context.client, context.blockTag, context.options),
  );
});

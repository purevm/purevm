import {
  getBlockParityTracesByHash,
  getBlockParityTracesByNumber,
  getBlockParityTracesByTag,
} from "../parity/index.js";
import { createInspectionContext, inspectExtension, runInspectionScript } from "./inspection.js";

runInspectionScript(async () => {
  const context = await createInspectionContext();

  await inspectExtension("getBlockParityTracesByHash", () =>
    getBlockParityTracesByHash(context.client, context.blockHash, context.options),
  );
  await inspectExtension("getBlockParityTracesByNumber", () =>
    getBlockParityTracesByNumber(context.client, context.blockNumber, context.options),
  );
  await inspectExtension("getBlockParityTracesByTag", () =>
    getBlockParityTracesByTag(context.client, context.blockTag, context.options),
  );
});

import { getBlocksTraces } from "../parity/getBlocksTraces.js";
import { createInspectionContext, inspectExtension, runInspectionScript } from "./inspection.js";

runInspectionScript(async () => {
  const context = await createInspectionContext();

  await inspectExtension("getBlocksTraces", () =>
    getBlocksTraces(
      context.client,
      { fromBlock: context.blockNumber, toBlock: context.blockNumber },
      context.options,
    ),
  );
});

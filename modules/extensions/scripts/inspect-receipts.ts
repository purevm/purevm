import {
  getBlockReceiptsByHash,
  getBlockReceiptsByNumber,
  getBlockReceiptsByTag,
} from "../receipts/index.js";
import { createInspectionContext, inspectExtension, runInspectionScript } from "./inspection.js";

runInspectionScript(async () => {
  const context = await createInspectionContext();

  await inspectExtension("getBlockReceiptsByHash", () =>
    getBlockReceiptsByHash(context.client, context.blockHash, context.options),
  );
  await inspectExtension("getBlockReceiptsByNumber", () =>
    getBlockReceiptsByNumber(context.client, context.blockNumber, context.options),
  );
  await inspectExtension("getBlockReceiptsByTag", () =>
    getBlockReceiptsByTag(context.client, context.blockTag, context.options),
  );
});

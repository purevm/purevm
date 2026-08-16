import { Client } from '../src/index.js';
import { fetchFullBlock } from '../src/index.js';

(async () => {
    const client = new Client({
        name: 'Polygon',
        provider: {
            url: "https://lb.drpc.live/polygon/AkVZFJnkj0VymnaNU-vI-72N9XmqTkoR8aOItiKh6MJI",
            traceEnabled: true,
            debugEnabled: true,
        },
        debug: false,
    });

    const hexValue = `0x${Number("86789940").toString(16)}`;
    console.log(`Hex value: ${hexValue}`);
    const block = await fetchFullBlock(client, hexValue as `0x${string}`);
    console.log(block);
})();
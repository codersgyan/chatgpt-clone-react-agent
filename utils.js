import { writeFileSync } from 'node:fs';

export async function printGraph(agent, graphPath) {
    const drawableGraphGraphState = await agent.getGraph();
    const graphStateImage = await drawableGraphGraphState.drawMermaidPng();
    const graphStateArrayBuffer = await graphStateImage.arrayBuffer();

    writeFileSync(graphPath, new Uint8Array(graphStateArrayBuffer));
}

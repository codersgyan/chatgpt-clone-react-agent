import { StateGraph, MessagesAnnotation, END } from '@langchain/langgraph';
import { writeFileSync } from 'node:fs';

/**
 * Cut the vegetables
 */
function cutTheVegetables(state) {
    console.log('Cutting the vegetables....');
    return state;
}

/**
 * Boil the Rice
 */
function boilTheRice(state) {
    console.log('Boiling the Rice...');
    return state;
}

/**
 * Add the salt
 */
function addTheSalt(state) {
    console.log('Adding the salt...');
    return state;
}

/**
 * Taste the Biryani
 */

function tasteTheBiryani(state) {
    console.log('Tasting the Biryani...');
    return state;
}

/**
 * Where to go ?
 */
function whereToGo() {
    if (true) {
        return '__end__';
    } else {
        return 'addSalt';
    }
}

const graph = new StateGraph(MessagesAnnotation)
    .addNode('cutTheVegetable', cutTheVegetables)
    .addNode('boilTheRice', boilTheRice)
    .addNode('addSalt', addTheSalt)
    .addNode('tasteTheBiryani', tasteTheBiryani)
    .addEdge('__start__', 'cutTheVegetable')
    .addEdge('cutTheVegetable', 'boilTheRice')
    .addEdge('boilTheRice', 'addSalt')
    .addEdge('addSalt', 'tasteTheBiryani')
    .addConditionalEdges('tasteTheBiryani', whereToGo, {
        __end__: END,
        addSalt: 'addSalt',
    });

const biryaniProcess = graph.compile();

async function main() {
    /**
     * Graph visualization
     */
    const drawableGraphGraphState = await biryaniProcess.getGraph();
    const graphStateImage = await drawableGraphGraphState.drawMermaidPng();
    const graphStateArrayBuffer = await graphStateImage.arrayBuffer();

    const filePath = './biryaniState.png';
    writeFileSync(filePath, new Uint8Array(graphStateArrayBuffer));

    /**
     * Invoke the graph
     */
    const finalState = await biryaniProcess.invoke({
        messages: [],
    });

    console.log('final: ', finalState);
}

main();

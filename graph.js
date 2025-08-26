/**
 * 1. Bring in LLM
 * 2. Build the graph
 * 3. Invoke the agent
 * 4. Add the memory
 */
import readline from 'node:readline/promises';
import { tool } from '@langchain/core/tools';
import { ChatGroq } from '@langchain/groq';
import { END, MemorySaver, MessagesAnnotation, StateGraph } from '@langchain/langgraph';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import { TavilySearch } from '@langchain/tavily';
import z from 'zod';
import { printGraph } from './utils.js';

/**
 * Memory
 */
const checkpointer = new MemorySaver();

/** Tools */

const search = new TavilySearch({
    maxResults: 3,
    topic: 'general',
});

const calendarEvents = tool(
    async ({ query }) => {
        // Google calendar logic goes
        return JSON.stringify([
            {
                title: 'Meeting with Sujoy',
                date: '9th Aug 2025',
                time: '2 PM',
                location: 'Gmeet',
            },
        ]);
    },
    {
        name: 'get-calendar-events',
        description: 'Call to get the calendar events.',
        schema: z.object({
            query: z.string().describe('The query to use in calendar event search.'),
        }),
    }
);

const tools = [search, calendarEvents];
const toolNode = new ToolNode(tools);

/**
 * Initilise the LLM
 */
const llm = new ChatGroq({
    model: 'openai/gpt-oss-120b',
    temperature: 0,
}).bindTools(tools);

/**
 * Build the graph
 */
async function callModel(state) {
    const response = await llm.invoke(state.messages);
    return { messages: [response] };
}

/**
 * Conditional Edge
 */
function shouldContinue(state) {
    const lastMessage = state.messages[state.messages.length - 1];

    if (lastMessage.tool_calls?.length) {
        return 'tools';
    }

    return '__end__';
}

/**
 * Build the graph
 */

const graph = new StateGraph(MessagesAnnotation)
    .addNode('llm', callModel)
    .addNode('tools', toolNode)
    .addEdge('__start__', 'llm')
    .addEdge('tools', 'llm')
    .addConditionalEdges('llm', shouldContinue, {
        __end__: END,
        tools: 'tools',
    });

const app = graph.compile({ checkpointer });

async function main() {
    let config = { configurable: { thread_id: '1' } };

    /**
     * Print the graph
     */
    await printGraph(app, './customGraph.png');

    /**
     * Take user input
     */

    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

    while (true) {
        const userInput = await rl.question('You: ');

        if (userInput === '/bye') {
            break;
        }

        const result = await app.invoke(
            {
                messages: [{ role: 'user', content: userInput }],
            },
            config
        );

        const messages = result.messages;
        const final = messages[messages.length - 1];

        console.log('AI: ', final.content);
    }

    rl.close();
}

main();

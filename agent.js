import { writeFileSync } from 'node:fs';
import readline from 'node:readline/promises';
import { tool } from '@langchain/core/tools';
import { ChatGroq } from '@langchain/groq';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { TavilySearch } from '@langchain/tavily';
import { MemorySaver } from '@langchain/langgraph';
import z from 'zod';

async function main() {
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
    const model = new ChatGroq({
        model: 'openai/gpt-oss-120b',
        temperature: 0,
    }).bindTools(tools);

    const checkpointer = new MemorySaver();

    const agent = createReactAgent({
        llm: model,
        tools: [search, calendarEvents],
        checkpointer: checkpointer,
    });

    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

    const drawableGraphGraphState = await agent.getGraph();
    const graphStateImage = await drawableGraphGraphState.drawMermaidPng();
    const graphStateArrayBuffer = await graphStateImage.arrayBuffer();

    const filePath = './graphState.png';
    writeFileSync(filePath, new Uint8Array(graphStateArrayBuffer));

    while (true) {
        const userQuery = await rl.question('You: ');

        if (userQuery === '/bye') break;

        const result = await agent.invoke(
            {
                messages: [
                    {
                        role: 'system',
                        content: `You are a personal assistant. Use provided tools to get the information if you don't have it. Current date and time: ${new Date().toUTCString()}`,
                    },
                    {
                        role: 'user',
                        content: userQuery,
                    },
                ],
            },
            { configurable: { thread_id: '1' } }
        );

        console.log('result', result);
    }

    rl.close();
}

main();

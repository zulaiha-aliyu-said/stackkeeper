import { generateInsights } from './src/lib/ai-advisor';

// Minimal Tool interface based on what's needed by generateInsights
function createDummyTool(overrides: any): any {
    return {
        id: '1',
        name: 'Test Tool',
        category: 'Development',
        platform: 'Web',
        price: 0,
        purchaseDate: new Date().toISOString(),
        addedDate: new Date().toISOString(),
        timesUsed: 0,
        tags: [],
        usageHistory: [],
        currentStreak: 0,
        longestStreak: 0,
        ...overrides
    };
}

const scenarios = [
    {
        name: "Condition 1: Empty Tools",
        tools: [],
    },
    {
        name: "Condition 2: Unused Expensive Tool",
        tools: [
            createDummyTool({ name: "Ghost Subscription", price: 99.99, timesUsed: 0, lastUsed: null })
        ]
    },
    {
        name: "Condition 3: Low Usage Tool (Bought > 30 days ago, used < 3 times)",
        tools: [
            createDummyTool({ 
                name: "Forgotten App", 
                price: 29.00, 
                timesUsed: 2, 
                // Bought 40 days ago
                purchaseDate: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString()
            })
        ]
    },
    {
        name: "Condition 4: High Value / Most Used Tool",
        tools: [
            createDummyTool({ name: "VS Code Pro", timesUsed: 420, price: 10 })
        ]
    },
    {
        name: "Condition 5: Mixed Stack (Some unused, some highly used)",
        tools: [
            createDummyTool({ name: "Ghost Subscription", price: 99.99, timesUsed: 0, lastUsed: null }),
            createDummyTool({ name: "Old Service", price: 49.99, timesUsed: 0, lastUsed: null }),
            createDummyTool({ name: "Daily Driver", timesUsed: 150, price: 15 })
        ]
    },
    {
        name: "Condition 6: Perfect Stack (No unused, no low usage)",
        tools: [
            createDummyTool({ name: "Daily Driver 1", timesUsed: 150, price: 15 }),
            createDummyTool({ name: "Daily Driver 2", timesUsed: 80, price: 5 })
        ]
    }
];

console.log("=== Running AI Advisor Tests ===\n");

for (const scenario of scenarios) {
    console.log(`[TEST] ${scenario.name}`);
    const insights = generateInsights(scenario.tools);
    insights.forEach(insight => console.log(`  -> ${insight}`));
    console.log("");
}

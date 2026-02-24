import type { NodeDefinition } from "./types";

/* ================================================================== */
/*  TRIGGERS                                                          */
/* ================================================================== */

const triggerNodes: NodeDefinition[] = [
  {
    type: "chatTrigger",
    label: "Chat Trigger",
    description: "Starts workflow from user chat message",
    category: "triggers",
    icon: "MessageCircle",
    configFields: [],
  },
  {
    type: "webhook",
    label: "Webhook",
    description: "Starts workflow from HTTP webhook",
    category: "triggers",
    icon: "Webhook",
    configFields: [
      { key: "path", label: "Webhook Path", type: "text", defaultValue: "/agent/webhook" },
      {
        key: "method",
        label: "HTTP Method",
        type: "select",
        options: [
          { label: "GET", value: "GET" },
          { label: "POST", value: "POST" },
          { label: "PUT", value: "PUT" },
          { label: "DELETE", value: "DELETE" },
        ],
        defaultValue: "POST",
      },
      { key: "auth", label: "Require Authentication", type: "toggle", defaultValue: false },
    ],
  },
  {
    type: "schedule",
    label: "Schedule Trigger",
    description: "Runs workflow on a time schedule",
    category: "triggers",
    icon: "Clock3",
    configFields: [
      {
        key: "mode",
        label: "Mode",
        type: "select",
        options: [
          { label: "Cron Expression", value: "cron" },
          { label: "Every X Minutes", value: "interval" },
        ],
        defaultValue: "cron",
      },
      { key: "cron", label: "Cron Expression", type: "text", defaultValue: "*/30 * * * *" },
      { key: "interval", label: "Interval (minutes)", type: "number", defaultValue: 30 },
    ],
  },
  {
    type: "manualTrigger",
    label: "Manual Trigger",
    description: "Start workflow manually with a click",
    category: "triggers",
    icon: "Play",
    configFields: [],
  },
  {
    type: "emailTrigger",
    label: "Email Trigger",
    description: "Triggered when an email is received",
    category: "triggers",
    icon: "MailOpen",
    configFields: [
      {
        key: "protocol",
        label: "Protocol",
        type: "select",
        options: [
          { label: "IMAP", value: "imap" },
          { label: "POP3", value: "pop3" },
        ],
        defaultValue: "imap",
      },
      { key: "host", label: "Host", type: "text", defaultValue: "" },
      { key: "port", label: "Port", type: "number", defaultValue: 993 },
      { key: "username", label: "Username", type: "text", defaultValue: "" },
      { key: "mailbox", label: "Mailbox", type: "text", defaultValue: "INBOX" },
    ],
  },
  {
    type: "formTrigger",
    label: "Form Trigger",
    description: "Starts workflow from form submission",
    category: "triggers",
    icon: "ClipboardList",
    configFields: [
      { key: "formTitle", label: "Form Title", type: "text", defaultValue: "Submit" },
      { key: "formDescription", label: "Description", type: "textarea", defaultValue: "" },
      {
        key: "responseMode",
        label: "Response Mode",
        type: "select",
        options: [
          { label: "When Workflow Finishes", value: "onFinish" },
          { label: "Immediately", value: "immediate" },
        ],
        defaultValue: "onFinish",
      },
    ],
  },
  {
    type: "errorTrigger",
    label: "Error Trigger",
    description: "Triggered when another workflow errors",
    category: "triggers",
    icon: "AlertTriangle",
    configFields: [
      { key: "workflowId", label: "Workflow ID", type: "text", defaultValue: "" },
    ],
  },
  {
    type: "eventTrigger",
    label: "Event Trigger",
    description: "Triggered by custom application events",
    category: "triggers",
    icon: "Zap",
    configFields: [
      { key: "eventName", label: "Event Name", type: "text", defaultValue: "" },
    ],
  },
];

/* ================================================================== */
/*  AI / LangChain                                                    */
/* ================================================================== */

const aiNodes: NodeDefinition[] = [
  {
    type: "aiAgent",
    label: "AI Agent",
    description: "Autonomous agent with tools and memory",
    category: "ai",
    icon: "Bot",
    configFields: [
      { key: "role", label: "System Role", type: "text", defaultValue: "Business assistant" },
      { key: "prompt", label: "System Prompt", type: "textarea", defaultValue: "Answer clearly and briefly." },
      { key: "maxIterations", label: "Max Iterations", type: "number", defaultValue: 10 },
      { key: "returnIntermediateSteps", label: "Return Intermediate Steps", type: "toggle", defaultValue: false },
    ],
  },
  {
    type: "model",
    label: "Chat Model",
    description: "Configure LLM provider and model",
    category: "ai",
    icon: "Brain",
    configFields: [
      {
        key: "provider",
        label: "Provider",
        type: "select",
        options: [
          { label: "OpenAI", value: "openai" },
          { label: "Anthropic", value: "anthropic" },
          { label: "Google (Gemini)", value: "google" },
          { label: "Azure OpenAI", value: "azure" },
          { label: "Ollama (Local)", value: "ollama" },
          { label: "Groq", value: "groq" },
        ],
        defaultValue: "openai",
      },
      { key: "model", label: "Model Name", type: "text", defaultValue: "gpt-4.1-mini" },
      { key: "temperature", label: "Temperature", type: "number", defaultValue: 0.7 },
      { key: "maxTokens", label: "Max Tokens", type: "number", defaultValue: 4096 },
    ],
  },
  {
    type: "memory",
    label: "Window Memory",
    description: "Sliding window conversation memory",
    category: "ai",
    icon: "MemoryStick",
    configFields: [
      { key: "window", label: "Window Size", type: "number", defaultValue: 8 },
      { key: "returnMessages", label: "Return Messages", type: "toggle", defaultValue: true },
    ],
  },
  {
    type: "basicLlmChain",
    label: "Basic LLM Chain",
    description: "Simple prompt → model → output chain",
    category: "ai",
    icon: "Link",
    configFields: [
      { key: "prompt", label: "Prompt Template", type: "textarea", defaultValue: "Answer the following: {{input}}" },
    ],
  },
  {
    type: "conversationChain",
    label: "Conversation Chain",
    description: "Multi-turn conversation with memory",
    category: "ai",
    icon: "MessagesSquare",
    configFields: [
      { key: "systemMessage", label: "System Message", type: "textarea", defaultValue: "You are a helpful assistant." },
    ],
  },
  {
    type: "retrievalQaChain",
    label: "Retrieval QA Chain",
    description: "Answer questions from retrieved documents",
    category: "ai",
    icon: "Search",
    configFields: [
      { key: "topK", label: "Top K Documents", type: "number", defaultValue: 4 },
      {
        key: "chainType",
        label: "Chain Type",
        type: "select",
        options: [
          { label: "Stuff", value: "stuff" },
          { label: "Map Reduce", value: "map_reduce" },
          { label: "Refine", value: "refine" },
        ],
        defaultValue: "stuff",
      },
    ],
  },
  {
    type: "summarizationChain",
    label: "Summarization Chain",
    description: "Summarize long text content",
    category: "ai",
    icon: "AlignLeft",
    configFields: [
      {
        key: "chainType",
        label: "Chain Type",
        type: "select",
        options: [
          { label: "Map Reduce", value: "map_reduce" },
          { label: "Stuff", value: "stuff" },
          { label: "Refine", value: "refine" },
        ],
        defaultValue: "map_reduce",
      },
    ],
  },
  {
    type: "embeddings",
    label: "Embeddings",
    description: "Generate vector embeddings from text",
    category: "ai",
    icon: "Layers",
    configFields: [
      {
        key: "provider",
        label: "Provider",
        type: "select",
        options: [
          { label: "OpenAI", value: "openai" },
          { label: "Cohere", value: "cohere" },
          { label: "HuggingFace", value: "huggingface" },
        ],
        defaultValue: "openai",
      },
      { key: "model", label: "Model", type: "text", defaultValue: "text-embedding-3-small" },
    ],
  },
  {
    type: "vectorStore",
    label: "Vector Store",
    description: "Store and query vector embeddings",
    category: "ai",
    icon: "Boxes",
    configFields: [
      {
        key: "provider",
        label: "Store",
        type: "select",
        options: [
          { label: "Pinecone", value: "pinecone" },
          { label: "Qdrant", value: "qdrant" },
          { label: "Chroma", value: "chroma" },
          { label: "Weaviate", value: "weaviate" },
          { label: "In-Memory", value: "memory" },
        ],
        defaultValue: "memory",
      },
      {
        key: "operation",
        label: "Operation",
        type: "select",
        options: [
          { label: "Insert", value: "insert" },
          { label: "Query", value: "query" },
          { label: "Delete", value: "delete" },
        ],
        defaultValue: "query",
      },
      { key: "topK", label: "Top K", type: "number", defaultValue: 4 },
    ],
  },
  {
    type: "documentLoader",
    label: "Document Loader",
    description: "Load documents for AI processing",
    category: "ai",
    icon: "FileText",
    configFields: [
      {
        key: "source",
        label: "Source",
        type: "select",
        options: [
          { label: "PDF", value: "pdf" },
          { label: "Text File", value: "text" },
          { label: "URL", value: "url" },
          { label: "JSON", value: "json" },
          { label: "CSV", value: "csv" },
        ],
        defaultValue: "pdf",
      },
      { key: "url", label: "URL / Path", type: "text", defaultValue: "" },
    ],
  },
  {
    type: "textSplitter",
    label: "Text Splitter",
    description: "Split text into manageable chunks",
    category: "ai",
    icon: "Scissors",
    configFields: [
      {
        key: "splitter",
        label: "Splitter",
        type: "select",
        options: [
          { label: "Recursive Character", value: "recursive" },
          { label: "Token-based", value: "token" },
          { label: "Markdown", value: "markdown" },
        ],
        defaultValue: "recursive",
      },
      { key: "chunkSize", label: "Chunk Size", type: "number", defaultValue: 1000 },
      { key: "chunkOverlap", label: "Chunk Overlap", type: "number", defaultValue: 200 },
    ],
  },
  {
    type: "outputParser",
    label: "Output Parser",
    description: "Parse structured output from AI",
    category: "ai",
    icon: "ListChecks",
    configFields: [
      {
        key: "parser",
        label: "Parser Type",
        type: "select",
        options: [
          { label: "Auto-fix JSON", value: "json" },
          { label: "Structured Output", value: "structured" },
          { label: "List", value: "list" },
          { label: "Custom Regex", value: "regex" },
        ],
        defaultValue: "json",
      },
      { key: "schema", label: "Schema / Pattern", type: "textarea", defaultValue: "" },
    ],
  },
  {
    type: "textClassifier",
    label: "Text Classifier",
    description: "Classify text into categories using AI",
    category: "ai",
    icon: "Tags",
    configFields: [
      { key: "categories", label: "Categories (comma-separated)", type: "text", defaultValue: "positive,negative,neutral" },
      { key: "multiLabel", label: "Allow Multiple Labels", type: "toggle", defaultValue: false },
    ],
  },
  {
    type: "sentimentAnalysis",
    label: "Sentiment Analysis",
    description: "Analyze text sentiment and emotion",
    category: "ai",
    icon: "Smile",
    configFields: [
      { key: "detailed", label: "Detailed Analysis", type: "toggle", defaultValue: false },
    ],
  },
  {
    type: "informationExtractor",
    label: "Information Extractor",
    description: "Extract structured data from text using AI",
    category: "ai",
    icon: "ScanLine",
    configFields: [
      {
        key: "schema",
        label: "Extraction Schema (JSON)",
        type: "textarea",
        defaultValue: '{\n  "name": "string",\n  "email": "string"\n}',
      },
    ],
  },
];

/* ================================================================== */
/*  FLOW CONTROL                                                      */
/* ================================================================== */

const flowNodes: NodeDefinition[] = [
  {
    type: "ifCondition",
    label: "IF",
    description: "Branch execution by condition",
    category: "flow",
    icon: "GitBranch",
    configFields: [
      { key: "field", label: "Field", type: "text", defaultValue: "message" },
      {
        key: "operator",
        label: "Operator",
        type: "select",
        options: [
          { label: "Equals", value: "equals" },
          { label: "Not Equals", value: "not_equals" },
          { label: "Contains", value: "contains" },
          { label: "Not Contains", value: "not_contains" },
          { label: "Starts With", value: "starts_with" },
          { label: "Ends With", value: "ends_with" },
          { label: "Is Empty", value: "is_empty" },
          { label: "Is Not Empty", value: "is_not_empty" },
          { label: "Greater Than", value: "greater_than" },
          { label: "Less Than", value: "less_than" },
          { label: "Regex Match", value: "regex" },
        ],
        defaultValue: "contains",
      },
      { key: "value", label: "Value", type: "text", defaultValue: "" },
    ],
  },
  {
    type: "switch",
    label: "Switch",
    description: "Route to different outputs by rules",
    category: "flow",
    icon: "Split",
    configFields: [
      { key: "key", label: "Switch Key", type: "text", defaultValue: "intent" },
      { key: "fallbackOutput", label: "Fallback Output", type: "text", defaultValue: "default" },
    ],
  },
  {
    type: "merge",
    label: "Merge",
    description: "Combine multiple input branches",
    category: "flow",
    icon: "Combine",
    configFields: [
      {
        key: "mode",
        label: "Mode",
        type: "select",
        options: [
          { label: "Append", value: "append" },
          { label: "Keep Key Matches", value: "keepKeyMatches" },
          { label: "Multiplex", value: "multiplex" },
          { label: "Choose Branch", value: "chooseBranch" },
        ],
        defaultValue: "append",
      },
    ],
  },
  {
    type: "loopOverItems",
    label: "Loop Over Items",
    description: "Iterate over each item in a list",
    category: "flow",
    icon: "Repeat",
    configFields: [
      { key: "batchSize", label: "Batch Size", type: "number", defaultValue: 1 },
    ],
  },
  {
    type: "splitInBatches",
    label: "Split In Batches",
    description: "Process items in fixed-size batches",
    category: "flow",
    icon: "LayoutGrid",
    configFields: [
      { key: "batchSize", label: "Batch Size", type: "number", defaultValue: 10 },
    ],
  },
  {
    type: "wait",
    label: "Wait",
    description: "Pause execution for a duration or event",
    category: "flow",
    icon: "Timer",
    configFields: [
      { key: "amount", label: "Amount", type: "number", defaultValue: 5 },
      {
        key: "unit",
        label: "Unit",
        type: "select",
        options: [
          { label: "Seconds", value: "seconds" },
          { label: "Minutes", value: "minutes" },
          { label: "Hours", value: "hours" },
        ],
        defaultValue: "seconds",
      },
    ],
  },
  {
    type: "noOp",
    label: "No Operation",
    description: "Pass data through without changes",
    category: "flow",
    icon: "CircleDot",
    configFields: [],
  },
  {
    type: "stopAndError",
    label: "Stop and Error",
    description: "Stop workflow and throw an error",
    category: "flow",
    icon: "XCircle",
    configFields: [
      {
        key: "errorType",
        label: "Error Type",
        type: "select",
        options: [
          { label: "Custom Message", value: "message" },
          { label: "Error Object", value: "object" },
        ],
        defaultValue: "message",
      },
      { key: "message", label: "Error Message", type: "text", defaultValue: "Workflow stopped" },
    ],
  },
  {
    type: "executeWorkflow",
    label: "Execute Workflow",
    description: "Run another workflow as sub-workflow",
    category: "flow",
    icon: "Workflow",
    configFields: [
      { key: "workflowId", label: "Workflow ID", type: "text", defaultValue: "" },
      { key: "waitForCompletion", label: "Wait for Completion", type: "toggle", defaultValue: true },
    ],
  },
  {
    type: "filter",
    label: "Filter",
    description: "Filter items by condition",
    category: "flow",
    icon: "Filter",
    configFields: [
      { key: "field", label: "Field", type: "text", defaultValue: "" },
      {
        key: "operator",
        label: "Operator",
        type: "select",
        options: [
          { label: "Equals", value: "equals" },
          { label: "Not Equals", value: "not_equals" },
          { label: "Contains", value: "contains" },
          { label: "Greater Than", value: "greater_than" },
          { label: "Less Than", value: "less_than" },
          { label: "Is Set", value: "is_set" },
          { label: "Is Not Set", value: "is_not_set" },
        ],
        defaultValue: "equals",
      },
      { key: "value", label: "Value", type: "text", defaultValue: "" },
    ],
  },
  {
    type: "limit",
    label: "Limit",
    description: "Limit the number of output items",
    category: "flow",
    icon: "Gauge",
    configFields: [
      { key: "maxItems", label: "Max Items", type: "number", defaultValue: 10 },
      { key: "keepFirst", label: "Keep First Items", type: "toggle", defaultValue: true },
    ],
  },
  {
    type: "sort",
    label: "Sort",
    description: "Sort items by field value",
    category: "flow",
    icon: "ArrowUpDown",
    configFields: [
      { key: "field", label: "Sort Field", type: "text", defaultValue: "" },
      {
        key: "order",
        label: "Order",
        type: "select",
        options: [
          { label: "Ascending", value: "asc" },
          { label: "Descending", value: "desc" },
        ],
        defaultValue: "asc",
      },
    ],
  },
  {
    type: "removeDuplicates",
    label: "Remove Duplicates",
    description: "Remove duplicate items by field",
    category: "flow",
    icon: "Copy",
    configFields: [
      { key: "field", label: "Compare Field", type: "text", defaultValue: "id" },
    ],
  },
  {
    type: "aggregate",
    label: "Aggregate",
    description: "Aggregate items into summary values",
    category: "flow",
    icon: "PieChart",
    configFields: [
      {
        key: "operation",
        label: "Operation",
        type: "select",
        options: [
          { label: "Count", value: "count" },
          { label: "Sum", value: "sum" },
          { label: "Average", value: "average" },
          { label: "Min", value: "min" },
          { label: "Max", value: "max" },
          { label: "Concatenate", value: "concat" },
        ],
        defaultValue: "count",
      },
      { key: "field", label: "Field", type: "text", defaultValue: "" },
    ],
  },
];

/* ================================================================== */
/*  DATA TRANSFORMATION                                               */
/* ================================================================== */

const dataNodes: NodeDefinition[] = [
  {
    type: "setVariable",
    label: "Set Variable",
    description: "Store a value in workflow context",
    category: "data",
    icon: "Database",
    configFields: [
      { key: "name", label: "Variable Name", type: "text", defaultValue: "" },
      { key: "value", label: "Value", type: "text", defaultValue: "" },
    ],
  },
  {
    type: "jsonParse",
    label: "JSON Parse",
    description: "Parse or stringify JSON data",
    category: "data",
    icon: "Braces",
    configFields: [
      {
        key: "operation",
        label: "Operation",
        type: "select",
        options: [
          { label: "Parse JSON String", value: "parse" },
          { label: "Stringify to JSON", value: "stringify" },
        ],
        defaultValue: "parse",
      },
      { key: "path", label: "JSON Path", type: "text", defaultValue: "$.data" },
    ],
  },
  {
    type: "editFields",
    label: "Edit Fields",
    description: "Add, remove, or rename data fields",
    category: "data",
    icon: "Pencil",
    configFields: [
      {
        key: "mode",
        label: "Mode",
        type: "select",
        options: [
          { label: "Set Fields", value: "set" },
          { label: "Remove Fields", value: "remove" },
          { label: "Rename Fields", value: "rename" },
        ],
        defaultValue: "set",
      },
      { key: "fields", label: "Fields (JSON)", type: "textarea", defaultValue: "{}" },
    ],
  },
  {
    type: "xmlParse",
    label: "XML",
    description: "Parse XML or convert JSON to XML",
    category: "data",
    icon: "FileCode",
    configFields: [
      {
        key: "operation",
        label: "Operation",
        type: "select",
        options: [
          { label: "XML to JSON", value: "toJson" },
          { label: "JSON to XML", value: "toXml" },
        ],
        defaultValue: "toJson",
      },
    ],
  },
  {
    type: "htmlExtract",
    label: "HTML Extract",
    description: "Extract data from HTML using CSS selectors",
    category: "data",
    icon: "FileType",
    configFields: [
      { key: "selector", label: "CSS Selector", type: "text", defaultValue: "h1" },
      { key: "attribute", label: "Attribute", type: "text", defaultValue: "text" },
    ],
  },
  {
    type: "markdown",
    label: "Markdown",
    description: "Convert between Markdown and HTML",
    category: "data",
    icon: "Type",
    configFields: [
      {
        key: "operation",
        label: "Operation",
        type: "select",
        options: [
          { label: "Markdown to HTML", value: "toHtml" },
          { label: "HTML to Markdown", value: "toMarkdown" },
        ],
        defaultValue: "toHtml",
      },
    ],
  },
  {
    type: "csvParse",
    label: "CSV / Spreadsheet",
    description: "Read or write CSV and spreadsheet data",
    category: "data",
    icon: "Table2",
    configFields: [
      {
        key: "operation",
        label: "Operation",
        type: "select",
        options: [
          { label: "CSV to JSON", value: "csvToJson" },
          { label: "JSON to CSV", value: "jsonToCsv" },
          { label: "Read Spreadsheet", value: "readSheet" },
        ],
        defaultValue: "csvToJson",
      },
      { key: "delimiter", label: "Delimiter", type: "text", defaultValue: "," },
      { key: "header", label: "Has Header Row", type: "toggle", defaultValue: true },
    ],
  },
  {
    type: "crypto",
    label: "Crypto",
    description: "Hash, encrypt, or decode data",
    category: "data",
    icon: "Lock",
    configFields: [
      {
        key: "operation",
        label: "Operation",
        type: "select",
        options: [
          { label: "Hash (SHA-256)", value: "sha256" },
          { label: "Hash (MD5)", value: "md5" },
          { label: "HMAC", value: "hmac" },
          { label: "Encrypt (AES)", value: "encrypt" },
          { label: "Decrypt (AES)", value: "decrypt" },
          { label: "Base64 Encode", value: "base64Encode" },
          { label: "Base64 Decode", value: "base64Decode" },
        ],
        defaultValue: "sha256",
      },
      { key: "secret", label: "Secret / Key", type: "text", defaultValue: "" },
    ],
  },
  {
    type: "dateTime",
    label: "Date & Time",
    description: "Format, calculate, or extract date values",
    category: "data",
    icon: "CalendarDays",
    configFields: [
      {
        key: "operation",
        label: "Operation",
        type: "select",
        options: [
          { label: "Format Date", value: "format" },
          { label: "Add/Subtract", value: "add" },
          { label: "Difference", value: "diff" },
          { label: "Now", value: "now" },
        ],
        defaultValue: "format",
      },
      { key: "format", label: "Format", type: "text", defaultValue: "YYYY-MM-DD" },
      { key: "timezone", label: "Timezone", type: "text", defaultValue: "UTC" },
    ],
  },
  {
    type: "compareDatasets",
    label: "Compare Datasets",
    description: "Compare two datasets and find differences",
    category: "data",
    icon: "GitCompare",
    configFields: [
      { key: "mergeKey", label: "Merge Key", type: "text", defaultValue: "id" },
      {
        key: "mode",
        label: "Output",
        type: "select",
        options: [
          { label: "Items in A Only", value: "aOnly" },
          { label: "Items in B Only", value: "bOnly" },
          { label: "Items in Both", value: "both" },
          { label: "All Differences", value: "diff" },
        ],
        defaultValue: "diff",
      },
    ],
  },
  {
    type: "renameKeys",
    label: "Rename Keys",
    description: "Rename object keys and properties",
    category: "data",
    icon: "PenLine",
    configFields: [
      {
        key: "mappings",
        label: "Key Mappings (JSON)",
        type: "textarea",
        defaultValue: '{\n  "old_key": "newKey"\n}',
      },
    ],
  },
  {
    type: "convertToFile",
    label: "Convert to File",
    description: "Convert data to downloadable file",
    category: "data",
    icon: "FileDown",
    configFields: [
      {
        key: "format",
        label: "Format",
        type: "select",
        options: [
          { label: "JSON", value: "json" },
          { label: "CSV", value: "csv" },
          { label: "XML", value: "xml" },
          { label: "Text", value: "text" },
        ],
        defaultValue: "json",
      },
      { key: "fileName", label: "File Name", type: "text", defaultValue: "output" },
    ],
  },
];

/* ================================================================== */
/*  DEVELOPER TOOLS                                                   */
/* ================================================================== */

const toolsNodes: NodeDefinition[] = [
  {
    type: "httpRequest",
    label: "HTTP Request",
    description: "Make HTTP requests to any REST API",
    category: "tools",
    icon: "Globe",
    configFields: [
      { key: "url", label: "URL", type: "text", defaultValue: "https://api.example.com" },
      {
        key: "method",
        label: "Method",
        type: "select",
        options: [
          { label: "GET", value: "GET" },
          { label: "POST", value: "POST" },
          { label: "PUT", value: "PUT" },
          { label: "PATCH", value: "PATCH" },
          { label: "DELETE", value: "DELETE" },
          { label: "HEAD", value: "HEAD" },
        ],
        defaultValue: "GET",
      },
      { key: "headers", label: "Headers (JSON)", type: "textarea", defaultValue: "{}" },
      { key: "body", label: "Request Body", type: "textarea", defaultValue: "" },
      {
        key: "auth",
        label: "Auth Type",
        type: "select",
        options: [
          { label: "None", value: "none" },
          { label: "Bearer Token", value: "bearer" },
          { label: "Basic Auth", value: "basic" },
          { label: "API Key", value: "apiKey" },
        ],
        defaultValue: "none",
      },
      { key: "timeout", label: "Timeout (ms)", type: "number", defaultValue: 30000 },
    ],
  },
  {
    type: "codeExecutor",
    label: "Code",
    description: "Run custom JavaScript or Python code",
    category: "tools",
    icon: "Code2",
    configFields: [
      {
        key: "language",
        label: "Language",
        type: "select",
        options: [
          { label: "JavaScript", value: "javascript" },
          { label: "Python", value: "python" },
        ],
        defaultValue: "javascript",
      },
      { key: "code", label: "Code", type: "textarea", defaultValue: "// Process items\nreturn items;" },
    ],
  },
  {
    type: "graphql",
    label: "GraphQL",
    description: "Execute GraphQL queries and mutations",
    category: "tools",
    icon: "Share2",
    configFields: [
      { key: "endpoint", label: "Endpoint", type: "text", defaultValue: "" },
      { key: "query", label: "Query", type: "textarea", defaultValue: "query {\n  \n}" },
      { key: "variables", label: "Variables (JSON)", type: "textarea", defaultValue: "{}" },
    ],
  },
  {
    type: "ssh",
    label: "SSH",
    description: "Execute commands on remote server",
    category: "tools",
    icon: "Terminal",
    configFields: [
      { key: "host", label: "Host", type: "text", defaultValue: "" },
      { key: "port", label: "Port", type: "number", defaultValue: 22 },
      { key: "username", label: "Username", type: "text", defaultValue: "" },
      { key: "command", label: "Command", type: "textarea", defaultValue: "" },
    ],
  },
  {
    type: "ftp",
    label: "FTP / SFTP",
    description: "Transfer files via FTP or SFTP",
    category: "tools",
    icon: "HardDrive",
    configFields: [
      {
        key: "operation",
        label: "Operation",
        type: "select",
        options: [
          { label: "Upload", value: "upload" },
          { label: "Download", value: "download" },
          { label: "List", value: "list" },
          { label: "Delete", value: "delete" },
        ],
        defaultValue: "download",
      },
      { key: "host", label: "Host", type: "text", defaultValue: "" },
      { key: "path", label: "Remote Path", type: "text", defaultValue: "/" },
    ],
  },
  {
    type: "executeCommand",
    label: "Execute Command",
    description: "Run system shell commands",
    category: "tools",
    icon: "SquareTerminal",
    configFields: [
      { key: "command", label: "Command", type: "textarea", defaultValue: "" },
      { key: "workingDir", label: "Working Directory", type: "text", defaultValue: "" },
    ],
  },
  {
    type: "git",
    label: "Git",
    description: "Git repository operations",
    category: "tools",
    icon: "GitFork",
    configFields: [
      {
        key: "operation",
        label: "Operation",
        type: "select",
        options: [
          { label: "Clone", value: "clone" },
          { label: "Pull", value: "pull" },
          { label: "Push", value: "push" },
          { label: "Commit", value: "commit" },
          { label: "Log", value: "log" },
        ],
        defaultValue: "clone",
      },
      { key: "repoUrl", label: "Repository URL", type: "text", defaultValue: "" },
    ],
  },
  {
    type: "rssFeed",
    label: "RSS Feed",
    description: "Read and parse RSS/Atom feeds",
    category: "tools",
    icon: "Rss",
    configFields: [
      { key: "url", label: "Feed URL", type: "text", defaultValue: "" },
      { key: "maxItems", label: "Max Items", type: "number", defaultValue: 20 },
    ],
  },
];

/* ================================================================== */
/*  ACTIONS / OUTPUT                                                  */
/* ================================================================== */

const actionNodes: NodeDefinition[] = [
  {
    type: "sendMessage",
    label: "Send Message",
    description: "Return message to user or channel",
    category: "actions",
    icon: "Send",
    configFields: [
      { key: "message", label: "Message", type: "textarea", defaultValue: "" },
    ],
  },
  {
    type: "sendEmail",
    label: "Send Email",
    description: "Send email via SMTP provider",
    category: "actions",
    icon: "Mail",
    configFields: [
      { key: "to", label: "To", type: "text", defaultValue: "" },
      { key: "cc", label: "CC", type: "text", defaultValue: "" },
      { key: "subject", label: "Subject", type: "text", defaultValue: "" },
      { key: "body", label: "Body", type: "textarea", defaultValue: "" },
      { key: "html", label: "Send as HTML", type: "toggle", defaultValue: false },
    ],
  },
  {
    type: "respondToWebhook",
    label: "Respond to Webhook",
    description: "Send response back to webhook caller",
    category: "actions",
    icon: "ArrowLeftRight",
    configFields: [
      { key: "statusCode", label: "Status Code", type: "number", defaultValue: 200 },
      { key: "body", label: "Response Body", type: "textarea", defaultValue: '{ "success": true }' },
      { key: "headers", label: "Response Headers (JSON)", type: "textarea", defaultValue: "{}" },
    ],
  },
  {
    type: "pushNotification",
    label: "Push Notification",
    description: "Send push notification to devices",
    category: "actions",
    icon: "Bell",
    configFields: [
      { key: "title", label: "Title", type: "text", defaultValue: "" },
      { key: "body", label: "Body", type: "textarea", defaultValue: "" },
      { key: "url", label: "Click URL", type: "text", defaultValue: "" },
    ],
  },
  {
    type: "setOutput",
    label: "Set Output",
    description: "Set the final workflow output value",
    category: "actions",
    icon: "CircleCheck",
    configFields: [
      { key: "output", label: "Output Value", type: "textarea", defaultValue: "" },
    ],
  },
];

/* ================================================================== */
/*  COMMUNICATION / MESSAGING                                         */
/* ================================================================== */

const communicationNodes: NodeDefinition[] = [
  {
    type: "slack",
    label: "Slack",
    description: "Send messages and manage Slack channels",
    category: "communication",
    icon: "Hash",
    configFields: [
      {
        key: "operation",
        label: "Operation",
        type: "select",
        options: [
          { label: "Send Message", value: "sendMessage" },
          { label: "Update Message", value: "updateMessage" },
          { label: "Get Channel", value: "getChannel" },
          { label: "Upload File", value: "uploadFile" },
          { label: "Get User Info", value: "getUser" },
        ],
        defaultValue: "sendMessage",
      },
      { key: "channel", label: "Channel", type: "text", defaultValue: "" },
      { key: "message", label: "Message", type: "textarea", defaultValue: "" },
    ],
  },
  {
    type: "discord",
    label: "Discord",
    description: "Send messages to Discord channels",
    category: "communication",
    icon: "Radio",
    configFields: [
      {
        key: "operation",
        label: "Operation",
        type: "select",
        options: [
          { label: "Send Message", value: "sendMessage" },
          { label: "Send Embed", value: "sendEmbed" },
          { label: "Get Members", value: "getMembers" },
        ],
        defaultValue: "sendMessage",
      },
      { key: "webhookUrl", label: "Webhook URL", type: "text", defaultValue: "" },
      { key: "message", label: "Message", type: "textarea", defaultValue: "" },
    ],
  },
  {
    type: "telegram",
    label: "Telegram",
    description: "Send messages via Telegram Bot API",
    category: "communication",
    icon: "Navigation",
    configFields: [
      {
        key: "operation",
        label: "Operation",
        type: "select",
        options: [
          { label: "Send Message", value: "sendMessage" },
          { label: "Send Photo", value: "sendPhoto" },
          { label: "Send Document", value: "sendDocument" },
          { label: "Edit Message", value: "editMessage" },
          { label: "Get Updates", value: "getUpdates" },
        ],
        defaultValue: "sendMessage",
      },
      { key: "chatId", label: "Chat ID", type: "text", defaultValue: "" },
      { key: "text", label: "Text", type: "textarea", defaultValue: "" },
    ],
  },
  {
    type: "whatsapp",
    label: "WhatsApp",
    description: "Send messages via WhatsApp Business API",
    category: "communication",
    icon: "Phone",
    configFields: [
      {
        key: "operation",
        label: "Operation",
        type: "select",
        options: [
          { label: "Send Text", value: "sendText" },
          { label: "Send Template", value: "sendTemplate" },
          { label: "Send Media", value: "sendMedia" },
          { label: "Send Location", value: "sendLocation" },
        ],
        defaultValue: "sendText",
      },
      { key: "phoneNumber", label: "Phone Number", type: "text", defaultValue: "" },
      { key: "message", label: "Message", type: "textarea", defaultValue: "" },
    ],
  },
  {
    type: "microsoftTeams",
    label: "Microsoft Teams",
    description: "Send messages to Teams channels",
    category: "communication",
    icon: "Users",
    configFields: [
      {
        key: "operation",
        label: "Operation",
        type: "select",
        options: [
          { label: "Send Message", value: "sendMessage" },
          { label: "Send Adaptive Card", value: "sendCard" },
          { label: "Get Channels", value: "getChannels" },
        ],
        defaultValue: "sendMessage",
      },
      { key: "teamId", label: "Team ID", type: "text", defaultValue: "" },
      { key: "channelId", label: "Channel ID", type: "text", defaultValue: "" },
      { key: "message", label: "Message", type: "textarea", defaultValue: "" },
    ],
  },
  {
    type: "twilio",
    label: "Twilio",
    description: "Send SMS and make calls via Twilio",
    category: "communication",
    icon: "Smartphone",
    configFields: [
      {
        key: "operation",
        label: "Operation",
        type: "select",
        options: [
          { label: "Send SMS", value: "sendSms" },
          { label: "Make Call", value: "makeCall" },
          { label: "Send WhatsApp", value: "sendWhatsapp" },
        ],
        defaultValue: "sendSms",
      },
      { key: "from", label: "From Number", type: "text", defaultValue: "" },
      { key: "to", label: "To Number", type: "text", defaultValue: "" },
      { key: "body", label: "Body", type: "textarea", defaultValue: "" },
    ],
  },
  {
    type: "matrix",
    label: "Matrix",
    description: "Send messages to Matrix chat rooms",
    category: "communication",
    icon: "MessageSquare",
    configFields: [
      {
        key: "operation",
        label: "Operation",
        type: "select",
        options: [
          { label: "Send Message", value: "sendMessage" },
          { label: "Get Room Members", value: "getMembers" },
          { label: "Create Room", value: "createRoom" },
        ],
        defaultValue: "sendMessage",
      },
      { key: "roomId", label: "Room ID", type: "text", defaultValue: "" },
      { key: "message", label: "Message", type: "textarea", defaultValue: "" },
    ],
  },
];

/* ================================================================== */
/*  INTEGRATIONS (Third-party Services)                               */
/* ================================================================== */

const integrationNodes: NodeDefinition[] = [
  {
    type: "googleSheets",
    label: "Google Sheets",
    description: "Read and write Google Sheets data",
    category: "integration",
    icon: "Table",
    configFields: [
      {
        key: "operation",
        label: "Operation",
        type: "select",
        options: [
          { label: "Read Rows", value: "readRows" },
          { label: "Append Row", value: "appendRow" },
          { label: "Update Row", value: "updateRow" },
          { label: "Delete Row", value: "deleteRow" },
          { label: "Clear Sheet", value: "clearSheet" },
        ],
        defaultValue: "readRows",
      },
      { key: "spreadsheetId", label: "Spreadsheet ID", type: "text", defaultValue: "" },
      { key: "sheetName", label: "Sheet Name", type: "text", defaultValue: "Sheet1" },
      { key: "range", label: "Range", type: "text", defaultValue: "A1:Z1000" },
    ],
  },
  {
    type: "googleDrive",
    label: "Google Drive",
    description: "Manage files and folders in Google Drive",
    category: "integration",
    icon: "Cloud",
    configFields: [
      {
        key: "operation",
        label: "Operation",
        type: "select",
        options: [
          { label: "Upload File", value: "upload" },
          { label: "Download File", value: "download" },
          { label: "List Files", value: "list" },
          { label: "Create Folder", value: "createFolder" },
          { label: "Delete File", value: "delete" },
          { label: "Share File", value: "share" },
        ],
        defaultValue: "list",
      },
      { key: "fileId", label: "File ID", type: "text", defaultValue: "" },
      { key: "folderId", label: "Folder ID", type: "text", defaultValue: "" },
    ],
  },
  {
    type: "googleCalendar",
    label: "Google Calendar",
    description: "Manage Google Calendar events",
    category: "integration",
    icon: "CalendarDays",
    configFields: [
      {
        key: "operation",
        label: "Operation",
        type: "select",
        options: [
          { label: "Create Event", value: "create" },
          { label: "Get Events", value: "list" },
          { label: "Update Event", value: "update" },
          { label: "Delete Event", value: "delete" },
        ],
        defaultValue: "list",
      },
      { key: "calendarId", label: "Calendar ID", type: "text", defaultValue: "primary" },
      { key: "summary", label: "Event Title", type: "text", defaultValue: "" },
    ],
  },
  {
    type: "notion",
    label: "Notion",
    description: "Read and write Notion pages and databases",
    category: "integration",
    icon: "BookOpen",
    configFields: [
      {
        key: "resource",
        label: "Resource",
        type: "select",
        options: [
          { label: "Page", value: "page" },
          { label: "Database", value: "database" },
          { label: "Block", value: "block" },
        ],
        defaultValue: "page",
      },
      {
        key: "operation",
        label: "Operation",
        type: "select",
        options: [
          { label: "Get", value: "get" },
          { label: "Create", value: "create" },
          { label: "Update", value: "update" },
          { label: "Search", value: "search" },
        ],
        defaultValue: "get",
      },
      { key: "id", label: "Page / Database ID", type: "text", defaultValue: "" },
    ],
  },
  {
    type: "airtable",
    label: "Airtable",
    description: "Read and write Airtable records",
    category: "integration",
    icon: "Grid3x3",
    configFields: [
      {
        key: "operation",
        label: "Operation",
        type: "select",
        options: [
          { label: "List Records", value: "list" },
          { label: "Get Record", value: "get" },
          { label: "Create Record", value: "create" },
          { label: "Update Record", value: "update" },
          { label: "Delete Record", value: "delete" },
        ],
        defaultValue: "list",
      },
      { key: "baseId", label: "Base ID", type: "text", defaultValue: "" },
      { key: "tableId", label: "Table ID", type: "text", defaultValue: "" },
    ],
  },
  {
    type: "hubspot",
    label: "HubSpot",
    description: "Manage HubSpot CRM contacts and deals",
    category: "integration",
    icon: "Contact2",
    configFields: [
      {
        key: "resource",
        label: "Resource",
        type: "select",
        options: [
          { label: "Contact", value: "contact" },
          { label: "Deal", value: "deal" },
          { label: "Company", value: "company" },
          { label: "Ticket", value: "ticket" },
        ],
        defaultValue: "contact",
      },
      {
        key: "operation",
        label: "Operation",
        type: "select",
        options: [
          { label: "Get", value: "get" },
          { label: "Create", value: "create" },
          { label: "Update", value: "update" },
          { label: "Search", value: "search" },
          { label: "Delete", value: "delete" },
        ],
        defaultValue: "get",
      },
      { key: "id", label: "Record ID", type: "text", defaultValue: "" },
    ],
  },
  {
    type: "jira",
    label: "Jira",
    description: "Manage Jira issues and projects",
    category: "integration",
    icon: "Bug",
    configFields: [
      {
        key: "operation",
        label: "Operation",
        type: "select",
        options: [
          { label: "Create Issue", value: "createIssue" },
          { label: "Get Issue", value: "getIssue" },
          { label: "Update Issue", value: "updateIssue" },
          { label: "Search Issues (JQL)", value: "search" },
          { label: "Add Comment", value: "addComment" },
          { label: "Transition Issue", value: "transition" },
        ],
        defaultValue: "getIssue",
      },
      { key: "projectKey", label: "Project Key", type: "text", defaultValue: "" },
      { key: "issueKey", label: "Issue Key", type: "text", defaultValue: "" },
    ],
  },
  {
    type: "github",
    label: "GitHub",
    description: "Manage GitHub repos, issues, and PRs",
    category: "integration",
    icon: "GitPullRequest",
    configFields: [
      {
        key: "resource",
        label: "Resource",
        type: "select",
        options: [
          { label: "Repository", value: "repo" },
          { label: "Issue", value: "issue" },
          { label: "Pull Request", value: "pr" },
          { label: "Release", value: "release" },
          { label: "File", value: "file" },
        ],
        defaultValue: "repo",
      },
      {
        key: "operation",
        label: "Operation",
        type: "select",
        options: [
          { label: "Get", value: "get" },
          { label: "Create", value: "create" },
          { label: "Update", value: "update" },
          { label: "List", value: "list" },
        ],
        defaultValue: "get",
      },
      { key: "owner", label: "Owner", type: "text", defaultValue: "" },
      { key: "repo", label: "Repository", type: "text", defaultValue: "" },
    ],
  },
  {
    type: "trello",
    label: "Trello",
    description: "Manage Trello boards, lists, and cards",
    category: "integration",
    icon: "Columns3",
    configFields: [
      {
        key: "resource",
        label: "Resource",
        type: "select",
        options: [
          { label: "Board", value: "board" },
          { label: "List", value: "list" },
          { label: "Card", value: "card" },
        ],
        defaultValue: "card",
      },
      {
        key: "operation",
        label: "Operation",
        type: "select",
        options: [
          { label: "Get", value: "get" },
          { label: "Create", value: "create" },
          { label: "Update", value: "update" },
          { label: "Delete", value: "delete" },
        ],
        defaultValue: "create",
      },
      { key: "boardId", label: "Board ID", type: "text", defaultValue: "" },
    ],
  },
  {
    type: "asana",
    label: "Asana",
    description: "Manage Asana tasks and projects",
    category: "integration",
    icon: "CheckSquare",
    configFields: [
      {
        key: "resource",
        label: "Resource",
        type: "select",
        options: [
          { label: "Task", value: "task" },
          { label: "Project", value: "project" },
          { label: "Section", value: "section" },
        ],
        defaultValue: "task",
      },
      {
        key: "operation",
        label: "Operation",
        type: "select",
        options: [
          { label: "Get", value: "get" },
          { label: "Create", value: "create" },
          { label: "Update", value: "update" },
          { label: "Search", value: "search" },
        ],
        defaultValue: "create",
      },
      { key: "projectId", label: "Project ID", type: "text", defaultValue: "" },
    ],
  },
  {
    type: "linear",
    label: "Linear",
    description: "Manage Linear issues and projects",
    category: "integration",
    icon: "Triangle",
    configFields: [
      {
        key: "resource",
        label: "Resource",
        type: "select",
        options: [
          { label: "Issue", value: "issue" },
          { label: "Project", value: "project" },
          { label: "Team", value: "team" },
        ],
        defaultValue: "issue",
      },
      {
        key: "operation",
        label: "Operation",
        type: "select",
        options: [
          { label: "Get", value: "get" },
          { label: "Create", value: "create" },
          { label: "Update", value: "update" },
          { label: "List", value: "list" },
        ],
        defaultValue: "create",
      },
      { key: "teamId", label: "Team ID", type: "text", defaultValue: "" },
    ],
  },
  {
    type: "salesforce",
    label: "Salesforce",
    description: "Manage Salesforce CRM records",
    category: "integration",
    icon: "Building2",
    configFields: [
      {
        key: "resource",
        label: "Resource",
        type: "select",
        options: [
          { label: "Lead", value: "lead" },
          { label: "Contact", value: "contact" },
          { label: "Account", value: "account" },
          { label: "Opportunity", value: "opportunity" },
          { label: "Case", value: "case" },
        ],
        defaultValue: "lead",
      },
      {
        key: "operation",
        label: "Operation",
        type: "select",
        options: [
          { label: "Get", value: "get" },
          { label: "Create", value: "create" },
          { label: "Update", value: "update" },
          { label: "Search (SOQL)", value: "search" },
          { label: "Delete", value: "delete" },
        ],
        defaultValue: "get",
      },
      { key: "id", label: "Record ID", type: "text", defaultValue: "" },
    ],
  },
  {
    type: "mailchimp",
    label: "Mailchimp",
    description: "Manage Mailchimp audiences and campaigns",
    category: "integration",
    icon: "Sparkles",
    configFields: [
      {
        key: "resource",
        label: "Resource",
        type: "select",
        options: [
          { label: "Member", value: "member" },
          { label: "Campaign", value: "campaign" },
          { label: "List / Audience", value: "list" },
          { label: "Tag", value: "tag" },
        ],
        defaultValue: "member",
      },
      {
        key: "operation",
        label: "Operation",
        type: "select",
        options: [
          { label: "Get", value: "get" },
          { label: "Create / Add", value: "create" },
          { label: "Update", value: "update" },
          { label: "Delete / Remove", value: "delete" },
        ],
        defaultValue: "create",
      },
      { key: "listId", label: "List / Audience ID", type: "text", defaultValue: "" },
    ],
  },
  {
    type: "sendgrid",
    label: "SendGrid",
    description: "Send transactional emails via SendGrid",
    category: "integration",
    icon: "MailPlus",
    configFields: [
      {
        key: "operation",
        label: "Operation",
        type: "select",
        options: [
          { label: "Send Email", value: "send" },
          { label: "Send Template Email", value: "sendTemplate" },
          { label: "Add Contact", value: "addContact" },
          { label: "Get Contact", value: "getContact" },
        ],
        defaultValue: "send",
      },
      { key: "to", label: "To Email", type: "text", defaultValue: "" },
      { key: "subject", label: "Subject", type: "text", defaultValue: "" },
      { key: "body", label: "Body", type: "textarea", defaultValue: "" },
    ],
  },
  {
    type: "stripe",
    label: "Stripe",
    description: "Manage Stripe payments and customers",
    category: "integration",
    icon: "CreditCard",
    configFields: [
      {
        key: "resource",
        label: "Resource",
        type: "select",
        options: [
          { label: "Charge", value: "charge" },
          { label: "Customer", value: "customer" },
          { label: "Payment Intent", value: "paymentIntent" },
          { label: "Invoice", value: "invoice" },
          { label: "Subscription", value: "subscription" },
          { label: "Product", value: "product" },
        ],
        defaultValue: "customer",
      },
      {
        key: "operation",
        label: "Operation",
        type: "select",
        options: [
          { label: "Get", value: "get" },
          { label: "Create", value: "create" },
          { label: "Update", value: "update" },
          { label: "List", value: "list" },
          { label: "Delete", value: "delete" },
        ],
        defaultValue: "list",
      },
      { key: "id", label: "ID", type: "text", defaultValue: "" },
    ],
  },
];

/* ================================================================== */
/*  UTILITY                                                           */
/* ================================================================== */

const utilityNodes: NodeDefinition[] = [
  {
    type: "debugLog",
    label: "Debug / Log",
    description: "Log data for debugging purposes",
    category: "utility",
    icon: "Eye",
    configFields: [
      {
        key: "logLevel",
        label: "Level",
        type: "select",
        options: [
          { label: "Info", value: "info" },
          { label: "Warn", value: "warn" },
          { label: "Error", value: "error" },
          { label: "Debug", value: "debug" },
        ],
        defaultValue: "info",
      },
      { key: "message", label: "Message", type: "textarea", defaultValue: "" },
    ],
  },
  {
    type: "errorHandler",
    label: "Error Handler",
    description: "Catch and handle workflow errors",
    category: "utility",
    icon: "ShieldAlert",
    configFields: [
      {
        key: "onError",
        label: "On Error",
        type: "select",
        options: [
          { label: "Continue", value: "continue" },
          { label: "Stop Workflow", value: "stop" },
          { label: "Retry", value: "retry" },
        ],
        defaultValue: "continue",
      },
      { key: "maxRetries", label: "Max Retries", type: "number", defaultValue: 3 },
      { key: "fallbackValue", label: "Fallback Value", type: "text", defaultValue: "" },
    ],
  },
  {
    type: "delay",
    label: "Delay",
    description: "Add fixed delay between operations",
    category: "utility",
    icon: "Pause",
    configFields: [
      { key: "amount", label: "Delay (ms)", type: "number", defaultValue: 1000 },
    ],
  },
  {
    type: "retry",
    label: "Retry",
    description: "Retry failed operations with backoff",
    category: "utility",
    icon: "RotateCw",
    configFields: [
      { key: "maxRetries", label: "Max Retries", type: "number", defaultValue: 3 },
      { key: "waitBetween", label: "Wait Between (ms)", type: "number", defaultValue: 1000 },
      { key: "exponentialBackoff", label: "Exponential Backoff", type: "toggle", defaultValue: true },
    ],
  },
  {
    type: "functionItem",
    label: "Function Item",
    description: "Transform each item with an expression",
    category: "utility",
    icon: "Sparkles",
    configFields: [
      { key: "expression", label: "Expression", type: "textarea", defaultValue: "return item;" },
    ],
  },
];

/* ================================================================== */
/*  MASTER LIST + LOOKUP                                              */
/* ================================================================== */

export const nodeDefinitions: NodeDefinition[] = [
  ...triggerNodes,
  ...aiNodes,
  ...flowNodes,
  ...dataNodes,
  ...toolsNodes,
  ...actionNodes,
  ...communicationNodes,
  ...integrationNodes,
  ...utilityNodes,
];

export function getNodeDefinition(type: string) {
  return nodeDefinitions.find((node) => node.type === type) ?? null;
}

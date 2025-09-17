import express, { Request, Response } from 'express';
import axios, { AxiosInstance } from 'axios';
import 'dotenv/config'; // Loads .env file

// --- Configuration ---
const PORT = process.env.PORT || 12009;
const SONARR_URL = process.env.SONARR_URL;
const SONARR_API_KEY = process.env.SONARR_API_KEY;

// --- Basic Validation ---
if (!SONARR_URL || !SONARR_API_KEY) {
  console.error("FATAL ERROR: SONARR_URL and SONARR_API_KEY must be defined in your environment variables.");
  process.exit(1);
}

// --- Sonarr API Client ---
const sonarrApi: AxiosInstance = axios.create({
  baseURL: SONARR_URL,
  headers: {
    'X-Api-Key': SONARR_API_KEY,
  },
});

// --- MCP Tool Definitions ---
const tools = [
  {
    name: 'listSeries',
    description: 'Retrieves a list of all TV series currently being tracked by Sonarr.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    },
  },
  {
    name: 'getCalendar',
    description: 'Fetches a list of upcoming and recently aired episodes from the Sonarr calendar for a given date range.',
    inputSchema: {
      type: 'object',
      properties: {
        startDate: { type: 'string', format: 'date', description: "Start date in YYYY-MM-DD format. Defaults to today if not provided." },
        endDate: { type: 'string', format: 'date', description: "End date in YYYY-MM-DD format. Defaults to 7 days from start date if not provided." }
      },
      required: []
    },
  },
  {
    name: 'lookupSeries',
    description: 'Searches for a new TV series by name to get its details required for adding it.',
    inputSchema: {
      type: 'object',
      properties: {
        searchTerm: { type: 'string', description: 'The name of the TV series to search for.' },
      },
      required: ['searchTerm'],
    },
  },
  {
    name: 'addSeries',
    description: 'Adds a new TV series to Sonarr. Requires details typically obtained from lookupSeries, along with user preferences like quality profile and root folder.',
    inputSchema: {
      type: 'object',
      properties: {
        tvdbId: { type: 'number', description: 'The TVDB ID of the series to add. Found via lookupSeries.' },
        title: { type: 'string', description: 'The title of the series.' },
        qualityProfileId: { type: 'number', description: 'The ID of the quality profile to use. The user must provide this.' },
        rootFolderPath: { type: 'string', description: 'The absolute path on the server where the series should be stored. The user must provide this.' },
        monitored: { type: 'boolean', description: 'Set to true to monitor the series for new episodes. Defaults to true.' },
        searchForMissingEpisodes: { type: 'boolean', description: 'Set to true to search for missing episodes after adding. Defaults to false.' }
      },
      required: ['tvdbId', 'title', 'qualityProfileId', 'rootFolderPath'],
    },
  },
  {
    name: 'getMonitoredEpisodes',
    description: 'Retrieves all monitored episodes for a specific series. Useful for checking which episodes are being tracked for download.',
    inputSchema: {
      type: 'object',
      properties: {
        seriesId: { type: 'number', description: 'The ID of the series to get monitored episodes for. Can be found via listSeries.' },
        seriesTitle: { type: 'string', description: 'Alternative: The title of the series to search for. Will be used to find the series ID if seriesId is not provided.' }
      },
      required: [],
    },
  },
  {
    name: 'searchMonitoredEpisodes',
    description: 'Triggers Sonarr to actively search for monitored episodes of a specific series. This will queue download searches for missing episodes.',
    inputSchema: {
      type: 'object',
      properties: {
        seriesId: { type: 'number', description: 'The ID of the series to search episodes for. Can be found via listSeries.' },
        seriesTitle: { type: 'string', description: 'Alternative: The title of the series to search for. Will be used to find the series ID if seriesId is not provided.' }
      },
      required: [],
    },
  }
];

// Legacy tool format for backward compatibility with mcp.discover
const legacyTools = [
  {
    type: 'function',
    function: {
      name: 'listSeries',
      description: 'Retrieves a list of all TV series currently being tracked by Sonarr.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getCalendar',
      description: 'Fetches a list of upcoming and recently aired episodes from the Sonarr calendar for a given date range.',
      parameters: {
        type: 'object',
        properties: {
            startDate: { type: 'string', format: 'date', description: "Start date in YYYY-MM-DD format. Defaults to today if not provided." },
            endDate: { type: 'string', format: 'date', description: "End date in YYYY-MM-DD format. Defaults to 7 days from start date if not provided." }
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'lookupSeries',
      description: 'Searches for a new TV series by name to get its details required for adding it.',
      parameters: {
        type: 'object',
        properties: {
          searchTerm: { type: 'string', description: 'The name of the TV series to search for.' },
        },
        required: ['searchTerm'],
      },
    },
  },
  {
    type: 'function',
    function: {
        name: 'addSeries',
        description: 'Adds a new TV series to Sonarr. Requires details typically obtained from lookupSeries, along with user preferences like quality profile and root folder.',
        parameters: {
            type: 'object',
            properties: {
                tvdbId: { type: 'number', description: 'The TVDB ID of the series to add. Found via lookupSeries.' },
                title: { type: 'string', description: 'The title of the series.' },
                qualityProfileId: { type: 'number', description: 'The ID of the quality profile to use. The user must provide this.' },
                rootFolderPath: { type: 'string', description: 'The absolute path on the server where the series should be stored. The user must provide this.' },
                monitored: { type: 'boolean', description: 'Set to true to monitor the series for new episodes. Defaults to true.' },
                searchForMissingEpisodes: { type: 'boolean', description: 'Set to true to search for missing episodes after adding. Defaults to false.' }
            },
            required: ['tvdbId', 'title', 'qualityProfileId', 'rootFolderPath'],
        },
    },
  },
  {
    type: 'function',
    function: {
        name: 'getMonitoredEpisodes',
        description: 'Retrieves all monitored episodes for a specific series. Useful for checking which episodes are being tracked for download.',
        parameters: {
            type: 'object',
            properties: {
                seriesId: { type: 'number', description: 'The ID of the series to get monitored episodes for. Can be found via listSeries.' },
                seriesTitle: { type: 'string', description: 'Alternative: The title of the series to search for. Will be used to find the series ID if seriesId is not provided.' }
            },
            required: [],
        },
    },
  },
  {
    type: 'function',
    function: {
        name: 'searchMonitoredEpisodes',
        description: 'Triggers Sonarr to actively search for monitored episodes of a specific series. This will queue download searches for missing episodes.',
        parameters: {
            type: 'object',
            properties: {
                seriesId: { type: 'number', description: 'The ID of the series to search episodes for. Can be found via listSeries.' },
                seriesTitle: { type: 'string', description: 'Alternative: The title of the series to search for. Will be used to find the series ID if seriesId is not provided.' }
            },
            required: [],
        },
    },
  }
];

// --- Tool Implementation ---
const toolImplementations: { [key: string]: (params: any) => Promise<any> } = {
  listSeries: async () => {
    const { data } = await sonarrApi.get('/api/v3/series');
    // Return a simplified list for cleaner AI output
    return data.map((series: any) => ({
      title: series.title,
      year: series.year,
      status: series.status,
      monitored: series.monitored,
    }));
  },

  getCalendar: async ({ startDate, endDate }: { startDate?: string; endDate?: string }) => {
    const start = startDate || new Date().toISOString().split('T')[0];
    const end = endDate || new Date(new Date(start).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const { data } = await sonarrApi.get('/api/v3/calendar', {
        params: { start, end, unmonitored: false }
    });

    return data.map((ep: any) => ({
        series: ep.series.title,
        season: ep.seasonNumber,
        episode: ep.episodeNumber,
        title: ep.title,
        airDate: ep.airDateUtc,
        hasFile: ep.hasFile,
    }));
  },

  lookupSeries: async ({ searchTerm }: { searchTerm: string }) => {
    const { data } = await sonarrApi.get('/api/v3/series/lookup', { params: { term: searchTerm } });
    if(data.length === 0) return "No series found matching that term.";
    // Return key details needed for adding the series
    return data.map((series: any) => ({
        title: series.title,
        year: series.year,
        tvdbId: series.tvdbId,
        seasons: series.seasons.map((s:any) => ({ seasonNumber: s.seasonNumber, monitored: s.monitored})),
    }));
  },
  
  addSeries: async ({
    tvdbId,
    title,
    qualityProfileId,
    rootFolderPath,
    monitored = true,
    searchForMissingEpisodes = false
  }: {
    tvdbId: number;
    title: string;
    qualityProfileId: number;
    rootFolderPath: string;
    monitored?: boolean;
    searchForMissingEpisodes?: boolean;
  }) => {
      // First, lookup the full series object from Sonarr using the tvdbId to ensure we have all required fields.
      const { data: seriesData } = await sonarrApi.get('/api/v3/series/lookup', { params: { term: `tvdb:${tvdbId}` } });
      if (!seriesData || seriesData.length === 0) {
          throw new Error(`Could not find series with tvdbId: ${tvdbId}`);
      }
      const seriesToAdd = seriesData[0];
  
      // Construct the payload for the POST request
      const payload = {
          ...seriesToAdd, // Use the full object from the lookup
          qualityProfileId,
          rootFolderPath,
          monitored,
          addOptions: {
              searchForMissingEpisodes
          }
      };
      
      const { data } = await sonarrApi.post('/api/v3/series', payload);
      return { success: true, title: data.title, id: data.id, message: "Series added successfully." };
  },

  getMonitoredEpisodes: async ({ seriesId, seriesTitle }: { seriesId?: number; seriesTitle?: string }) => {
    let targetSeriesId = seriesId;
    
    // If seriesId is not provided, try to find it using seriesTitle
    if (!targetSeriesId && seriesTitle) {
      const { data: allSeries } = await sonarrApi.get('/api/v3/series');
      const foundSeries = allSeries.find((series: any) =>
        series.title.toLowerCase().includes(seriesTitle.toLowerCase())
      );
      
      if (!foundSeries) {
        return `No series found matching title: "${seriesTitle}"`;
      }
      
      targetSeriesId = foundSeries.id;
    }
    
    if (!targetSeriesId) {
      return "Either seriesId or seriesTitle must be provided.";
    }
    
    // Get all episodes for the series
    const { data: episodes } = await sonarrApi.get('/api/v3/episode', {
      params: { seriesId: targetSeriesId }
    });
    
    // Filter for monitored episodes only
    const monitoredEpisodes = episodes.filter((episode: any) => episode.monitored);
    
    if (monitoredEpisodes.length === 0) {
      return `No monitored episodes found for series ID: ${targetSeriesId}`;
    }
    
    // Return simplified episode information
    return {
      seriesId: targetSeriesId,
      seriesTitle: monitoredEpisodes[0]?.series?.title || 'Unknown',
      totalMonitoredEpisodes: monitoredEpisodes.length,
      episodes: monitoredEpisodes.map((episode: any) => ({
        id: episode.id,
        seasonNumber: episode.seasonNumber,
        episodeNumber: episode.episodeNumber,
        title: episode.title,
        airDate: episode.airDateUtc,
        hasFile: episode.hasFile,
        monitored: episode.monitored,
        overview: episode.overview
      }))
    };
  },

  searchMonitoredEpisodes: async ({ seriesId, seriesTitle }: { seriesId?: number; seriesTitle?: string }) => {
    let targetSeriesId = seriesId;
    
    // If seriesId is not provided, try to find it using seriesTitle
    if (!targetSeriesId && seriesTitle) {
      const { data: allSeries } = await sonarrApi.get('/api/v3/series');
      const foundSeries = allSeries.find((series: any) =>
        series.title.toLowerCase().includes(seriesTitle.toLowerCase())
      );
      
      if (!foundSeries) {
        return `No series found matching title: "${seriesTitle}"`;
      }
      
      targetSeriesId = foundSeries.id;
    }
    
    if (!targetSeriesId) {
      return "Either seriesId or seriesTitle must be provided.";
    }
    
    // Trigger a series search command
    const commandPayload = {
      name: "SeriesSearch",
      seriesId: targetSeriesId
    };
    
    try {
      const { data: command } = await sonarrApi.post('/api/v3/command', commandPayload);
      
      return {
        success: true,
        message: `Search command queued for series ID: ${targetSeriesId}`,
        commandId: command.id,
        commandName: command.name,
        status: command.status || 'queued',
        seriesId: targetSeriesId
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to queue search command: ${error.response?.data?.message || error.message}`,
        seriesId: targetSeriesId
      };
    }
  }
};

// --- Express Server Setup ---
const app = express();

// Add CORS middleware for metamcp compatibility
app.use((req: Request, res: Response, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  
  next();
});

app.use(express.json());

// Add connection logging middleware
app.use((req: Request, res: Response, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path} from ${req.ip}`);
  next();
});

// MCP Endpoint
app.post('/mcp', async (req: Request, res: Response) => {
  const { jsonrpc, method, params, id } = req.body;

  if (jsonrpc !== '2.0' || !method) {
    return res.status(400).json({ jsonrpc: '2.0', error: { code: -32600, message: 'Invalid Request' }, id: id || null });
  }

  try {
    let result;
    if (method === 'mcp.discover') {
      result = { tools: legacyTools };
    } else if (method === 'initialize') {
      // Standard MCP initialization
      result = {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {}
        },
        serverInfo: {
          name: 'sonarr-mcp-server',
          version: '1.1.0'
        }
      };
    } else if (method === 'tools/list') {
      // Standard MCP tools list
      result = { tools };
    } else if (method === 'tools/call') {
      // Standard MCP tool call
      const { name, arguments: args } = params;
      const toolImplementation = toolImplementations[name];
      if (!toolImplementation) {
        throw { code: -32601, message: 'Tool not found' };
      }
      const toolResult = await toolImplementation(args || {});
      result = {
        content: [
          {
            type: 'text',
            text: typeof toolResult === 'string' ? toolResult : JSON.stringify(toolResult, null, 2)
          }
        ]
      };
    } else if (method === 'notifications/initialized') {
      // Standard MCP notification - just acknowledge
      result = {};
    } else {
      const toolImplementation = toolImplementations[method];
      if (!toolImplementation) {
        throw { code: -32601, message: 'Method not found' };
      }
      result = await toolImplementation(params || {});
    }
    return res.json({ jsonrpc: '2.0', result, id });
  } catch (error: any) {
    console.error(`Error processing method '${method}':`, error.response?.data || error.message);
    const code = error.code || -32603;
    const message = error.response?.data?.message || error.message || 'Internal error';
    return res.status(500).json({ jsonrpc: '2.0', error: { code, message }, id });
  }
});

// Health Check Endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Sonarr MCP Server running on http://localhost:${PORT}`);
  console.log(`MCP endpoint available at http://localhost:${PORT}/mcp`);
});
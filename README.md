# Sonarr MCP Server

A Model Context Protocol (MCP) server that provides integration with Sonarr for managing TV series. This server allows AI assistants to interact with your Sonarr instance to list series, check calendars, search for new shows, and add series to your collection.

## Features

- **List Series**: Retrieve all TV series currently tracked by Sonarr
- **Calendar**: Get upcoming and recently aired episodes
- **Series Lookup**: Search for new TV series by name
- **Add Series**: Add new TV series to Sonarr with custom settings

## Prerequisites

- Node.js (version 14 or higher)
- npm or yarn
- A running Sonarr instance
- Sonarr API key

## Installation

1. Clone this repository:
   ```bash
   git clone <repository-url>
   cd sonarr-mcp-server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```

4. Edit the `.env` file with your Sonarr configuration:
   ```env
   PORT=12009
   SONARR_URL=http://your-sonarr-host:8989
   SONARR_API_KEY=your-sonarr-api-key-here
   ```

## Configuration

### Getting Your Sonarr API Key

1. Open your Sonarr web interface
2. Go to **Settings** > **General**
3. Scroll down to the **Security** section
4. Copy the **API Key**

### Environment Variables

- `PORT`: The port the MCP server will listen on (default: 12009)
- `SONARR_URL`: The full URL to your Sonarr instance
- `SONARR_API_KEY`: Your Sonarr API key

## Usage

### Development

Run the server in development mode with hot reloading:

```bash
npm run dev
```

### Production

Build and run the server:

```bash
npm run build
npm start
```

### Health Check

The server provides a health check endpoint:

```bash
curl http://localhost:12009/health
```

## API Endpoints

### MCP Endpoint

The main MCP endpoint is available at:
```
POST http://localhost:12009/mcp
```

### Available Tools

1. **listSeries**: Get all series tracked by Sonarr
2. **getCalendar**: Get upcoming/recent episodes (optional date range)
3. **lookupSeries**: Search for new series by name
4. **addSeries**: Add a new series to Sonarr

## Integration with AI Assistants

This server implements the Model Context Protocol (MCP) and can be integrated with compatible AI assistants. The server supports both standard MCP protocol and legacy tool discovery for backward compatibility.

### Example MCP Request

```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "listSeries",
    "arguments": {}
  },
  "id": 1
}
```

## Docker Support

A Dockerfile is included for containerized deployment:

```bash
docker build -t sonarr-mcp-server .
docker run -p 12009:12009 --env-file .env sonarr-mcp-server
```

## Troubleshooting

### Common Issues

1. **Connection refused**: Ensure Sonarr is running and accessible at the configured URL
2. **Unauthorized**: Verify your API key is correct
3. **Port already in use**: Change the PORT in your `.env` file

### Logs

The server logs all requests and errors to the console. Check the logs for detailed error information.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

ISC License

## Support

For issues and questions, please open an issue on the GitHub repository.
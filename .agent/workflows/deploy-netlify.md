---
description: How to deploy Health Plan App to Netlify (v1.6.0+)
---

Follow these steps to deploy the application to Netlify using the pre-configured Site ID.

1.  **Build the Project**:
    Ensure the project is built for production.
    ```bash
    npm run build
    ```

2.  **Deploy using Site ID**:
    Use the Netlify MCP tool to deploy the `dist` folder.
    
    *   **Site ID**: `01514592-a3b1-4e1e-85fc-d7a8f607caf0`
    *   **Directory**: `/Users/peter/Desktop/App Working/Health/dist`

    **Tool Call Example**:
    ```json
    {
      "selectSchema": {
        "operation": "deploy-site",
        "params": {
          "deployDirectory": "/Users/peter/Desktop/App Working/Health/dist",
          "siteId": "01514592-a3b1-4e1e-85fc-d7a8f607caf0"
        }
      }
    }
    ```

    *Note: Always use `mcp_netlify_netlify-deploy-services-updater` for this task.*

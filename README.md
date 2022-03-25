# UX tools

## Process SVG 

```bash
$> docker build -t process-svg ./process-svg 
$> docker run -it -p 1234:1234 process-svg
```

## Figma

Talend's icons are built over Figma.

### Downloader

This script helps you to get all Icons stored in the Figma file and to optimize them one-by-one in the meantime.

```mermaid
sequenceDiagram
    participant C as Client
    participant F as Figma
    participant S as Server
    F->>C: GET icon
    C->>S: POST icon
    activate S
    S->>C: GET optimized icon
    deactivate S
```

### Plugin

This plugin help you to generate the simplest copy of an icon, using an API hosted at Talend.

```mermaid
sequenceDiagram
    participant F as Figma
    participant S as Server
    F->>S: POST current selection
    activate S
    S->>F: GET optimized icon
    deactivate S
```

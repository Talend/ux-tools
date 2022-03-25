# UX tools

## Process SVG 

Function as a Service which takes a raw SVG file as input and will return an optimized SVG as output.
It's only reachable on the Talend network at https://svg-optimizer.tools.dev.datapwn.com.

## Figma

Talend's icons are built over Figma. 
And Figma is the single source of truth where raw icons must continue to live.
That's why we want to automate the process of optimization even in our Figma files and in the codebase.

To do so, we have to ways: 
- the downloader bin, which can be part of a GitHub Action triggered by webhook
- the Figma plugin, which can be used on one-shot without wasting time to cut of everything which not concerns our `neutral/icon` design token.

### Downloader

This script helps you to get all Icons stored in the Figma file and, in the meantime, to optimize them one-by-one on the fly.

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

This plugin helps you to generate the simplest optimized copy of an icon, using the SVG Process service, next to the original.

```mermaid
sequenceDiagram
    participant F as Figma
    participant S as Server
    F->>S: POST current selection
    activate S
    S->>F: GET optimized icon
    deactivate S
```

# CinemaStream Media Player

CinemaStream is a professional, browser based application designed for high performance playback of local video files. By leveraging the modern File System Access API, it provides a seamless bridge between web technologies and local storage, allowing users to manage and watch their media libraries directly in the browser without uploading any data.

## Table of Contents

1. [Introduction](#introduction)
2. [Key Features](#key-features)
3. [Core Functionalities](#core-functionalities)
4. [Technologies Used](#technologies-used)
5. [Getting Started](#getting-started)
6. [Docker Deployment](#docker-deployment)
7. [Project Structure](#project-structure)
8. [Performance and Security](#performance-and-security)
9. [License](#license)

## Introduction

CinemaStream is built for users who require a sophisticated interface for local media consumption. Unlike traditional web players that require file uploads, this application uses the File System Access API to stream content directly from your local disk. This approach ensures maximum privacy and eliminates the latency associated with network based media streaming.

## Key Features

*   Local Directory Integration: Access entire folders and subfolders using the native file picker.
*   Automated Subtitle Discovery: Systematically scans for .srt and .vtt files and associates them with corresponding video files.
*   Playback Persistence: Automatically saves the current timestamp of every video to local storage for seamless resumption.
*   Visual Progress Tracking: Maintains a history of watched content with clear visual indicators for completed media.
*   Theater Mode: Offers an immersive, distraction free viewing experience with specialized layout transitions.
*   Responsive Interface: Optimized for various screen sizes with a collapsible management sidebar.

## Core Functionalities

### File System Integration
The application utilizes asynchronous directory crawling to build a virtual tree of your media. It filters for common video extensions such as mp4, mkv, and avi, ensuring a clean and focused navigation experience.

### Media Management
The sidebar provides two distinct views for the library: a folder tree for hierarchical navigation and a flat playlist view for quick access to all discovered content. Users can also clear their entire playback history or switch between light and dark themes via the integrated settings menu.

### Advanced Playback Controls
Beyond standard play and pause functionality, the player includes playback speed adjustments, volume memory, and full screen support. The interface is designed to hide controls during active playback to maximize visual space.

## Technologies Used

*   Framework: Next.js 16 (App Router)
*   Runtime Library: React 19
*   Language: TypeScript
*   Styling: Tailwind CSS 4
*   Icons: Lucide React
*   State Management: React Hooks (useState, useEffect, useCallback, useRef)
*   Storage: Web Storage API (LocalStorage) and File System Access API

## Getting Started

### Prerequisites

*   Node.js 24 (LTS) or higher
*   A modern web browser with File System Access API support (Chrome, Edge, or Opera)

### Local Development

1. Clone the repository to your local machine.
2. Install the necessary dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to http://localhost:3000.

### Production Build

To create an optimized production build, execute the following commands:

```bash
npm run build
npm run start
```

## Docker Deployment

This project includes a multi stage Dockerfile optimized for minimal image size using the Next.js standalone output mode.

1. Build the Docker image:
   ```bash
   docker build -t cinemastream .
   ```
2. Run the container:
   ```bash
   docker run -p 3000:3000 cinemastream
   ```

## Project Structure

*   /src/app: Contains the layout and main entry point for the Next.js application.
*   /src/components/VideoPlayer: Includes all UI components such as VideoControls, Sidebar, and SubtitleSelector.
*   /src/lib: Contains utility functions for file system operations, subtitle matching, and storage management.
*   /src/types: Centralized TypeScript interface and type definitions.
*   /public: Static assets including the custom CinemaStream favicon.

## Performance and Security

CinemaStream prioritize user security by never transmitting file data to a server. All processing occurs locally within the browser sandbox. The application is further optimized through code splitting and the use of the Next.js standalone build target to ensure rapid load times and low resource consumption.

## License

This project is licensed under the MIT License.

# Probability vs Likelihood Visualization

An interactive visualization demonstrating the difference between probability and likelihood in the context of a normal distribution. View the live demo at [https://swankylegg.github.io/probability-vs-likelihood/](https://swankylegg.github.io/probability-vs-likelihood/)

I was bad at stats, so this is my attempt at redeeming myself after being inspired by this [YouTube video](https://www.youtube.com/watch?v=XepXtl9YKwc) from StatQuest.

## Overview

This project provides an interactive D3.js visualization that helps users understand the fundamental difference between probability and likelihood in statistics. Users can:

- Toggle between probability and likelihood modes
- Interact with the normal distribution curve
- See real-time updates of probability/likelihood values
- Drag points to explore different scenarios

## Features

- Interactive normal distribution visualization using D3.js
- Dynamic switching between probability and likelihood perspectives
- Responsive design that adapts to different screen sizes
- Real-time curve updates and value calculations

## Tech Stack

- Vanilla JavaScript (ES6+)
- D3.js for visualization
- Custom build system for development and deployment

## Getting Started

### Prerequisites

- Node.js (latest LTS version recommended)
- npm

### Installation

1. Clone the repository:

```bash
git clone https://github.com/swankylegg/probability-vs-likelihood.git
cd probability-vs-likelihood
```

2. Install dependencies:

```bash
npm install
```

### Development

To run the development server with hot reloading:

```bash
npm start
```

### Building

To build the project for production:

```bash
npm run build
```

### Deployment

The project is automatically deployed to GitHub Pages when changes are pushed to the main branch. To manually deploy:

```bash
npm run deploy
```

## License

MIT

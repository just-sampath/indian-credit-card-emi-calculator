# Indian Credit Card EMI Calculator

React rebuild of the `reference.jsx` calculator with the same UI structure, copy, and calculation behavior, organized as a Vite project and configured for GitHub Pages deployment.

## Stack

- React
- Vite
- Tailwind CSS
- Vitest
- Testing Library

## Local Development

Install dependencies:

```bash
npm install
```

Start the dev server:

```bash
npm run dev
```

## Testing

Run the test suite:

```bash
npm test
```

## Production Build

Create the production build:

```bash
npm run build
```

## Deployment

The repository includes `.github/workflows/deploy.yml`, which:

1. installs dependencies with `npm ci`
2. runs the tests
3. builds the app
4. deploys `dist/` to GitHub Pages

Enable GitHub Pages in the repository settings and choose **GitHub Actions** as the source.

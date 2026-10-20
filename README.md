# Indian Credit Card EMI Calculator

A calculator for Indian credit card EMIs. For No Cost and regular EMIs it shows the monthly statement debit, interest, 18% GST, processing fees and pre-closure costs. It began as a React rebuild of `reference.jsx` and is set up as a Vite project that deploys to GitHub Pages.

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

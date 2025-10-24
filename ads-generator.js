/*
 * Simple Ads Generator Service
 *
 * This Express server exposes one endpoint, `/generate-ads`, that returns a set
 * of ad creatives based on a company's brand kit and a handful of high‑performing
 * templates learned from historical performance data.  The service depends on
 * a running brand kit proxy (see brandfetch‑proxy.js) which returns colours,
 * logos and other metadata given a domain.  You can specify the brand proxy
 * URL using the environment variable `BRANDFETCH_URL`.  If unset, it falls
 * back to a default hosted endpoint.
 *
 * Example request:
 *   GET /generate-ads?domain=example.com&count=5
 *
 * Returns a JSON object with an array of ads.  Each ad includes a headline,
 * body text, call‑to‑action and colour palette derived from the brand kit.
 */

const express = require('express');
// Import node-fetch in a way that works with both CommonJS and ES modules.  If
// node-fetch returns an object with a default property (as in ESM), use
// that; otherwise use the returned function directly.  This avoids the
// "fetch is not a function" error seen when running under older Node
// versions or certain bundlers.
const fetchImport = require('node-fetch');
const fetch = fetchImport.default || fetchImport;

const app = express();

// Configure the base URL for the brand kit proxy.  By default this
// points to the previously deployed proxy on Render.  When deploying on
// another host, set the BRANDFETCH_URL environment variable accordingly.
const BRAND_PROXY_BASE = process.env.BRANDFETCH_URL ||
  'https://render-project-cx98.onrender.com/brandkit';

// A list of ad templates derived from analysis of historical creatives.
// Each template is a function that accepts the brand name and returns
// a headline, body text and call‑to‑action (cta).  You can extend this
// array with additional templates to diversify the output.
const templates = [
  (brand) => ({
    headline: `Experience ${brand} first‑hand`,
    text: `See how ${brand} can transform your business. Book a live demo today!`,
    cta: 'REQUEST_DEMO'
  }),
  (brand) => ({
    headline: `Join our upcoming ${brand} webinar`,
    text: `Learn industry best practices and how ${brand} is leading the way in innovation. Reserve your seat now.`,
    cta: 'ATTEND'
  }),
  (brand) => ({
    headline: `Ready to get started with ${brand}?`,
    text: `Apply now and start leveraging ${brand} to grow your business.`,
    cta: 'APPLY_NOW'
  }),
  (brand) => ({
    headline: `Unlock your exclusive ${brand} guide`,
    text: `Download the full document and learn how ${brand} can help you optimise workflows.`,
    cta: 'UNLOCK_FULL_DOCUMENT'
  }),
  (brand) => ({
    headline: `Discover the power of ${brand}`,
    text: `Learn more about ${brand}'s solutions and see why industry leaders choose us.`,
    cta: 'LEARN_MORE'
  }),
  (brand) => ({
    headline: `Start your free trial of ${brand}`,
    text: `Sign up today and experience the benefits of ${brand} without any commitment.`,
    cta: 'SIGN_UP'
  }),
  (brand) => ({
    headline: `Free eBook: ${brand} best practices`,
    text: `Download our free eBook packed with insights and strategies to get the most out of ${brand}.`,
    cta: 'DOWNLOAD'
  }),
  (brand) => ({
    headline: `Get your personalised ${brand} quote`,
    text: `Find out how affordable ${brand} can be for your organisation.`,
    cta: 'GET_QUOTE'
  }),
  (brand) => ({
    headline: `Register for an upcoming ${brand} workshop`,
    text: `Hands‑on training from the experts. Reserve your spot and accelerate your learning.`,
    cta: 'REGISTER'
  }),
  (brand) => ({
    headline: `Join the ${brand} community`,
    text: `Be part of a vibrant network of professionals and stay ahead with the latest updates from ${brand}.`,
    cta: 'JOIN'
  })
];

/**
 * Fetch the brand kit for a given domain.
 * @param {string} domain
 * @returns {Promise<Object>} Brand kit object as returned from the proxy.
 */
async function fetchBrandKit(domain) {
  const url = `${BRAND_PROXY_BASE}?domain=${encodeURIComponent(domain)}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch brand kit for ${domain}: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

/**
 * Choose templates and generate ad creatives based on the brand kit.
 * @param {Object} kit Brand kit data
 * @param {number} count Number of ads to generate
 * @returns {Array<Object>} Array of ad objects
 */
function generateAdsForKit(kit, count) {
  const ads = [];
  const brandName = kit.name || kit.domain || 'Your brand';
  // Determine a primary colour from the brand kit.  If colours are available,
  // choose the accent colour; otherwise fallback to a default.
  let primaryColour = '#0052cc';
  if (Array.isArray(kit.colors) && kit.colors.length > 0) {
    // Choose the first non‑null hex value
    const accent = kit.colors.find((c) => c.hex);
    if (accent && accent.hex) primaryColour = accent.hex;
  }
  for (let i = 0; i < count; i++) {
    const templateFn = templates[i % templates.length];
    const { headline, text, cta } = templateFn(brandName);
    ads.push({
      headline,
      text,
      cta,
      color: primaryColour
    });
  }
  return ads;
}

app.get('/generate-ads', async (req, res) => {
  const domain = req.query.domain;
  const count = parseInt(req.query.count, 10) || 3;
  if (!domain) {
    return res.status(400).json({ error: 'Missing required query parameter: domain' });
  }
  try {
    const kit = await fetchBrandKit(domain);
    const ads = generateAdsForKit(kit, count);
    return res.json({ domain, ads });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Ads generator service is running on port ${PORT}`);
});
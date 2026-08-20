import assert from "node:assert/strict";
import { siteOrigin } from "../src/lib/site";

{
  const prev = {
    site: process.env.NEXT_PUBLIC_SITE_URL,
    prod: process.env.VERCEL_PROJECT_PRODUCTION_URL,
    url: process.env.VERCEL_URL,
  };
  delete process.env.NEXT_PUBLIC_SITE_URL;
  delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
  delete process.env.VERCEL_URL;
  assert.equal(siteOrigin(), "http://localhost:3000");

  process.env.VERCEL_URL = "stampede-abc.vercel.app";
  assert.equal(siteOrigin(), "https://stampede-abc.vercel.app");

  process.env.VERCEL_PROJECT_PRODUCTION_URL = "stampede.vercel.app";
  assert.equal(siteOrigin(), "https://stampede.vercel.app");

  process.env.NEXT_PUBLIC_SITE_URL = "https://stampede.codes/";
  assert.equal(siteOrigin(), "https://stampede.codes");

  if (prev.site == null) delete process.env.NEXT_PUBLIC_SITE_URL;
  else process.env.NEXT_PUBLIC_SITE_URL = prev.site;
  if (prev.prod == null) delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
  else process.env.VERCEL_PROJECT_PRODUCTION_URL = prev.prod;
  if (prev.url == null) delete process.env.VERCEL_URL;
  else process.env.VERCEL_URL = prev.url;
}

console.log("ok site");

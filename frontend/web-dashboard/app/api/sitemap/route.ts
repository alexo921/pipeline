import { NextResponse } from 'next/server';
import { getApiUrl } from "@/lib/api-utils";

interface JobSitemapData {
  id: string;
  updatedAt: string;
}

export async function GET() {
  try {
    // Fetch active job listings from backend API
    const response = await fetch(getApiUrl("/jobs?status=active"), {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch jobs');
    }

    const jobs = await response.json() as JobSitemapData[];

    // Create the XML sitemap
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      <!-- Static Routes -->
      <url>
        <loc>https://pipelineworkforce.com</loc>
        <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
        <changefreq>daily</changefreq>
        <priority>1.0</priority>
      </url>
      <url>
        <loc>https://pipelineworkforce.com/jobs</loc>
        <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
        <changefreq>hourly</changefreq>
        <priority>1.0</priority>
      </url>
      <url>
        <loc>https://pipelineworkforce.com/about</loc>
        <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.8</priority>
      </url>
      <url>
        <loc>https://pipelineworkforce.com/contact</loc>
        <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.8</priority>
      </url>
      <url>
        <loc>https://pipelineworkforce.com/blog</loc>
        <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>
      </url>
      <url>
        <loc>https://pipelineworkforce.com/resources</loc>
        <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>
      </url>

      <!-- Dynamic Job Listings -->
      ${jobs.map((job: JobSitemapData) => `
      <url>
        <loc>https://pipelineworkforce.com/jobs/${job.id}</loc>
        <lastmod>${new Date(job.updatedAt).toISOString().split('T')[0]}</lastmod>
        <changefreq>daily</changefreq>
        <priority>0.9</priority>
      </url>
      `).join('')}
    </urlset>`;

    // Return the XML sitemap
    return new NextResponse(sitemap, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  } catch (error) {
    console.error('Error generating sitemap:', error);
    return new NextResponse('Error generating sitemap', { status: 500 });
  }
} 